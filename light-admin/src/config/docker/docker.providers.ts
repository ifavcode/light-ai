import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

export const dockerProviders = [
  {
    provide: 'DOCKER_INSTANCE',
    useFactory: async (configService: ConfigService) => {
      try {
        const certsPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          'src',
          'common',
          'certs',
        );
        const docker = new Docker({
          host: configService.get('DOCKER_NAME_HOST') || 'http://127.0.0.1',
          port: configService.get('DOCKER_NAME_PORT') || 2375,
          version: 'v1.47', // required when Docker >= v1.13 —— Docker Api Version,
          ca: fs.readFileSync(path.join(certsPath, 'ca.pem')),
          cert: fs.readFileSync(path.join(certsPath, 'cert.pem')),
          key: fs.readFileSync(path.join(certsPath, 'key.pem')),
        });
        // 检查是否连接成功
        // const info = await docker.info();
        // console.log(info);

        return docker;
      } catch (error) {
        console.error('Failed to create Docker instance:', error);
        throw error;
      }
    },
    inject: [ConfigService],
  },
];
