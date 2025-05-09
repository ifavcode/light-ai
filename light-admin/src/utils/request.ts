import Axios from 'axios';
import { nanoid } from 'nanoid';
import { PicToVideo } from 'src/ai/tools/entities/pic-to-video.entity';
import { Constant } from 'src/config/constant';
import tmp from 'tmp';
import fs from 'fs';
import { HttpException } from '@nestjs/common';

export const client = Axios.create({
  timeout: 5000,
});

function createPicToVideoTask(picToVideo: PicToVideo) {
  if (!process.env.QIANWEN_API_KEY) {
    console.error(`未配置QIANWEN_API_KEY，无法创建任务`);
    return;
  }
  return client.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis',
    {
      model: picToVideo.model,
      input: {
        prompt: picToVideo.prompt,
        img_url: picToVideo.imgUrl,
        parameters: {
          duration: picToVideo.duration,
          prompt_extend: picToVideo.promptExtend,
          seed: picToVideo.seed,
        },
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: Constant.JWT_PREFIX + process.env.QIANWEN_API_KEY,
        'X-DashScope-Async': 'enable',
      },
    },
  );
}

function getPicToVideoResult(taskId: string) {
  return client.get(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
    headers: {
      Authorization: Constant.JWT_PREFIX + process.env.QIANWEN_API_KEY,
    },
  });
}

async function downloadFile(url: string) {
  try {
    const response = await client({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const tmpFile = tmp.fileSync({
      name: nanoid(10),
    });

    const writer = fs.createWriteStream(tmpFile.name);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(''));
      writer.on('error', (e) => reject(e));
      response.data.on('error', reject);
    });
    return tmpFile;
  } catch (error) {
    throw new HttpException(error.message, 500);
  }
}

export { createPicToVideoTask, getPicToVideoResult, downloadFile };
