import { AiModel } from 'src/ai/qianwen/entities/ai-model.entity';
import { ModelInputType, ModelType } from 'src/types';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class DialogGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupName: string;

  @Column()
  createTime: Date;

  @Column({ default: ModelType.QIAN_WEN })
  aiModelType: string;

  @Column({ default: ModelInputType.TEXT })
  inputType: ModelInputType;

  @ManyToOne(() => User, (user) => user.dialogGroup, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => AiModel, (aiDialog) => aiDialog.dialogGroup, {
    onDelete: 'CASCADE',
  })
  dialogs: AiModel[];
}
