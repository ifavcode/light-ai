import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const qianwenOpenaiProviders = [
  {
    provide: 'QIANWEN_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('QIANWEN_API_KEY'),
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'DEEPSEEK_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('DEEPSEEK_API_KEY'),
        baseURL: 'https://api.deepseek.com/v1',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'QIANFAN_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('QIANFAN_API_KEY'),
        baseURL: 'https://qianfan.baidubce.com/v2',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'DOUBAO_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('DOUBAO_API_KEY'),
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'KIMI_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('KIMI_API_KEY'),
        baseURL: 'https://api.moonshot.cn/v1',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'GEMINI_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new GoogleGenerativeAI(
        configService.get('GEMINI_API_KEY') as string,
      );
    },
    inject: [ConfigService],
  },
  {
    provide: 'ZHIPU_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('ZHIPU_API_KEY'),
        baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'HUNYUAN_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('HUNYUAN_API_KEY'),
        baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'YUEWEN_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('YUEWEN_API_KEY'),
        baseURL: 'https://api.stepfun.com/v1',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'BAICHUAN_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('BAICHUAN_API_KEY'),
        baseURL: 'https://api.baichuan-ai.com/v1/',
        timeout: 40000,
      });
    },
    inject: [ConfigService],
  },
  {
    provide: 'XUNFEI_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('XUNFEI_API_KEY'),
        baseURL: 'https://spark-api-open.xf-yun.com/v1', 
        timeout: 40000,  
      });
    }, 
    inject: [ConfigService],
  },
  {
    provide: 'CLAUDE_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('DEER_API_KEY'),
        baseURL: 'https://api.deerapi.com/v1', 
        timeout: 40000,  
      });
    }, 
    inject: [ConfigService],
  },
  {
    provide: 'CHATGPT_OPENAI',
    useFactory: (configService: ConfigService) => {
      return new OpenAI({
        apiKey: configService.get('DEER_API_KEY'),
        baseURL: 'https://api.deerapi.com/v1', 
        timeout: 40000,  
      });
    }, 
    inject: [ConfigService],
  },
];
