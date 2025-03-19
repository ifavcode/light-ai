import { IsDate, IsObject, IsString } from 'class-validator';
import { User } from 'src/user/entities/user.entity';

export class CreateDialogGroupDto {
  @IsString()
  groupName: string;

  createTime:Date

  user: User;
}
