import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleWeight } from '../../users/entities/user.entity';
import {
  ALLOWED_ROLES_KEY,
  IS_PUBLIC_KEY,
  ONLY_ROLE_KEY,
} from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Check for onlyRole
    const onlyRole = this.reflector.getAllAndOverride<UserRole>(ONLY_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) return false;

    if (onlyRole) {
      // Allow only if user's role matches exactly
      return user.role === onlyRole;
    }

    // Add this logic to your RolesGuard
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ALLOWED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowedRoles) {
      return allowedRoles.includes(user.role);
    }

    // Check for minimumRole
    const minimumRole = this.reflector.getAllAndOverride<UserRole>(
      'minimumRole',
      [context.getHandler(), context.getClass()],
    );
    if (!minimumRole) return true;

    const userRoleWeight = UserRoleWeight[user.role];
    const minimumRoleWeight = UserRoleWeight[minimumRole];
    return userRoleWeight >= minimumRoleWeight;
  }
}
