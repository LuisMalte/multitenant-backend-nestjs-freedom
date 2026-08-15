import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { TenantGuard } from '../../common/guards';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

/**
 * Controlador de Autenticación.
 * Gestiona el endpoint de inicio de sesión.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @UseGuards(TenantGuard)
  login(
    @Req() request: Request,
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(request, dto);
  }
}