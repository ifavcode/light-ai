import { forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import R from 'src/common/R';
import { Constant } from 'src/config/constant';
import { DockerService } from 'src/docker/docker.service';
import { ExecCode } from 'src/docker/entities/exec-code.entity';
import { ExecStatus } from 'src/types';
import { User } from 'src/user/entities/user.entity';

@WebSocketGateway({
  path: '/socket/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => DockerService))
    private readonly dockerService: DockerService,
  ) {}
  handleDisconnect(client: Socket) {
    const parsed = this.parseToken(client);
    if (parsed.id) {
      if (EventsGateway.webClient.has(parsed.id)) {
        EventsGateway.webClient.delete(parsed.id);
      }
    }
  }

  @WebSocketServer()
  server: Server;

  static webClient = new Map<number, Socket>();

  handleConnection(client: Socket, ...args: any[]) {
    const parsed = this.parseToken(client);
    if (parsed.id) {
      EventsGateway.webClient.set(parsed.id, client);
    }
  }

  @SubscribeMessage('execCode')
  findAll(
    @MessageBody() data: ExecCode,
    @ConnectedSocket() client: Socket,
  ): Observable<WsResponse<string>> {
    // const parsed = this.parseToken(client)
    this.dockerService.execCode(data, client);
    return of({
      event: 'execCode',
      data: '提交成功',
    });
  }

  parseToken(client: Socket) {
    const headers = client.handshake.headers;
    const token = headers[Constant.JWT_HEADER_NAME.toLowerCase()];
    if (typeof token === 'string') {
      /** parsed
       * {
            username: 'Dion.Cassin',
            id: 1,
            uuid: 'ff42a8df-3b36-4542-b300-5f359113274c',
            iat: 1740751150,
            exp: 1740837550
          }
       */
      return this.authService.parseToken(token);
    }
  }

}
