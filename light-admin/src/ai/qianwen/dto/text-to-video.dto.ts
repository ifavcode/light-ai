import { Optional } from '@nestjs/common';

export class TextToVideoDTO {
  text: string;

  @Optional()
  id: number; // aiModel主键
}
