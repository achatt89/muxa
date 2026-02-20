'use strict';

const { randomId } = require('../state/runtime');

const TEXT_TYPES = new Set(['text', 'input_text', 'output_text']);
const TOOL_USE_TYPES = new Set(['tool_use', 'tool_call']);
const TOOL_RESULT_TYPES = new Set(['tool_result', 'function_result', 'function_call_output', 'tool_response']);

function flattenContent(content) {
  if (content === undefined || content === null) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => flattenContent(part))
      .filter((part) => part.length)
      .join('\n\n');
  }
  if (typeof content === 'object') {
    if (typeof content.text === 'string') {
      return content.text;
    }
    if (typeof content.input_text === 'string') {
      return content.input_text;
    }
    if (typeof content.output_text === 'string') {
      return content.output_text;
    }
    if (Array.isArray(content.content)) {
      return flattenContent(content.content);
    }
    if (content.content !== undefined) {
      return flattenContent(content.content);
    }
  }
  return String(content);
}

function normalizeArguments(rawArgs) {
  if (rawArgs === undefined || rawArgs === null) {
    return '{}';
  }
  if (typeof rawArgs === 'string') {
    return rawArgs;
  }
  try {
    return JSON.stringify(rawArgs);
  } catch {
    return '{}';
  }
}

function normalizeToolCall(id, name, args) {
  return {
    id,
    type: 'function',
    function: {
      name: name || 'function',
      arguments: normalizeArguments(args)
    }
  };
}

function convertResponsesToChat(body = {}) {
  const { input, model, max_tokens, temperature, top_p, tools, tool_choice, stream } = body;
  const toolCallIds = new Set();

  const safePushToolResult = (messages, callId, text, fallbackRole = 'user') => {
    if (callId && toolCallIds.has(callId)) {
      messages.push({
        role: 'tool',
        tool_call_id: callId,
        content: text || ''
      });
    } else if (text) {
      messages.push({
        role: fallbackRole,
        content: text
      });
    }
  };

  const processLegacyFunctionCall = (messages, raw) => {
    const callId = raw.call_id || raw.id || randomId('call');
    toolCallIds.add(callId);
    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: [
        normalizeToolCall(callId, raw.name || raw.function?.name, raw.arguments ?? raw.function?.arguments ?? {})
      ]
    });
  };

  const processLegacyFunctionResult = (messages, raw) => {
    const callId = raw.call_id || raw.tool_call_id || raw.id;
    const text = flattenContent(raw.output);
    safePushToolResult(messages, callId, text);
  };

  if (typeof input === 'string') {
    return {
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: input }],
      max_tokens,
      temperature,
      top_p,
      tools,
      tool_choice,
      stream: Boolean(stream)
    };
  }

  if (!Array.isArray(input)) {
    return {
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: flattenContent(input) }],
      max_tokens,
      temperature,
      top_p,
      tools,
      tool_choice,
      stream: Boolean(stream)
    };
  }

  const messages = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    if (raw.type === 'function_call') {
      processLegacyFunctionCall(messages, raw);
      continue;
    }

    if (raw.type === 'function_call_output') {
      processLegacyFunctionResult(messages, raw);
      continue;
    }

    const textChunks = [];
    const toolCalls = [];
    const toolResults = [];
    let role = raw.role || 'user';

    const handleToolResult = (callId, text) => {
      toolResults.push({ callId, text });
    };

    if (Array.isArray(raw.content)) {
      for (const part of raw.content) {
        if (!part) {
          continue;
        }
        const partType = part.type || '';
        if (TEXT_TYPES.has(partType) && (part.text || part.input_text || part.output_text || typeof part === 'string')) {
          textChunks.push(
            part.text || part.input_text || part.output_text || (typeof part === 'string' ? part : '')
          );
          continue;
        }
        if (TOOL_USE_TYPES.has(partType)) {
          const callId = part.id || raw.id || randomId('call');
          toolCallIds.add(callId);
          toolCalls.push(
            normalizeToolCall(callId, part.name || part.function?.name, part.input ?? part.arguments ?? part.function?.arguments)
          );
          continue;
        }
        if (TOOL_RESULT_TYPES.has(partType)) {
          handleToolResult(part.tool_call_id || part.call_id || part.id, flattenContent(part.content ?? part.output ?? part.text));
          continue;
        }
        if (typeof part.text === 'string') {
          textChunks.push(part.text);
        }
      }
    } else if (raw.content !== undefined) {
      textChunks.push(flattenContent(raw.content));
    } else if (raw.text !== undefined) {
      textChunks.push(flattenContent(raw.text));
    }

    if (Array.isArray(raw.tool_calls) && raw.tool_calls.length) {
      for (const call of raw.tool_calls) {
        const callId = call.id || randomId('call');
        toolCallIds.add(callId);
        toolCalls.push(
          normalizeToolCall(callId, call.function?.name || call.name, call.function?.arguments ?? call.arguments ?? {})
        );
      }
    }

    if (textChunks.length || toolCalls.length || raw.tool_call_id) {
      const baseMessage = {
        role,
        content: textChunks.filter(Boolean).join('\n\n') || null
      };

      if (toolCalls.length) {
        baseMessage.tool_calls = toolCalls;
      }
      if (raw.tool_call_id) {
        baseMessage.tool_call_id = raw.tool_call_id;
      }

      if (baseMessage.role === 'tool' && (!baseMessage.tool_call_id || !toolCallIds.has(baseMessage.tool_call_id))) {
        baseMessage.role = 'user';
        delete baseMessage.tool_call_id;
      }

      if (baseMessage.content !== null || baseMessage.tool_calls) {
        messages.push(baseMessage);
      }
    }

    for (const result of toolResults) {
      safePushToolResult(messages, result.callId, result.text, role === 'tool' ? 'user' : role || 'user');
    }
  }

  const sanitizedMessages = sanitizeChatMessages(messages);
  if (!sanitizedMessages.length) {
    sanitizedMessages.push({ role: 'user', content: '' });
  }

  return {
    model: model || 'gpt-4o',
    messages: sanitizedMessages,
    max_tokens,
    temperature,
    top_p,
    tools,
    tool_choice,
    stream: Boolean(stream)
  };
}

