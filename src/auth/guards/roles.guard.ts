import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const allowedRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!allowedRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isAuthorized = user && allowedRoles.includes(user.role);

    if (!isAuthorized) {
      const method = request.method;
      const url = request.originalUrl ?? request.url; // compatibilità Express
      console.warn(
        `❌ Access denied for user ${user?.email ?? 'unknown'} with role ${user?.role ?? 'none'} — required: [${allowedRoles.join(', ')}] on ${method} ${url}`,
      );
      throw new ForbiddenException(
        `You do not have permission to access this resource`,
      );
    }

    return true;
  }
}
