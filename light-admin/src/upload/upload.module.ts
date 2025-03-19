import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { SshClientModule } from 'src/config/ssh-client/ssh-client.module';
import { DataSource } from 'typeorm';
import { UploadRecord } from './entities/upload-record.entity';
import { DatabaseModule } from 'src/config/database/database.module';
import { ossProviders } from 'src/config/oss/oss.provider';

@Module({
  imports: [SshClientModule, DatabaseModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: 'UPLOAD_RECORD_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(UploadRecord),
      inject: ['DATA_SOURCE'],
    },
    ...ossProviders,
  ],
  exports: [UploadService],
})
export class UploadModule {}
