import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  HttpException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Public } from 'src/common/metadata';
import R from 'src/common/R';
import { PicToVideo } from './entities/pic-to-video.entity';
import { PicToVideoDTO } from './dto/pic-to-video.dto';
import { ConfigService } from '@nestjs/config';
import { Page } from 'src/common/Page';
import { DockerService } from 'src/docker/docker.service';
import { VirtualCompanyDTO } from './dto/virtual-company.dto';
import { EventsGateway } from 'src/events/events.gateway';
import { ExecStatus } from 'src/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { readFileSync, unlinkSync } from 'fs';
import { ArcFile, createExtractorFromData } from 'node-unrar-js';
import archiver from 'archiver';
import { Response } from 'express';
import path from 'path';
import { nanoid } from 'nanoid';
import { RenameParamsDto } from './dto/rename-params.dto';

@Controller('tools')
export class ToolsController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly dockerService: DockerService,
  ) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolsService.create(createToolDto);
  }

  @Get()
  @Public()
  async findAll() {
    return R.okD(await this.toolsService.findAll());
  }

  @Get('id/:id')
  @Public()
  async findOne(@Param('id') id: string) {
    return R.okD(await this.toolsService.findOne(+id));
  }

  @Patch('id/:id')
  update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update(+id, updateToolDto);
  }

  @Delete('id/:id')
  remove(@Param('id') id: string) {
    return this.toolsService.remove(+id);
  }

  @Post('picToVideo')
  async picToVideo(@Req() req: any, @Body() obj: PicToVideoDTO) {
    const ptv = new PicToVideo();
    if (!obj.model) {
      obj.model = 'wanx2.1-i2v-turbo';
    }
    ptv.model = obj.model;
    ptv.prompt = obj.prompt;
    ptv.imgUrl = obj.imgUrl;
    ptv.duration = obj.duration;
    ptv.promptExtend = obj.promptExtend;
    ptv.seed = obj.seed;
    const requestId = await this.toolsService.picToVideo(req.user, ptv);
    return R.ok('转化大概耗时约为3~5分钟，请耐心等待', requestId);
  }

  @Get('picToVideo')
  async getPicToVideoList(
    @Req() req: any,
    @Query('page', new DefaultValuePipe({ pageNum: 1, pageSize: 10 }))
    page: Page,
  ) {
    return R.okD(await this.toolsService.getPicToVideoList(req.user, page));
  }

  @Get('picToVideo/:id')
  async getPicToVideo(
    @Param('id', new ParseIntPipe()) id: number,
    @Req() req: any,
  ) {
    const res = await this.toolsService.getPicToVideo(id, req.user);
    return R.okD(res);
  }

  @Get('picToVideoAllow')
  async picToVideoAllow(@Req() req: any) {
    const bool = await this.toolsService.picToVideoAllow(req.user);
    return R.okD(bool);
  }

  @Post('virtualCompoany')
  async virtualCompoany(
    @Body() virtualCompanyDTO: VirtualCompanyDTO,
    @Req() req: any,
  ) {
    let client = EventsGateway.webClient.get(req.user.id);
    if (!client) {
      throw new HttpException('客户端未连接', 500);
    }
    const bool = await this.toolsService.virtualCompoanyAllow(req.user);
    if (!bool) {
      throw new HttpException('上一个任务进行中', 500);
    }
    virtualCompanyDTO.model = 'deepseek-response';
    this.dockerService.createVirCompany(req.user, virtualCompanyDTO);
    return R.okD();
  }

  @Get('virtualCompoanyAllow')
  async virtualCompoanyAllow(@Req() req: any) {
    const bool = await this.toolsService.virtualCompoanyAllow(req.user);
    return R.okD(bool);
  }

  @Get('virtualCompoanyLast')
  async virtualCompoanyLast(@Req() req: any) {
    return R.okD(await this.toolsService.virtualCompoanyLast(req.user));
  }

  @Get('virtualCompoanyList')
  async virtualCompoanyList(
    @Req() req: any,
    @Query('page', new DefaultValuePipe({ pageNum: 1, pageSize: 10 }))
    page: Page,
  ) {
    return R.okD(await this.toolsService.virtualCompoanyList(req.user, page));
  }

  @Get('virtualCompoanyList/:id')
  async virtualCompoanyListById(@Req() req: any, @Param('id') id: number) {
    return R.okD(await this.toolsService.virtualCompoanyListById(req.user, id));
  }

  @Post('changeNameBatch')
  @UseInterceptors(FileInterceptor('file'))
  async changeNameBatch(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 8 * 1024 * 128,
            message: '最大上传128MB的压缩包!',
          }),
          new FileTypeValidator({
            fileType: /^(application\/vnd.rar|application\/x-compressed)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() renameParams: RenameParamsDto,
    @Res() res: Response,
  ) {
    try {
      const { type, customString } = renameParams;

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="processed.zip"',
      });

      const arrayBuffer = new Uint8Array(file.buffer).buffer;
      const extractor = await createExtractorFromData({ data: arrayBuffer });
      const archive = archiver('zip', { zlib: { level: 9 } });

      const { files } = extractor.extract({
        files: (fileHeader) => !fileHeader.flags.encrypted,
      });
      let ovo = 1
      for (const entry of files) {
        const fileHeader = entry.fileHeader;
        if (fileHeader.flags.directory) {
          continue;
        }
        const entryPath = fileHeader.name;
        const normalizedPath = entryPath.startsWith('/')
          ? entryPath.slice(1)
          : entryPath;
        const dirName = path.dirname(normalizedPath);
        const ext = path.extname(normalizedPath);
        let newFileName = '';
        if (!type || type === 'normal') {
          newFileName = `${nanoid(10)}${ext}`;
        } else if (type === 'custom' && customString && customString !== '') {
          newFileName = `${customString}(${ovo})${ext}`;
          ovo++
        } else {
          newFileName = `${nanoid(10)}${ext}`;
        }
        const content = entry.extraction
          ? new TextDecoder('utf-8').decode(entry.extraction)
          : '';
        archive.append(content, {
          name: path.join(dirName, newFileName),
        });
      }
      archive.pipe(res);
      archive.finalize();
    } catch (error) {
      console.log(error);
      res.destroy();
    }
  }
}
