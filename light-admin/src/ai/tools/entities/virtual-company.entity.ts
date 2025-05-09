import { TaskStatusEnum } from 'src/types';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class VirtualCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '提示词' })
  prompt: string;

  @Column()
  model: string;

  @Column('text')
  replyContent: string;

  @Column('text')
  errorContent: string;

  @Column()
  taskStatus: TaskStatusEnum;

  @ManyToOne(() => User, (user) => user.picToVideoRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  createTime: Date;

  @Column({ nullable: true })
  endTime: Date;
}
