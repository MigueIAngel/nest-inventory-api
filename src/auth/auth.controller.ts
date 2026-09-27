import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { type AuthUser, CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.usersService.findById(user.id);
    if (!found) throw new NotFoundException();
    return found;
  }
}
