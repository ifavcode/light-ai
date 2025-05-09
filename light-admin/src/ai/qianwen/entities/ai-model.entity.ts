import { DialogGroup } from 'src/ai/dialog-group/entities/dialog-group.entity';
import { ModelInputType, ModelType } from 'src/types';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AiModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  dialogContent: string;

  @Column('text')
  replyContent: string;

  @Column('text')
  reasoningContent: string = '';

  @Column({ default: '' })
  mediaUrl: string;

  @Column({ default: '', comment: '朗读链接' })
  audioUrl: string;

  @Column({ default: ModelInputType.TEXT })
  inputType: string;

  // @Column({ length: 10 })
  // role: ['system', 'assistant', 'user'];

  @ManyToOne(() => User, (user) => user.qianwenDialogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  createTime: Date;

  @Column()
  aiModelType: ModelType;

  @ManyToOne(() => DialogGroup, (dialogGroup) => dialogGroup.dialogs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  dialogGroup: DialogGroup | null;
}
