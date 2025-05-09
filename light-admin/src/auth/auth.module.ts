import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../config/database/database.module';
import { userProviders } from '../user/user.providers';
import { JwtModule } from '@nestjs/jwt';
import { Constant } from 'src/config/constant';
import { LocalStrategy } from 'src/config/jwt/local.strategy';
import { JwtStrategy } from 'src/config/jwt/jwt.strategy';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: Constant.JWT_SECRET,
      signOptions: { expiresIn: Constant.JWT_EXPIRE_TIME },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ...userProviders, LocalStrategy, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
