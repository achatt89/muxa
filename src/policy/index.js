const path = require('node:path');
const url = require('node:url');

class PolicyViolationError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'PolicyViolationError';
    this.meta = meta;
  }
}

class PolicyManager {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.allowedHosts = new Set((options.allowedHosts || ['localhost']).map((host) => host.toLowerCase()));
    this.gitPushAllowed = options.gitPushAllowed ?? false;
    this.commitRequiresTests = options.commitRequiresTests ?? false;
  }

  assertWorkspacePath(targetPath) {
    const normalized = path.resolve(this.workspaceRoot, targetPath);
    if (!normalized.startsWith(path.resolve(this.workspaceRoot))) {
      throw new PolicyViolationError('Attempted to access path outside workspace boundary', {
        targetPath
      });
    }
    return normalized;
  }

  assertWebHost(urlString) {
    const parsed = new url.URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (!this.allowedHosts.has(host)) {
      throw new PolicyViolationError('Host not allowed by policy', { host });
    }
  }

  assertGitPushAllowed() {
    if (!this.gitPushAllowed) {
      throw new PolicyViolationError('Git push disallowed by policy');
    }
  }

  assertTestsBeforeCommit(testsRan) {
    if (this.commitRequiresTests && !testsRan) {
      throw new PolicyViolationError('Commit requires passing tests before proceeding');
    }
  }
}

module.exports = {
  PolicyManager,
  PolicyViolationError
};
