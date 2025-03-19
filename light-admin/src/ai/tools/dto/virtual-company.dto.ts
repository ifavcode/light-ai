import { Entity } from 'typeorm';

@Entity()
export class VirtualCompanyDTO {
  prompt: string;
  model?: string;
}
