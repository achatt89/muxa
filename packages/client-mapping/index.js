const canonicalToCodex = {
  'workspace.search': 'codebase_search',
  'workspace.read': 'file_read',
  'shell.run': 'terminal_execute'
};

const canonicalToCline = {
  'workspace.search': 'project_search',
  'workspace.read': 'read_file',
  'shell.run': 'run_command'
};

const canonicalToContinue = {
  'workspace.search': 'search_repo',
  'workspace.read': 'open_file',
  'shell.run': 'execute_shell'
};

function mapToolName(mapping, name) {
  return mapping[name] || name;
}

function normalizeArguments(args = {}) {
  return JSON.parse(JSON.stringify(args));
}

function mapToolCall(client, toolCall) {
  const normalizedClient = (client || '').toLowerCase();
  const canonical = {
    name: toolCall.name,
    arguments: normalizeArguments(toolCall.arguments)
  };

  if (normalizedClient === 'codex' || normalizedClient === 'cursor') {
    return {
      name: mapToolName(canonicalToCodex, canonical.name),
      arguments: canonical.arguments
    };
  }

  if (normalizedClient === 'cline' || normalizedClient === 'kilo') {
    return {
      name: mapToolName(canonicalToCline, canonical.name),
      arguments: canonical.arguments
    };
  }

  if (normalizedClient === 'continue') {
    return {
      name: mapToolName(canonicalToContinue, canonical.name),
      arguments: canonical.arguments
    };
  }

  return canonical;
}

module.exports = {
  mapToolCall,
  __mappings: {
    codex: canonicalToCodex,
    cline: canonicalToCline,
    continue: canonicalToContinue
  }
};
