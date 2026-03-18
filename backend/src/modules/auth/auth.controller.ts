import {
  Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  /** Accept either "fullName" or "name" from the client */
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsIn(['id_token', 'access_token'])
  @IsOptional()
  tokenType?: 'id_token' | 'access_token';
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.fullName ?? dto.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.auth.loginWithGoogle(dto.token, dto.tokenType ?? 'id_token');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: any) {
    return this.auth.getProfile(req.user.id);
  }
}
