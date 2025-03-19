export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  MODEL = 'model',
}

export class Message {
  role?: MessageRole;
  content?: string;

  constructor(role?: MessageRole, content?: string) {
    this.role = role;
    this.content = content;
  }
}
