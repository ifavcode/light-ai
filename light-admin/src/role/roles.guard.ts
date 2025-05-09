import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleConstant } from '../config/constant';
import { ROLES_KEY } from 'src/common/metadata';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleConstant[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const roles = (user.roles ?? []).reduce((pre: string[], cur: Role) => {
      pre.push(cur.roleSymbol);
      return pre;
    }, []);
    return requiredRoles.some((role) => roles.includes(role));
  }
}
