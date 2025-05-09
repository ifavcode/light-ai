export enum ModelType {
  DEEP_SEEK = 'deepseek',
  CLAUDE = 'claude',
  CHATGPT = 'chatgpt',
  QIAN_WEN = 'qianwen',
  QIAN_FAN = 'qianfan',
  DOU_BAO = 'doubao',
  KI_MI = 'kimi',
  GE_MINI = 'gemini',
  ZHI_PU = 'zhipu',
  HUN_YUAN = 'hunyuan',
  YUE_WEN = 'yuewen',
  BAI_CHUAN = 'baichuan',
  XUN_FEI = 'xunfei',
}

export const ModelTypeCN = {
  deepseek: 'DeepSeek',
  qianwen: '通义千问',
  qianfan: '百度千帆',
  doubao: '抖音豆包',
  kimi: 'Kimi',
  gemini: 'Google Gemini',
  zhipu: '质谱清言',
  hunyuan: '腾讯混元',
  yuewen: '阶跃星辰',
  baichuan: '百川智能',
  xunfei: '科大讯飞',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
};

export const ModelTypeVersion = {
  deepseek: 'DeepSeek-R1 DeepSeek-V3',
  qianwen: 'qwen-plus qwq-plus-latest qwen-vl-max-latest',
  qianfan: 'ernie-4.0-8k-latest',
  doubao: 'doubao-1-5-pro-256k-250115 doubao-1.5-vision-pro-32k-250115',
  kimi: 'moonshot-v1-128k moonshot-v1-128k-vision-preview',
  gemini: 'Gemini 2.0 Flash',
  zhipu: 'GLM4-PLUS',
  hunyuan: 'hunyuan-turbos-latest',
  yuewen: 'step-2',
  baichuan: 'Baichuan4',
  xunfei: 'Spark 4.0 Ultra',
  claude: 'claude-3-7-sonnet-20250219',
  chatgpt: 'o1-mini',
};

export enum CodeType {
  JAVA = 'java',
  CPP = 'cpp',
  PYTHON = 'python',
}

export enum CodeTypeCn {
  java = 'java22',
  cpp = 'cpp',
  python = 'python3.9',
}

export enum ExecStatus {
  RUNNING = 1,
  FINISH = 0,
  ERROR = 2,
}

export enum TaskStatusEnum {
  SUCCEEDED = 'SUCCEEDED',
  RUNNING = 'RUNNING',
  ERRORED = 'ERRORED',
  NULL = '',
}

export enum ModelInputType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}
