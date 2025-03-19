import { IsString, IsOptional } from 'class-validator';
import { ModelType } from 'src/types';
import { Message } from 'src/common/message';

export class CreateQianwenDto {
  message: Message[];

  aiModelType: ModelType = ModelType.QIAN_WEN;

  reasoning: boolean = false;

  dialogGroupId: number | null = null;

  reasoningContent: string;

  @IsOptional()
  inputType: string | null;

  @IsOptional()
  mediaUrl: string | null;

  @IsString()
  dialogContent: string;
}
