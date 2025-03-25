import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DialogGroup } from '../../ai/dialog-group/entities/dialog-group.entity';
import { AiModel } from 'src/ai/qianwen/entities/ai-model.entity';
import { AiTool } from 'src/ai/tools/entities/tool.entity';
import { UploadRecord } from 'src/upload/entities/upload-record.entity';
import { PicToVideo } from 'src/ai/tools/entities/pic-to-video.entity';
import { VirtualCompany } from 'src/ai/tools/entities/virtual-company.entity';
import { UserRecord } from './user-record.entity';
import { Role } from 'src/role/entities/role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  avatar: string;

  @Column()
  nickname: string;

  @Column()
  createTime: Date;

  @Column({ default: false })
  delFlag: boolean;

  @OneToMany(() => AiModel, (aiModel) => aiModel.user)
  qianwenDialogs: AiModel[];

  @OneToMany(() => DialogGroup, (DialogGroup) => DialogGroup.user)
  dialogGroup: DialogGroup[];

  @OneToMany(() => AiTool, (aiTool) => aiTool.user)
  aiTools: AiTool[];

  @OneToMany(() => UploadRecord, (uploadRecords) => uploadRecords.user)
  uploadRecords: UploadRecord[];

  @OneToMany(() => PicToVideo, (o) => o.user)
  picToVideoRecord: PicToVideo[];

  @OneToMany(() => VirtualCompany, (o) => o.user)
  virtualCompoanyRecord: VirtualCompany[];

  @OneToMany(() => UserRecord, (o) => o.user)
  userRecord: UserRecord[];

  @ManyToMany(() => Role, (o) => o.users)
  @JoinTable()
  roles: Role[];
}
