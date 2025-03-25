import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class UploadRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uploadRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  fileUrl: string;

  @Column({ comment: '单位KB' })
  fileSize: number;

  @Column()
  fileName: string;

  @Column()
  fileType: string;

  @Column()
  createTime: Date;

  @Column({ default: false })
  delFlag: boolean;
}
