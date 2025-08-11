import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleWeight } from '../../users/entities/user.entity';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip role check for public endpoints
    if (isPublic) {
      return true;
    }

    const minimumRole = this.reflector.getAllAndOverride<UserRole>(
      'minimumRole',
      [context.getHandler(), context.getClass()],
    );

    // If no minimum role specified and not public, allow by default
    if (!minimumRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) return false;

    const userRoleWeight = UserRoleWeight[user.role];
    const minimumRoleWeight = UserRoleWeight[minimumRole];

    // User can access if their role weight is >= the minimum required
    return userRoleWeight >= minimumRoleWeight;
  }
}
