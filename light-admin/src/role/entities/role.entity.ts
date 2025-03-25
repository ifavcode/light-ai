import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleName: string;

  @Column()
  roleSymbol: string;

  @ManyToMany(() => User, (o) => o.roles)
  users: User[];
}
