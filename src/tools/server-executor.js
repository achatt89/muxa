'use strict';

const { exec } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

const WORKSPACE_ROOT = process.cwd();
const MAX_OUTPUT = 64000;

function ensureWorkspacePath(targetPath = '') {
  const resolved = path.resolve(WORKSPACE_ROOT, targetPath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error(`Path "${targetPath}" is outside the workspace`);
  }
  return resolved;
}

function parseArguments(raw) {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { value: raw };
    }
  }
  return raw;
}

function truncateOutput(text) {
  if (!text) {
    return '';
  }
  if (text.length <= MAX_OUTPUT) {
    return text;
  }
  return `${text.slice(0, MAX_OUTPUT)}\n\n…output truncated…`;
}

async function runTerminalCommand(args = {}) {
  const command = args.command || args.cmd || args.program;
  if (!command || typeof command !== 'string') {
    throw new Error('terminal_execute requires a "command" string');
  }
  return new Promise((resolve, reject) => {
    exec(command, { cwd: WORKSPACE_ROOT, env: process.env, maxBuffer: 2 * MAX_OUTPUT }, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) {
        reject(new Error(error.message));
        return;
      }
      const output = stdout || stderr || '';
      resolve(truncateOutput(output));
    });
  });
}

async function readFileTool(args = {}) {
  const filePath =
    args.path || args.file || args.file_path || args.filePath || args.filename || args.name;
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('file_read requires a "path"');
  }
  const resolved = ensureWorkspacePath(filePath);
  const data = await fs.readFile(resolved, args.encoding || 'utf8');
  return truncateOutput(data.toString());
}

const TOOL_ALIASES = {
  exec_command: 'terminal_execute',
  execute_command: 'terminal_execute',
  run_command: 'terminal_execute',
  run_terminal_command: 'terminal_execute',
  shell_command: 'terminal_execute',
  bash: 'terminal_execute',
  read_file: 'file_read',
  read: 'file_read',
  write_file: 'file_write',
  write: 'file_write'
};

async function executeToolCall(toolCall = {}) {
  const rawName = (toolCall.function?.name || toolCall.name || '').toLowerCase();
  const toolName = TOOL_ALIASES[rawName] || rawName;
  const args = parseArguments(toolCall.function?.arguments || toolCall.arguments || {});
  if (toolName === 'terminal_execute') {
    return runTerminalCommand(args);
  }
  if (toolName === 'shell_command') {
    return runTerminalCommand(args);
  }
  if (toolName === 'file_read') {
    return readFileTool(args);
  }
  if (toolName === 'file_write') {
    const filePath =
      args.path || args.file || args.file_path || args.filename || args.name;
    if (!filePath) {
      throw new Error('file_write requires a "path"');
    }
    const resolved = ensureWorkspacePath(filePath);
    const content = typeof args.content === 'string' ? args.content : String(args.content || '');
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, args.encoding || 'utf8');
    return `Wrote ${content.length} bytes to ${filePath}`;
  }
  return `Tool "${toolName}" is not supported in server mode`;
}

module.exports = {
  executeToolCall
};
