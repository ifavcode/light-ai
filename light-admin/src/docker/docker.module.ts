import { forwardRef, Module } from '@nestjs/common';
import { DockerService } from './docker.service';
import { DockerController } from './docker.controller';
import { dockerProviders } from 'src/config/docker/docker.providers';
import { DataSource } from 'typeorm';
import { VirtualCompany } from 'src/ai/tools/entities/virtual-company.entity';
import { DatabaseModule } from 'src/config/database/database.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => EventsModule)],
  controllers: [DockerController],
  providers: [
    DockerService,
    ...dockerProviders,
    {
      provide: 'VIRTUAL_COMPANY_REPOSITORY',
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(VirtualCompany),
      inject: ['DATA_SOURCE'],
    },
  ],
  exports: [DockerService],
})
export class DockerModule { }
