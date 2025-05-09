import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tools/image')
export class ToolsController {
  @Post('tranform')
  @UseInterceptors(FileInterceptor('file'))
  async tranform(
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
  ) {}
}
