import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const MinimumRole = (role: UserRole) => SetMetadata('minimumRole', role);

export const ONLY_ROLE_KEY = 'onlyRole';
export const OnlyRole = (role: UserRole) => SetMetadata(ONLY_ROLE_KEY, role);

export const ALLOWED_ROLES_KEY = 'allowedRoles';
export const AllowedRoles = (...roles: UserRole[]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);
