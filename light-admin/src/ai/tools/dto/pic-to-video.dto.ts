export class PicToVideoDTO {
  model?: string;
  prompt: string;
  imgUrl: string;
  duration: number;
  promptExtend: boolean = true;
  seed?: number; // 设置seed属性可为空
}
