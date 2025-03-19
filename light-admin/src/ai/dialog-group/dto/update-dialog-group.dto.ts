import { PartialType } from '@nestjs/swagger';
import { CreateDialogGroupDto } from './create-dialog-group.dto';

export class UpdateDialogGroupDto extends PartialType(CreateDialogGroupDto) {}
