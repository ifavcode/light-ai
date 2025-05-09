import { SetMetadata } from '@nestjs/common';
import { RoleConstant } from 'src/config/constant';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleConstant[]) =>
  SetMetadata(ROLES_KEY, roles);
