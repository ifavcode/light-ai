import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Param,
  DefaultValuePipe,
  Query,
  UseInterceptors,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import R from 'src/common/R';
import { Public } from 'src/common/metadata';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { getClientIp } from 'src/utils';
import { Constant, RedisConstant } from 'src/config/constant';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Post('autoRegister')
  @Public()
  async autoCreate() {
    return R.okD(await this.userService.autoCreate());
  }

  @Get('profile')
  profile(@Request() req: any) {
    return R.okD(req.user);
  }

  @Get('files')
  async myFiles(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    return R.okD(await this.userService.listFiles(req.user, dir));
  }

  @Post('createDir')
  async createDir(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    if (dir !== '') {
      await this.userService.createDirFunc(req.user, dir);
    }
    return R.okD();
  }

  @Get('fileContent')
  async fileContent(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    return R.okD(await this.userService.getFileContentFunc(req.user, dir));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 8 * 1024 * 512,
            message: '最大上传512MB的文件!',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    await this.userService.uploadFileFromBufferToMetaGPT(file, req.user, dir);
    return R.okD();
  }

  @Post('deleteFile')
  async deleteFile(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    await this.userService.deleteFileFunc(req.user, dir);
    return R.okD();
  }

  @Post('deleteDir')
  async deleteDir(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
  ) {
    await this.userService.deleteDirFunc(req.user, dir);
    return R.okD();
  }

  @Get('downloadFile')
  async downloadFile(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
    @Res() res: Response,
  ) {
    await this.userService.downloadFileFunc(req.user, dir, res);
  }

  @Get('downloadDir')
  async downloadDir(
    @Request() req: any,
    @Query('dir', new DefaultValuePipe('')) dir: string,
    @Res() res: Response,
  ) {
    await this.userService.downloadDirFunc(req.user, dir, res);
  }

  @Get('record')
  @Public()
  async record(@Request() req: any) {
    const agent = req.headers['user-agent'];
    let authorization = req.headers['authorization'];
    let user: User | undefined;
    if (authorization) {
      authorization = authorization.replace(Constant.JWT_PREFIX, '');
      const payload = this.jwtService.decode(authorization);
      if (payload.id) {
        const userJson = await this.redis.get(
          RedisConstant.USER_KEY + payload.id,
        );
        if (userJson) {
          user = JSON.parse(userJson);
        }
      }
    }
    const clientIp = req.ip;
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ips = xForwardedFor?.split(',') || [];
    const realIp = ips[0]?.trim() || req.ip;
    this.userService.saveRecord(clientIp, realIp, agent, user);
    return R.okD();
  }
}
