import { hash, compare } from 'bcrypt';
import { Request } from 'express';
import { PasswordConstant } from 'src/config/constant';
import { client } from './request';
import { Page } from 'src/common/Page';

export async function bcryptPassword(password: string): Promise<any> {
  return new Promise((resolve, rejects) => {
    hash(
      password,
      PasswordConstant.SALT_ROUNDS,
      function (err: any, hash: any) {
        if (err) {
          rejects(err);
        }
        resolve(hash);
      },
    );
  });
}

export async function checkPassword(
  password: string,
  hash: string,
): Promise<any> {
  return new Promise((resolve, rejects) => {
    compare(password, hash, function (err: any, result: any) {
      if (err) {
        rejects(err);
      }
      resolve(result);
    });
  });
}

export function classifyFile(filename: string) {
  const parts = filename.split(/[\\/]/).pop();
  if (!parts) return 'other';
  const ext = parts.split('.').pop()?.toLowerCase() || 'other';

  // 分类规则
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'svg',
    'ico',
    'tiff',
  ];
  const videoExtensions = [
    'mp4',
    'mov',
    'avi',
    'mkv',
    'flv',
    'wmv',
    'webm',
    'mpeg',
    '3gp',
  ];
  const textExtensions = [
    'txt',
    'md',
    'rtf',
    'text',
    'log',
    'ini',
    'conf',
    'js',
    'jsx',
    'ts',
    'tsx',
    'html',
    'htm',
    'css',
    'scss',
    'json',
    'xml',
    'py',
    'java',
    'kt',
    'cpp',
    'c',
    'h',
    'php',
    'rb',
    'go',
    'rs',
    'swift',
    'sql',
    'sh',
    'bat',
    'cmd',
    'yml',
    'yaml',
    'toml',
    'env',
    'gitignore',
  ];

  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  if (textExtensions.includes(ext)) return 'text';
  return 'other';
}

export function getClientIp(request: Request): string | undefined {
  // 检查 X-Forwarded-For 头
  const forwardedFor: any = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For 可能是一个数组或逗号分隔的字符串，取第一个 IP
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0].remoteAddress[0];
    }
    return forwardedFor.split(',')[0].trim();
  }

  // 如果没有代理，直接返回 request.ip
  return request.ip;
}

export async function getUrlToBase64(url: string) {
  try {
    const response = await client.get(url, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data, 'binary');
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('获取图片失败', error);
    throw new Error('获取图片失败');
  }
}

export const punctuationSymbolsSet = new Set([
  // 中文标点符号
  '。',
  '，',
  '、',
  '；',
  '：',
  '？',
  '！',
  '“',
  '”',
  '‘',
  '’',
  '（',
  '）',
  '〔',
  '〕',
  '【',
  '】',
  '〖',
  '〗',
  '｛',
  '｝',
  '——',
  '……',
  '《',
  '》',
  '〈',
  '〉',
  '·',
  '—',
  '－',
  '～',
  '.',
  // 英文标点符号
  '.',
  ',',
  '?',
  '!',
  ':',
  ';',
  '"',
  "'",
  '-',
  '...',
  // 其他语言标点符号
  '۔',
  '؟',
]);
