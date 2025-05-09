import { forwardRef, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { DockerModule } from 'src/docker/docker.module';

@Module({
  imports: [AuthModule, forwardRef(() => DockerModule)],
  providers: [EventsGateway],
  exports: [EventsGateway]
})
export class EventsModule { }