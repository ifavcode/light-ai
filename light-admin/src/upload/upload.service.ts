import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UploadRecord } from './entities/upload-record.entity';
import { User } from 'src/user/entities/user.entity';
import OSS from 'ali-oss';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { downloadFile } from 'src/utils/request';
import { basename } from 'path';

@Injectable()
export class UploadService {
  constructor(
    @Inject('UPLOAD_RECORD_REPOSITORY')
    private readonly uploadRecordRepository: Repository<UploadRecord>,
    @Inject('OSS_INSTANCE')
    private readonly ossClient: OSS,
  ) {}

  save(file: Express.Multer.File, user: User, url: string) {
    const obj = new UploadRecord();
    obj.createTime = new Date();
    obj.user = user;
    obj.fileName = file.originalname;
    obj.fileSize = file.size / 8;
    obj.fileUrl = url;
    obj.fileType = file.originalname.substring(
      file.originalname.lastIndexOf('.') + 1,
    );
    this.uploadRecordRepository.save(obj);
  }

  async uploadOSS(url: string, type: string) {
    const today = dayjs().format('YYYY-MM-DD');
    const tmpFile = await downloadFile(url);
    const result = await this.ossClient.put(
      today + '/' + basename(tmpFile.name) + '.' + type,
      tmpFile.name,
      {
        headers: {
          'x-oss-forbid-overwrite': 'false',
          'x-oss-storage-class': 'Standard',
          'x-oss-object-acl': 'public-read',
        },
      },
    );
    tmpFile.removeCallback();
    return result;
  }

  async uploaddOSSFile(file: Express.Multer.File) {
    const today = dayjs().format('YYYY-MM-DD');
    const result = await this.ossClient.put(
      today + '/' + file.originalname,
      file.buffer,
      {
        headers: {
          'x-oss-forbid-overwrite': 'false',
          'x-oss-storage-class': 'Standard',
          'x-oss-object-acl': 'public-read',
        },
      },
    );
    return result;
  }

  async uploadOSSBuffer(buffer: Buffer, ext?: string) {
    const today = dayjs().format('YYYY-MM-DD');
    const result = await this.ossClient.put(
      today + '/' + nanoid(10) + '.' + ext,
      buffer,
      {
        headers: {
          'x-oss-forbid-overwrite': 'false',
          'x-oss-storage-class': 'Standard',
          'x-oss-object-acl': 'public-read',
        },
      },
    );
    return result;
  }
}
