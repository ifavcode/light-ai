import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Sse,
  Req,
  MessageEvent,
  HttpException,
  Query,
} from '@nestjs/common';
import { QianwenService } from './qianwen.service';
import { CreateQianwenDto } from './dto/create-qianwen.dto';
import { UpdateQianwenDto } from './dto/update-qianwen.dto';
import { interval, Observable, of, Subscriber } from 'rxjs';
import R from 'src/common/R';
import { CreateQianwenMapDto } from './dto/create-qianwen-map.dto';
import { AudioService } from './audio.service';
import { TextToVideoDTO } from './dto/text-to-video.dto';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('qianwen')
export class QianwenController {
  private static clientsMap: Map<number, Subscriber<MessageEvent>> = new Map();

  constructor(
    private readonly qianwenService: QianwenService,
    private readonly audioService: AudioService,
  ) {}

  @Post('dialog')
  create(@Body() createQianwenDto: CreateQianwenDto, @Req() req: any) {
    if (!QianwenController.clientsMap.get(req.user.id)) {
      throw new HttpException('客户端未连接', 500);
    }
    QianwenService.userCancelMap[req.user.id] = false;
    this.qianwenService.chooseModel(
      createQianwenDto,
      QianwenController.clientsMap.get(req.user.id) as Subscriber<MessageEvent>,
      req.user,
    );
    return R.okD();
  }

  @Post('dialogMore')
  createMore(
    @Body() createQianwenMapDto: CreateQianwenMapDto,
    @Req() req: any,
  ) {
    if (!QianwenController.clientsMap.get(req.user.id)) {
      throw new HttpException('客户端未连接', 500);
    }
    QianwenService.userCancelMap[req.user.id] = false;
    this.qianwenService.chooseModelMore(
      createQianwenMapDto,
      QianwenController.clientsMap.get(req.user.id) as Subscriber<MessageEvent>,
      req.user,
    );
    return R.okD();
  }

  @Get('all')
  findAll(@Req() req: any) {
    return this.qianwenService.findAll(req.user.id);
  }

  @Get('id:id')
  findOne(@Param('id') id: string) {
    return this.qianwenService.findOne(+id);
  }

  @Patch('id:id')
  update(@Param('id') id: string, @Body() updateQianwenDto: UpdateQianwenDto) {
    return this.qianwenService.update(+id, updateQianwenDto);
  }

  @Delete('id:id')
  remove(@Param('id') id: string) {
    return this.qianwenService.remove(+id);
  }

  @Get('cancel')
  cancel(@Req() req: any) {
    QianwenService.userCancelMap[req.user.id] = true;
  }

  @Sse('connect')
  connect(@Req() req: any) {
    QianwenService.userCancelMap[req.user.id] = false;
    return new Observable<any>((observable) => {
      if (QianwenController.clientsMap.get(req.user.id)) {
        QianwenController.clientsMap.get(req.user.id)?.unsubscribe();
      }
      QianwenController.clientsMap.set(req.user.id, observable);
      observable.next({ data: { msg: '连接成功', type: 'connect' } });

      let timer = setInterval(() => {
        observable.next({ data: { msg: 'keepping', type: 'message' } });
      }, 1000 * 30);

      return () => {
        clearInterval(timer);
        QianwenController.clientsMap.delete(req.user.id);
      };
    });
  }

  @Get('onlineCnt')
  async onlineCnt() {
    return QianwenController.clientsMap.size;
  }

  @Post('textToVideo')
  async textToVideo(@Body() textToVideoDTO: TextToVideoDTO, @Req() req: any) {
    if (!textToVideoDTO.text || textToVideoDTO.text === '') {
      throw new HttpException('请传入文本', 500);
    }
    if (textToVideoDTO.text.length > 2000) {
      throw new HttpException('文本较多、暂不支持朗读', 500);
    }
    let client = EventsGateway.webClient.get(req.user.id);
    if (!client) {
      throw new HttpException('客户端未连接', 500);
    }
    this.audioService.textToVideo(textToVideoDTO, client, req.user);
    return R.okD();
  }

  @Get('getAudioHistory')
  async getAudioHistory(@Req() req: any, @Query('id') id: number) {
    const audioUrl = await this.audioService.getAudioHistory(id, req.user);
    return R.okD(audioUrl);
  }
  }
