import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rowIp: string;

  @Column()
  ip: string;

  @Column()
  agent: string;

  @Column()
  createTime: Date;

  @ManyToOne(() => User, (user) => user.userRecord, { onDelete: 'CASCADE' })
  user: User;
}
