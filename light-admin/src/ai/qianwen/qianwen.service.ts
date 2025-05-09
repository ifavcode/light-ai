import {
  HttpException,
  Inject,
  Injectable,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { CreateQianwenDto } from './dto/create-qianwen.dto';
import { UpdateQianwenDto } from './dto/update-qianwen.dto';
import OpenAI from 'openai';
import { Subscriber } from 'rxjs';
import { AiModel } from './entities/ai-model.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ModelInputType, ModelType } from '../../types';
import { DialogGroupService } from '../dialog-group/dialog-group.service';
import { CreateQianwenMapDto } from './dto/create-qianwen-map.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageRole } from 'src/common/message';
import Anthropic from '@anthropic-ai/sdk';
import { getUrlToBase64 } from 'src/utils';

@Injectable()
export class QianwenService {
  static userCancelMap: Map<number, boolean> = new Map();

  constructor(
    @Inject('QIANWEN_OPENAI')
    private readonly qianwenOpenai: OpenAI,
    @Inject('QIANWEN_REPOSITORY')
    private readonly aiModelRepository: Repository<AiModel>,
    @Inject('DEEPSEEK_OPENAI')
    private readonly deepseekOpenai: OpenAI,
    @Inject('QIANFAN_OPENAI')
    private readonly qianfanOpenai: OpenAI,
    @Inject('DOUBAO_OPENAI')
    private readonly doubaoOpenai: OpenAI,
    @Inject('KIMI_OPENAI')
    private readonly kimiOpenai: OpenAI,
    @Inject('GEMINI_OPENAI')
    private readonly genAI: GoogleGenerativeAI,
    @Inject('ZHIPU_OPENAI')
    private readonly zhipuOpenai: OpenAI,
    @Inject('HUNYUAN_OPENAI')
    private readonly hunyuanOpenai: OpenAI,
    @Inject('YUEWEN_OPENAI')
    private readonly yuewenOpenai: OpenAI,
    @Inject('BAICHUAN_OPENAI')
    private readonly baichuanOpenai: OpenAI,
    @Inject('XUNFEI_OPENAI')
    private readonly xunfeiOpenai: OpenAI,
    @Inject('CLAUDE_OPENAI')
    private readonly claudeOpenai: OpenAI,
    @Inject('CHATGPT_OPENAI')
    private readonly chatgptOpenai: OpenAI,
    private readonly dialogGroupService: DialogGroupService,
  ) {}

  clientSendError(
    client: Subscriber<MessageEvent>,
    modelName: string,
    error: Error,
    spec?: boolean,
  ) {
    client.next({
      type: spec ? modelName : 'ai',
      data: {
        choices: [
          {
            delta: { content: error.message },
            finish_reason: 'error',
          },
        ],
      },
    });
  }

  async saveDialogGroup(createQianwenDto: CreateQianwenDto, model: AiModel) {
    if (createQianwenDto.dialogGroupId) {
      model.dialogGroup = await this.dialogGroupService.findOneById(
        createQianwenDto.dialogGroupId,
      );
    }
  }

  async createQianwen(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion: any = await this.qianwenOpenai.chat.completions.create({
        model: 'qwen-plus',
        messages: createQianwenDto.message as any,
        stream: true,
        enable_search: true,
      } as any);
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.QIAN_WEN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_qianwen' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            let send: string = message?.choices[0]?.delta?.content; // katex公式可能会使用 \[ \]的形式 转化为$
            send = send.replace(/\\\[(.*?)\\\]/g, '$$$1$$');
            send = send.replace(/\\\((.*?)\\\)/g, '$1$');
            replyContent += send;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_qianwen', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_qianwen', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_qianwen', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createQianwenReasoning(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.qianwenOpenai.chat.completions.create({
        model: 'qwq-plus-latest',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.QIAN_WEN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      let reasoningContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_qianwen' : 'ai',
            data: message,
          });
          // @ts-ignore
          if (message?.choices[0]?.delta?.reasoning_content) {
            // @ts-ignore
            reasoningContent += message?.choices[0]?.delta?.reasoning_content;
          } else {
            if (message?.choices[0]?.delta?.content) {
              replyContent += message?.choices[0]?.delta?.content;
            }
          }
        } catch (error) {
          this.clientSendError(client, 'ai_qianwen', error, spec);
          replyContent += error.message;
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      obj.reasoningContent = reasoningContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_qianwen', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_qianwen', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createQianwenReasoningMT(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.qianwenOpenai.chat.completions.create({
        model: 'qwen-vl-max-latest',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.QIAN_WEN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      let reasoningContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_qianwen' : 'ai',
            data: message,
          });
          // @ts-ignore
          if (message?.choices[0]?.delta?.reasoning_content) {
            // @ts-ignore
            reasoningContent += message?.choices[0]?.delta?.reasoning_content;
          } else {
            if (message?.choices[0]?.delta?.content) {
              replyContent += message?.choices[0]?.delta?.content;
            }
          }
        } catch (error) {
          this.clientSendError(client, 'ai_qianwen', error, spec);
          replyContent += error.message;
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      obj.reasoningContent = reasoningContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_qianwen', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_qianwen', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createDeepseek(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.deepseekOpenai.chat.completions.create({
        model: 'deepseek-chat',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.DEEP_SEEK;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_deepseek' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          this.clientSendError(client, 'ai_deepseek', error, spec);
          replyContent += error.message;
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_deepseek', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_deepseek', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createDeepseekReasoning(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.deepseekOpenai.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.DEEP_SEEK;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      let reasoningContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_deepseek' : 'ai',
            data: message,
          });
          // @ts-ignore
          if (message?.choices[0]?.delta?.reasoning_content) {
            // @ts-ignore
            reasoningContent += message?.choices[0]?.delta?.reasoning_content;
          } else {
            if (message?.choices[0]?.delta?.content) {
              replyContent += message?.choices[0]?.delta?.content;
            }
          }
        } catch (error) {
          this.clientSendError(client, 'ai_deepseek', error, spec);
          replyContent += error.message;
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      obj.reasoningContent = reasoningContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_deepseek', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_deepseek', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createQianfan(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.qianfanOpenai.chat.completions.create({
        model: 'ernie-4.0-8k-latest',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.QIAN_FAN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_qianfan' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          this.clientSendError(client, 'ai_qianfan', error, spec);
          replyContent += error.message;
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_qianfan', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_qianfan', error, spec);
      // throw new HttpException(error, 500);
    }
  }

  async createDoubao(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
    vision?: boolean,
  ) {
    try {
      const completion = await this.doubaoOpenai.chat.completions.create({
        model: vision
          ? 'doubao-1.5-vision-pro-32k-250115'
          : 'doubao-1-5-pro-256k-250115',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.DOU_BAO;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_doubao' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_doubao', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_doubao', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_doubao', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createKimi(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
    vision?: boolean,
  ) {
    try {
      if (vision) {
        const updatedMessages = createQianwenDto.message.map(async (msg) => {
          if (msg.content) {
            for (let i = 0; i < msg.content?.length; i++) {
              const content: any = msg.content[i];
              if (content.type === 'image_url' && content.image_url) {
                // kimi的图片URL必须转化为base64的形式
                const url = content.image_url.url;
                if (url) {
                  (msg.content[i] as any).image_url.url =
                    await getUrlToBase64(url);
                }
              }
            }
          }
          return msg;
        });
        createQianwenDto.message = await Promise.all(updatedMessages);
      }

      const completion = await this.kimiOpenai.chat.completions.create({
        model: vision ? 'moonshot-v1-128k-vision-preview' : 'moonshot-v1-128k',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.KI_MI;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_kimi' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_kimi', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_kimi', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_kimi', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createGemini(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.GE_MINI;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      const messages = createQianwenDto.message;
      const lastMessage = messages.pop();
      const history = messages.reduce((pre, cur) => {
        pre.push({
          role:
            cur.role === MessageRole.ASSISTANT ? MessageRole.MODEL : cur.role,
          parts: [{ text: cur.content }],
        });
        return pre;
      }, [] as any);
      const chat = model.startChat({
        history,
      });
      const completion = await chat.sendMessageStream(
        lastMessage?.content as string,
      );
      for await (const message of completion.stream) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_gemini' : 'ai',
            data: {
              choices: [
                {
                  delta: { content: message.text() },
                  finish_reason: null,
                },
              ],
            },
          });
          replyContent += message.text();
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_gemini', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      client.next({
        type: spec ? 'ai_gemini' : 'ai',
        data: {
          choices: [
            {
              delta: { content: '' },
              finish_reason: 'normal',
            },
          ],
        },
      });
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_gemini', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_gemini', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createZhipu(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.zhipuOpenai.chat.completions.create({
        model: 'glm-4-plus',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.ZHI_PU;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_zhipu' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_zhipu', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_zhipu', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_zhipu', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createHunyuan(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.hunyuanOpenai.chat.completions.create({
        model: 'hunyuan-turbos-latest',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.HUN_YUAN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_hunyuan' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_hunyuan', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_hunyuan', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_hunyuan', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createYuewen(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.yuewenOpenai.chat.completions.create({
        model: 'step-2-16k',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.YUE_WEN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_yuewen' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_yuewen', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_yuewen', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_yuewen', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createBaichuan(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.baichuanOpenai.chat.completions.create({
        model: 'Baichuan4',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.BAI_CHUAN;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_baichuan' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_baichuan', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_baichuan', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_baichuan', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createXunfei(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.xunfeiOpenai.chat.completions.create({
        model: '4.0Ultra',
        messages: createQianwenDto.message as any,
        stream: true,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.XUN_FEI;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_xunfei' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_xunfei', error, spec);
          // console.error('客户端发送信息错误', error);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_xunfei', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_xunfei', error, spec);
      throw new HttpException(error, 500);
    }
  }

  async createChatGPT(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.chatgptOpenai.chat.completions.create({
        model: 'o1-mini',
        messages: createQianwenDto.message as any,
        stream: true,
        max_tokens: 1000,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.CHATGPT;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_chatgpt' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_chatgpt', error, spec);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_chatgpt', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_chatgpt', error, spec);
      throw new HttpException(error, 500);
    }
  }
  async createClaude(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    try {
      const completion = await this.claudeOpenai.chat.completions.create({
        model: 'claude-3-7-sonnet-20250219',
        messages: createQianwenDto.message as any,
        stream: true,
        max_tokens: 1000,
      });
      const obj = new AiModel();
      obj.user = user;
      obj.dialogContent = createQianwenDto.dialogContent;
      obj.createTime = new Date();
      obj.aiModelType = ModelType.CLAUDE;
      obj.mediaUrl = createQianwenDto.mediaUrl || '';
      obj.inputType = createQianwenDto.inputType || '';
      await this.saveDialogGroup(createQianwenDto, obj);
      let replyContent = '';
      for await (const message of completion) {
        try {
          if (QianwenService.userCancelMap[user.id]) {
            QianwenService.userCancelMap[user.id] = false;
            break;
          }
          client.next({
            type: spec ? 'ai_claude' : 'ai',
            data: message,
          });
          if (message?.choices[0]?.delta?.content) {
            replyContent += message?.choices[0]?.delta?.content;
          }
        } catch (error) {
          replyContent += error.message;
          this.clientSendError(client, 'ai_claude', error, spec);
        }
      }
      obj.replyContent = replyContent;
      await this.aiModelRepository.save(obj);
      this.sendFinishMsg(client, 'ai_claude', obj.id, spec);
    } catch (error) {
      this.clientSendError(client, 'ai_claude', error, spec);
      throw new HttpException(error, 500);
    }
  }

  chooseModel(
    createQianwenDto: CreateQianwenDto,
    client: Subscriber<MessageEvent>,
    user: User,
    spec?: boolean,
  ) {
    switch (createQianwenDto.aiModelType) {
      case ModelType.DEEP_SEEK:
        createQianwenDto.reasoning
          ? this.createDeepseekReasoning(createQianwenDto, client, user, spec)
          : this.createDeepseek(createQianwenDto, client, user, spec);
        break;
      case ModelType.QIAN_WEN:
        if (
          !createQianwenDto.inputType ||
          createQianwenDto.inputType === ModelInputType.TEXT
        ) {
          createQianwenDto.reasoning
            ? this.createQianwenReasoning(createQianwenDto, client, user, spec)
            : this.createQianwen(createQianwenDto, client, user, spec);
        } else {
          this.createQianwenReasoningMT(createQianwenDto, client, user, spec);
        }
        break;
      case ModelType.QIAN_FAN:
        this.createQianfan(createQianwenDto, client, user, spec);
        break;
      case ModelType.DOU_BAO:
        if (
          !createQianwenDto.inputType ||
          createQianwenDto.inputType === ModelInputType.TEXT
        ) {
          this.createDoubao(createQianwenDto, client, user, spec, false);
        } else {
          this.createDoubao(createQianwenDto, client, user, spec, true);
        }
        break;
      case ModelType.KI_MI:
        if (
          !createQianwenDto.inputType ||
          createQianwenDto.inputType === ModelInputType.TEXT
        ) {
          this.createKimi(createQianwenDto, client, user, spec, false);
        } else {
          this.createKimi(createQianwenDto, client, user, spec, true);
        }
        break;
      case ModelType.GE_MINI:
        this.createGemini(createQianwenDto, client, user, spec);
        break;
      case ModelType.ZHI_PU:
        this.createZhipu(createQianwenDto, client, user, spec);
        break;
      case ModelType.HUN_YUAN:
        this.createHunyuan(createQianwenDto, client, user, spec);
        break;
      case ModelType.YUE_WEN:
        this.createYuewen(createQianwenDto, client, user, spec);
        break;
      case ModelType.BAI_CHUAN:
        this.createBaichuan(createQianwenDto, client, user, spec);
        break;
      case ModelType.XUN_FEI:
        this.createXunfei(createQianwenDto, client, user, spec);
        break;
      case ModelType.CLAUDE:
        this.createClaude(createQianwenDto, client, user, spec);
        break;
      case ModelType.CHATGPT:
        this.createChatGPT(createQianwenDto, client, user, spec);
        break;
    }
  }

  chooseModelMore(
    createQianwenMapDto: CreateQianwenMapDto,
    client: Subscriber<MessageEvent>,
    user: User,
  ) {
    Object.keys(createQianwenMapDto.createQianwenMap).forEach((key) => {
      const createQianwenDto = createQianwenMapDto.createQianwenMap[key];
      this.chooseModel(createQianwenDto, client, user, true);
    });
  }

  sendFinishMsg(
    client: Subscriber<MessageEvent>,
    aiStr: string,
    id: number,
    spec?: boolean,
  ) {
    client.next({
      type: spec ? aiStr : 'ai',
      data: {
        choices: [
          {
            delta: {
              content: '',
              attach: {
                id,
              },
            },
            finish_reason: 'normal',
          },
        ],
      },
    });
  }

  findAll(id: number) {
    return this.aiModelRepository;
  }

  findOne(id: number) {
    return `This action returns a #${id} qianwen`;
  }

  update(id: number, updateQianwenDto: UpdateQianwenDto) {
    return `This action updates a #${id} qianwen`;
  }

  remove(id: number) {
    return `This action removes a #${id} qianwen`;
  }
}
