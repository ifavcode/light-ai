import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';

export const ossProviders = [
  {
    provide: 'OSS_INSTANCE',
    useFactory: async (configService: ConfigService) => {
      console.log('@@');
      
      const accessKeyId = configService.get('ALIBABA_CLOUD_ACCESS_KEY_ID');
      const bucket = configService.get('ALIBABA_CLOUD_BUCKET_NAME');
      const region = configService.get('ALIBABA_CLOUD_REGION');
      const domain = configService.get('ALIBABA_CLOUD_CUSTOM_DOMAIN');
      const accessKeySecret = configService.get(
        'ALIBABA_CLOUD_ACCESS_KEY_SECRET',
      );
      if (!accessKeyId || !accessKeySecret || !bucket || !region) {
        console.log('请填写OSS配置');
        return null;
      }
      const config = {
        region,
        bucket,
        accessKeyId,
        accessKeySecret,
      }
      if (domain) {
        config['endpoint'] = domain;
        config['cname'] = true;
      }
      const client = new OSS(config);
      return client;
    },
    inject: [ConfigService],
  },
];
