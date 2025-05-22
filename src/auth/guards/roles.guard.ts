import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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

    return user && allowedRoles.includes(user.role);
  }
}
