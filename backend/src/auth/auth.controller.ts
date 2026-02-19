import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('userId') userId: string) {
    return this.authService.login(userId);
  }

  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }
}
