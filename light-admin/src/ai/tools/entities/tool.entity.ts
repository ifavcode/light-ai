import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AiTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  routeName: string;

  @Column()
  toolName: string;

  @Column({ default: '' })
  toolImage: string;

  @Column({ default: '' })
  desc: string;

  @Column({})
  createTime: Date;

  @Column({ default: false })
  delFlag: boolean;
 
  @ManyToOne(() => User, (user) => user.qianwenDialogs)
  @JoinColumn()
  user: User;
}
