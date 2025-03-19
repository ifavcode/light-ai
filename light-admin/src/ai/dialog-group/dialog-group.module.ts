import { Module } from '@nestjs/common';
import { DialogGroupService } from './dialog-group.service';
import { DialogGroupController } from './dialog-group.controller';
import { DatabaseModule } from 'src/config/database/database.module';
import { userProviders } from 'src/user/user.providers';
import { UserService } from '../../user/user.service';
import { dialogGroupProviders } from './dialog-group-provider';
import { SshClientModule } from 'src/config/ssh-client/ssh-client.module';

@Module({
  imports: [DatabaseModule, SshClientModule],
  controllers: [DialogGroupController],
  providers: [
    DialogGroupService,
    UserService,
    ...dialogGroupProviders,
    ...userProviders,
  ],
  exports: [DialogGroupService],
})
export class DialogGroupModule { }
