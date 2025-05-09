import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { DatabaseModule } from 'src/config/database/database.module';
import { DataSource } from 'typeorm';
import { AiTool } from './entities/tool.entity';
import { PicToVideo } from './entities/pic-to-video.entity';
import { UploadModule } from 'src/upload/upload.module';
import { dockerProviders } from 'src/config/docker/docker.providers';
import { DockerModule } from 'src/docker/docker.module';
import { VirtualCompany } from './entities/virtual-company.entity';

@Module({
  imports: [DatabaseModule, UploadModule, DockerModule],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    {
      provide: 'AI_TOOL_REPOSITORY',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(AiTool),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: 'PIC_TO_VIDEO_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(PicToVideo),
      inject: ['DATA_SOURCE'],
    },
    {
      provide: 'VIRTUAL_COMPANY_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(VirtualCompany),
      inject: ['DATA_SOURCE'],
    },
  ],
})
export class ToolsModule {}
