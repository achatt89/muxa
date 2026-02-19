const SUPPORTED_PROVIDERS = [
  'mock',
  'openai',
  'anthropic',
  'azure-openai',
  'azure-anthropic',
  'bedrock',
  'vertex',
  'databricks',
  'openrouter',
  'z-anthropic',
  'ollama',
  'llamacpp',
  'lmstudio'
];

const LOCAL_PROVIDERS = ['mock', 'ollama', 'llamacpp', 'lmstudio'];

const REQUIRED_CREDENTIALS = {
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  'azure-openai': ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
  'azure-anthropic': ['AZURE_ANTHROPIC_API_KEY', 'AZURE_ANTHROPIC_ENDPOINT'],
  bedrock: ['AWS_BEDROCK_ACCESS_KEY_ID', 'AWS_BEDROCK_SECRET_ACCESS_KEY'],
  vertex: ['VERTEX_API_KEY'],
  databricks: ['DATABRICKS_TOKEN'],
  openrouter: ['OPENROUTER_API_KEY'],
  'z-anthropic': ['Z_ANTHROPIC_API_KEY']
};

const TOOL_EXECUTION_MODES = ['server', 'client', 'auto'];
const ROUTING_STRATEGIES = ['single', 'hybrid'];

module.exports = {
  SUPPORTED_PROVIDERS,
  LOCAL_PROVIDERS,
  REQUIRED_CREDENTIALS,
  TOOL_EXECUTION_MODES,
  ROUTING_STRATEGIES
};
