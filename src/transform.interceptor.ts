import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  applyDecorators,
  UseInterceptors,
} from '@nestjs/common';
import Response from 'express';
import { map } from 'rxjs/operators';
import { User } from './user/user.entity';
import { Observable } from 'rxjs';

export interface ExtendentResponse extends Response {
  user: User;
}
@Injectable()
export class BaseUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    console.log('Mario Oliva');
    return next.handle().pipe(
      map((data) => {
        console.log('Data:', data);
        if (
          data &&
          typeof data === 'object'
          // && 'user' in data
        ) {
          console.log('ciao');
          delete data.password;
        }

        return data;
      }),
    );
  }
}

export const UserInterceptor = (): MethodDecorator & ClassDecorator => {
  return applyDecorators(UseInterceptors(BaseUserInterceptor));
};
