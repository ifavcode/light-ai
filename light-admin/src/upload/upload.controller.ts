import {
  Controller,
  FileTypeValidator,
  HttpException,
  Inject,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Client } from 'ssh2';
import R from 'src/common/R';
import {
  Constant,
  SystemConstant,
  VirCompanyConstant,
} from 'src/config/constant';
import dayjs from 'dayjs';
import OSS from 'ali-oss';
import { User } from 'src/user/entities/user.entity';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    @Inject('SSH_CLIENT_SOURCE')
    private readonly sshClient: Client,
  ) {}

  @Post('server')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 8 * 1024 * 10,
            message: '最大上传10MB的图片!',
          }),
          new FileTypeValidator({
            fileType: /^(image\/jpeg|image\/png|image\/gif|image\/bmp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      const url = await this.uploadFileFromBuffer(file);
      this.uploadService.save(file, req.user, url);
      return R.okD(url);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  @Post('oss')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileOSS(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 8 * 1024 * 10,
            message: '最大上传10MB的图片!',
          }),
          new FileTypeValidator({
            fileType: /^(image\/jpeg|image\/png|image\/gif|image\/bmp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.uploadService.uploaddOSSFile(file);
      return R.okD(result.url);
    } catch (e) {
      throw new HttpException(e.message, 500);
    }
  }

  @Post('ossFile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileOSSFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 8 * 1024 * 10,
            message: '最大上传512MB的文件!',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.uploadService.uploaddOSSFile(file);
      return R.okD(result.url);
    } catch (e) {
      throw new HttpException(e.message, 500);
    }
  }

  async uploadFileFromBuffer(file: Express.Multer.File): Promise<string> {
    const today = dayjs().format('YYYY-MM-DD');
    let remotePath = SystemConstant.FILE_ADDRESS + '/' + today;
    return new Promise((resolve, reject) => {
      this.sshClient.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.exists(remotePath, (f: boolean) => {
          if (!f) {
            sftp.mkdir(remotePath, (err) => {
              if (err) {
                console.log(err);
                reject(err.message);
              }
              remotePath += '/' + file.originalname;
              const writeStream = sftp.createWriteStream(remotePath);
              writeStream.on('error', (streamErr: Error) => {
                sftp.end();
                reject(streamErr);
              });
              writeStream.write(file.buffer, () => {
                writeStream.end(() => {
                  sftp.end();
                  resolve(
                    SystemConstant.DOMAIN +
                      SystemConstant.NGINX_ASSETS +
                      '/' +
                      today +
                      '/' +
                      file.originalname,
                  );
                });
              });
            });
          } else {
            remotePath += '/' + file.originalname;
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on('error', (streamErr: Error) => {
              sftp.end();
              reject(streamErr);
            });
            writeStream.write(file.buffer, () => {
              writeStream.end(() => {
                sftp.end();
                resolve(
                  SystemConstant.DOMAIN +
                    SystemConstant.NGINX_ASSETS +
                    '/' +
                    today +
                    '/' +
                    file.originalname,
                );
              });
            });
          }
        });
      });
    });
  }

}
