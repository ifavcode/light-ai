import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PicToVideo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  model: string;

  @Column({ comment: '提示词' })
  prompt: string;

  @Column({ comment: '图片URL' })
  imgUrl: string;

  @Column()
  duration: number;

  @Column({
    comment:
      '是否开启prompt智能改写。开启后使用大模型对输入prompt进行智能改写。对于较短的prompt生成效果提升明显，但会增加耗时',
    default: true,
  })
  promptExtend: boolean;

  @Column({ nullable: true })
  seed?: number;

  @Column()
  createTime: Date;

  @ManyToOne(() => User, (user) => user.picToVideoRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  requestId: string;

  @Column({
    default: '',
  })
  taskId: string;

  @Column({
    default: '',
  })
  taskStatus: string;

  @Column({
    default: '',
  })
  videoUrl: string;

  @Column({
    default: '',
  })
  rawVideoUrl: string;
}