function sanitizeChatMessages(messages = []) {
  const seenToolCalls = new Set();
  let pendingToolCalls = new Set();
  const sanitized = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      continue;
    }

    const copy = { ...message };

    if (Array.isArray(copy.tool_calls) && copy.tool_calls.length) {
      const currentCallIds = new Set();
      copy.tool_calls = copy.tool_calls.map((call, idx) => {
        const callId = call.id || randomId(`call_${idx}`);
        seenToolCalls.add(callId);
        currentCallIds.add(callId);
        return normalizeToolCall(callId, call.function?.name || call.name, call.function?.arguments ?? call.arguments ?? {});
      });
      pendingToolCalls = currentCallIds;
    } else {
      delete copy.tool_calls;
      if (copy.role !== 'tool') {
        pendingToolCalls = new Set();
      }
    }

    if (copy.role === 'tool') {
      const callId =
        copy.tool_call_id ||
        copy.metadata?.tool_call_id ||
        copy.call_id ||
        copy.id;
      const valid =
        callId &&
        seenToolCalls.has(callId) &&
        pendingToolCalls.has(callId);
      if (!valid) {
        sanitized.push({
          role: 'assistant',
          content: copy.content || ''
        });
        pendingToolCalls = new Set();
        continue;
      }
      pendingToolCalls = new Set();
    } else if (!Array.isArray(copy.tool_calls) || !copy.tool_calls.length) {
      pendingToolCalls = new Set();
    }

    sanitized.push(copy);
  }

  return sanitized;
}

module.exports = {
  convertResponsesToChat
};
