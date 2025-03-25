import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Constant, RedisConstant } from '../constant';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(@InjectRedis() private readonly redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Constant.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const uuidRedis = await this.redis.get(RedisConstant.AUTH_KEY + payload.id);

    if (uuidRedis != payload.uuid) {
      throw new UnauthorizedException('认证过期');
    }
    const userJson = await this.redis.get(RedisConstant.USER_KEY + payload.id);

    if (userJson) {
      return JSON.parse(userJson);
    }

    return payload;
  }
}
