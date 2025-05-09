import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './config/database/database.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { JwtAuthGuard } from './config/jwt/jwtAuth-guard';
import { RedisModule } from '@nestjs-modules/ioredis';
import { QianwenModule } from './ai/qianwen/qianwen.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DialogGroupModule } from './ai/dialog-group/dialog-group.module';
import { SettingModule } from './setting/setting.module';
import { DockerModule } from './docker/docker.module';
import { EventsModule } from './events/events.module';
import { ToolsModule } from './ai/tools/tools.module';
import { UploadModule } from './upload/upload.module';
import { SshClientModule } from './config/ssh-client/ssh-client.module';
import { RoleModule } from './role/role.module';
import { RolesGuard } from './role/roles.guard';

@Module({ 
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    SettingModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get('REDIS_HOST')}`,
        options: {
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    QianwenModule,
    DialogGroupModule,
    DockerModule,
    EventsModule, 
    ToolsModule,
    UploadModule,
    SshClientModule,
    RoleModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, 
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
