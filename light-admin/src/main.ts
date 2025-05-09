import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { createPicToVideoTask } from './utils/request';
import { bcryptPassword } from './utils';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  const config = new DocumentBuilder()
    .setTitle('API文档')
    .setDescription('无描述')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // const dispatcher = new ProxyAgent({
  //   uri: new URL('http://127.0.0.1:7890').toString(),
  // });
  // setGlobalDispatcher(dispatcher);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
 