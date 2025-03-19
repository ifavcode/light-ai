import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/config/database/database.module';
import { userProviders } from './user.providers';
import { SshClientModule } from 'src/config/ssh-client/ssh-client.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, SshClientModule, JwtModule],
  controllers: [UserController],
  providers: [UserService, ...userProviders],
})
export class UserModule {}
