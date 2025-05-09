import { PartialType } from '@nestjs/mapped-types';
import { CreateQianwenDto } from './create-qianwen.dto';

export class UpdateQianwenDto extends PartialType(CreateQianwenDto) {}
