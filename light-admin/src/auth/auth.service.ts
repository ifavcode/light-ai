import {
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Constant, RedisConstant } from '../config/constant/index';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { randomUUID } from 'crypto';
import { bcryptPassword, checkPassword } from 'src/utils';
import { ChangePwdDTO } from './dto/chang-pwd.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  parseToken(token: string) {
    token = token.replace(Constant.JWT_PREFIX, '');
    return this.jwtService.decode(token);
  }

  async validateUser(username: string, pass: string) {
    const user: User | null = await this.userRepository.findOne({
      where: {
        username,
      },
      relations: {
        roles: true,
      },
    });
    if (!user) return null;
    if (await checkPassword(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: User) {
    const uuid = randomUUID();
    const payload = {
      username: user.username,
      id: user.id,
      roles: user.roles,
      uuid,
    };
    this.redis.set(RedisConstant.USER_KEY + user.id, JSON.stringify(user));
    this.redis.set(RedisConstant.AUTH_KEY + user.id, uuid);
    return {
      accessToken: Constant.JWT_PREFIX + this.jwtService.sign(payload),
    };
  }

  logout(user: User, token: string) {
    token = token.replace(Constant.JWT_PREFIX, '');
    const payload = this.jwtService.decode(token);
    const uuid = payload.uuid;
    this.redis.del(RedisConstant.USER_KEY + user.id);
    this.redis.del(RedisConstant.AUTH_KEY + user.id, uuid);
  }

  async changePwd(user: User, dto: ChangePwdDTO) {
    const dbUser = await this.userRepository.findOne({
      where: {
        username: user.username,
      },
    });
    if (!dbUser) {
      throw new HttpException('用户不存在', 500);
    }
    const v = await this.redis.get(RedisConstant.USER_NOT_OLD_PWD + user.id);
    if (!v) {
      if (!dto.password) {
        throw new HttpException('请输入旧密码', 500);
      }
      if (!(await checkPassword(dto.password, dbUser.password))) {
        throw new HttpException('原密码错误', 500);
      }
    }
    const hashPwd = await bcryptPassword(dto.newPassword);
    dbUser.password = hashPwd;
    this.userRepository.save(dbUser);
    if (v) {
      this.redis.del(RedisConstant.USER_NOT_OLD_PWD + user.id);
    }
  }

  async judgeChangePwd(user: User) {
    const v = await this.redis.get(RedisConstant.USER_NOT_OLD_PWD + user.id);
    return !!v;
  }
}
