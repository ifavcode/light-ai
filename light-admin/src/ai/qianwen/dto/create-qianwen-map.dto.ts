import { ModelType } from "src/types";
import { CreateQianwenDto } from "./create-qianwen.dto";

export class CreateQianwenMapDto {
  createQianwenMap: Record<ModelType, CreateQianwenDto>
}