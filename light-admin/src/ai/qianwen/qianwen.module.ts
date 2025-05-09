import { Module } from '@nestjs/common';
import { QianwenService } from './qianwen.service';
import { QianwenController } from './qianwen.controller';
import { DatabaseModule } from 'src/config/database/database.module';
import { DataSource } from 'typeorm';
import { AiModel } from './entities/ai-model.entity';
import { qianwenOpenaiProviders } from 'src/common/ai-client-providers';
import { DialogGroupModule } from '../dialog-group/dialog-group.module';
import { AudioService } from './audio.service';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [DatabaseModule, DialogGroupModule, UploadModule],
  controllers: [QianwenController],
  providers: [
    QianwenService,
    AudioService,
    ...qianwenOpenaiProviders,
    {
      provide: 'QIANWEN_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(AiModel),
      inject: ['DATA_SOURCE'],
    },
  ],
  exports: [
    // Export any providers if needed
  ],
})
export class QianwenModule {}
