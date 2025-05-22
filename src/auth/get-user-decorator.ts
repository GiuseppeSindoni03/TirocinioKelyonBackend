import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserItem } from 'src/common/types/userItem';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): UserItem => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
