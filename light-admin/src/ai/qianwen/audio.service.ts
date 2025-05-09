import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import tmp from 'tmp';
import WebSocket from 'ws';
import fs from 'fs';
import { punctuationSymbolsSet } from 'src/utils';
import { TextToVideoDTO } from './dto/text-to-video.dto';
import { Socket } from 'socket.io';
import { UploadService } from 'src/upload/upload.service';
import { Repository } from 'typeorm';
import { AiModel } from './entities/ai-model.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AudioService {
  constructor(
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
    @Inject('QIANWEN_REPOSITORY')
    private readonly aiModelRepository: Repository<AiModel>,
  ) {}

  textToVideo(textToVideoDTO: TextToVideoDTO, client: Socket, user: User) {
    const apiKey = this.configService.get('QIANWEN_API_KEY');
    if (!apiKey) {
      console.error('请填写QIANWEN_API_KEY配置!');
      throw new HttpException('转化失败', 500);
    }
    const url = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference/';
    const outputFilePath = tmp.fileSync({
      name: nanoid(8) + '.mp3',
    });
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `bearer ${apiKey}`,
        'X-DashScope-DataInspection': 'enable',
      },
    });
    let taskStarted = false;
    let taskId = nanoid();

    ws.on('open', () => {
      // 发送run-task指令
      const runTaskMessage = JSON.stringify({
        header: {
          action: 'run-task',
          task_id: taskId,
          streaming: 'duplex',
        },
        payload: {
          task_group: 'audio',
          task: 'tts',
          function: 'SpeechSynthesizer',
          model: 'cosyvoice-v1',
          parameters: {
            text_type: 'PlainText',
            voice: 'longxiaochun', // 音色
            format: 'mp3', // 音频格式
            sample_rate: 44100, // 采样率
            volume: 100, // 音量
            rate: 1, // 语速
            pitch: 1, // 音调
          },
          input: {},
        },
      });
      ws.send(runTaskMessage);
    });

    const fileStream = fs.createWriteStream(outputFilePath.name, {
      flags: 'a',
    });
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        // 写入二进制数据到文件
        fileStream.write(data);
        client.emit('ttv', data); // text to video
      } else {
        const message = JSON.parse(data.toString());

        switch (message.header.event) {
          case 'task-started':
            taskStarted = true;
            // 发送continue-task指令
            sendContinueTasks(ws, this.textSplit(textToVideoDTO.text));
            break;
          case 'task-finished':
            ws.close();
            this.uploadService
              .uploadOSSBuffer(fs.readFileSync(outputFilePath.name), 'mp3')
              .then((result) => {
                client.emit('ttvEnd', {
                  finish_reason: 'normal',
                  url: result.url,
                });
                this.updateAudioUrl(textToVideoDTO.id, result.url, user);
              });
            outputFilePath.removeCallback();
            fileStream.end(() => {});
            break;
          case 'task-failed':
            console.error('任务失败：', message.header.error_message);
            ws.close();
            client.emit('ttvEnd', {
              finish_reason: 'error',
            });
            outputFilePath.removeCallback();
            fileStream.end(() => {});
            break;
          default:
            // 可以在这里处理result-generated
            break;
        }
      }
    });

    function sendContinueTasks(ws: WebSocket, texts: string[]) {
      texts.forEach((text, index) => {
        setTimeout(() => {
          if (taskStarted) {
            const continueTaskMessage = JSON.stringify({
              header: {
                action: 'continue-task',
                task_id: taskId,
                streaming: 'duplex',
              },
              payload: {
                input: {
                  text: text,
                },
              },
            });
            ws.send(continueTaskMessage);
          }
        }, index * 1000); // 每隔1秒发送一次
      });

      // 发送finish-task指令
      setTimeout(
        () => {
          if (taskStarted) {
            const finishTaskMessage = JSON.stringify({
              header: {
                action: 'finish-task',
                task_id: taskId,
                streaming: 'duplex',
              },
              payload: {
                input: {},
              },
            });
            ws.send(finishTaskMessage);
          }
        },
        texts.length * 1000 + 1000,
      ); // 在所有continue-task指令发送完毕后1秒发送
    }

    ws.on('close', () => {});
  }

  textSplit(text: string) {
    let mx = 100; // 一次投放mx个文字 进行转化，如果后续还有文字，则直到下一个分隔符为止
    let cur = 0;
    let curStr = '';
    let backArr: string[] = [];
    let i = 0;
    while (i < text.length) {
      const c = text.charAt(i);
      if (cur < mx) {
        curStr += c;
      } else {
        if (!punctuationSymbolsSet.has(c)) {
          curStr += c;
        } else {
          cur = 0;
          backArr.push(curStr + c);
          curStr = '';
        }
      }
      i += 1;
    }
    if (curStr != '') {
      backArr.push(curStr);
    }
    return backArr;
  }

  async updateAudioUrl(id: number, audioUrl: string, user: User) {
    if (!id || id == -1) {
      return;
    }
    const aiModel = await this.aiModelRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });
    if (aiModel && aiModel.user.id === user.id) {
      aiModel.audioUrl = audioUrl;
      this.aiModelRepository.update(aiModel.id, aiModel);
    }
  }

  async getAudioHistory(id: number, user: User) {
    const aiModel = await this.aiModelRepository.findOne({
      select: ['audioUrl', 'id'],
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    return aiModel ? aiModel.audioUrl : null;
  }
}
