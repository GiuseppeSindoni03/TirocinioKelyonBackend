import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { DoctorRegisterDto } from './dto/doctor-register.dto';

import { DeviceInfo } from './utils/deviceInfo';
import { LogoutDto } from './dto/logout.dto';
import { Request, Response } from 'express';

import { BaseUserInterceptor } from 'src/transform.interceptor';
import { UserItem } from 'src/common/types/userItem';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseInterceptors(BaseUserInterceptor)
  @Post('/signup')
  async signUp(
    @Body() authCredentialsDto: DoctorRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserItem> {
    const { accessToken, refreshToken, user } = await this.authService.signUp(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );
    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

    return user;
  }

  @UseInterceptors(BaseUserInterceptor)
  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserItem> {
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );

    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

    return user;
  }

  // @UseGuards(AuthGuard('jwt-refresh'))
  // @Post('/refresh')
  // async refresh(
  //   @Req() req: Request,
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<UserItem> {
  //   const refreshPayload = req.user as JwtPayload;

  //   const { accessToken, refreshToken, user } =
  //     await this.authService.refreshToken(refreshPayload);

  //   res
  //     .cookie('jwt', accessToken, {
  //       httpOnly: true,
  //       secure: true,
  //       sameSite: 'lax',
  //     })
  //     .cookie('refreshToken', refreshToken, {
  //       httpOnly: true,
  //       secure: true,
  //       sameSite: 'lax',
  //     });

  //   return user;
  // }

  // @Post('/refresh')
  // @UseGuards(AuthGuard('jwt-refresh'))
  // refresh(@Body() refreshDto: RefreshDto): Promise<TokensDto> {
  //   return this.authService.refreshToken(refreshDto);
  // }

  // @Post('/logout')
  // async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
  //   const refreshToken = req.cookies.refreshToken;
  //   if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

  //   res.clearCookie('jwt');
  //   res.clearCookie('refreshToken');

  //   return this.authService.logout(refreshToken);
  // }

  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    res.clearCookie('jwt');
    res.clearCookie('refreshToken');

    await this.authService.logout(refreshToken);

    return res.status(200).send({ message: 'Logout success' }); // ✅ chiude la response!
  }

  private getDeviceInfo(req: Request): DeviceInfo {
    return {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
        'Unknown',
    };
  }
}
