import { Controller, Post, Body, Request, Get, HttpException } from '@nestjs/common';
import { DockerService } from './docker.service';
import { ExecCode } from './entities/exec-code.entity';
import R from 'src/common/R';
import { EventsGateway } from 'src/events/events.gateway';
import { ExecStatus } from 'src/types';

@Controller('docker')
export class DockerController {
  constructor(private readonly dockerService: DockerService) { }

  @Post('exec')
  execCode(@Body() execCode: ExecCode, @Request() req: any) {
    let client = EventsGateway.webClient.get(req.user.id)
    if (!client) {
      throw new HttpException('客户端未连接', 500);
    }
    this.dockerService.execCode(execCode, client);
    return R.okD();
  }
}
