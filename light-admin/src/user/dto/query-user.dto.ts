import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { Page } from 'src/common/Page';

export class QueryUserDto extends Page {
  @IsOptional()
  @IsString()
  username: string = '';

  @IsOptional()
  @IsString()
  nickname: string = '';
}
