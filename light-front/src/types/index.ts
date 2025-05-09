export enum Constant {
  JWT_HEADER_NAME = "Authorization",
  MODEL_SELECT = "model_select",
  MODEL_SELECT_ONE = "mode_select_one",
  IS_REASONING = "is_reasoning",
}

export enum ModelType {
  DEEP_SEEK = "deepseek",
  QIAN_WEN = "qianwen",
  QIAN_FAN = "qianfan",
  DOU_BAO = "doubao",
  KI_MI = "kimi",
}

export interface R<T> {
  code: number;
  msg: string;
  data: T;
}

export interface AllowList {
  label: string;
  value: ModelType;
  model: string;
}

export interface RC {
  label: string;
  value: string;
}

export interface AiModel {
  id: number;

  dialogContent: string;

  replyContent: string;

  reasoningContent: string;

  mediaUrl: string;

  inputType: string;

  user: User;

  createTime: Date;

  aiModelType: ModelType;

  dialogGroup: DialogGroup;
}

export interface User {
  id: number;

  username: string;

  password: string;

  avatar: string;

  nickname: string;

  createTime: Date;

  delFlag: boolean;

  qianwenDialogs: AiModel[];

  dialogGroup: DialogGroup[];
}

export interface DialogGroup {
  id: number;

  groupName: string;

  createTime: Date;

  aiModelType: ModelType;

  user: User;

  dialogs: AiModel[];

  inputType: ModelInputType;
}

export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}

export interface Message {
  id?: number;
  role?: MessageRole;
  content?: any;
  reasoningContent?: string;
  inputType?: string;
}

export interface CreateQianwenDto {
  message: Message[];

  aiModelType: ModelType;

  reasoning: boolean;

  dialogContent: string;

  inputType?: string | null;

  mediaUrl?: string;

  dialogGroupId: number;

  reasoningContent?: string;
}

export interface Auth {
  username: string;
  password: string;
}

export interface replyQianwenDTO {
  id: string;
  choices: any[];
  created: number;
  model: string;
  object: string;
  service_tier: string | null;
  system_fingerprint: string | null;
  usage?: any;
}

export interface Page<T> {
  pageNum: number;
  pageSize: number;
  total?: number;
  totalPage?: number;
  list?: T;
}

export interface CreateQianwenMapDto {
  createQianwenMap: Record<ModelType, CreateQianwenDto>;
}

export enum CodeType {
  JAVA = "java",
  CPP = "cpp",
  PYTHON = "python",
}

export interface ExecCode {
  codeType: CodeType;
  sourceCode: string;
  input: string;
}

export enum ExecStatus {
  RUNNING = 1,
  FINISH = 0,
  ERROR = 2,
}

export interface AiTool {
  id: number;

  routeName: string;

  toolName: string;

  toolImage: string;

  desc: string;

  createTime: Date;

  delFlag: boolean;

  user: User;
}

export interface PicToVideoDTO {
  model?: string;
  prompt: string;
  imgUrl: string;
  duration: number;
  promptExtend?: boolean;
  seed?: number;
}

export interface PicToVideo {
  id: number;
  model: string;
  prompt: string;
  imgUrl: string;
  duration: number;
  promptExtend: boolean;
  seed?: number;
  createTime: Date;
  user: User;
  requestId: string;
  taskId: string;
  taskStatus: string;
  videoUrl: string;
  rawVideoUrl: string;
}

export enum TaskStatusEnum {
  SUCCEEDED = "SUCCEEDED",
  RUNNING = "RUNNING",
  ERRORED = "ERRORED",
}

export interface VirtualCompanyDTO {
  prompt: string;
  model?: string;
}

export interface VirtualCompany {
  id: number;
  prompt: string;
  model: string;
  replyContent: string;
  errorContent: string;
  taskStatus: TaskStatusEnum;
  createTime: Date;
  endTime: Date;
  user: User;
}

export enum ModelInputType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  OTHER = "other",
}

export interface TextToVideoDTO {
  text: string;
  id?: number;
}
