import { Controller, Get, Post, Delete, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('setup-intent')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createSetupIntent(@Request() req) {
    return this.paymentsService.createSetupIntent(req.user.id, req.user.role);
  }

  @Get('methods')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async listPaymentMethods(@Request() req) {
    return this.paymentsService.listPaymentMethods(req.user.id, req.user.role);
  }

  @Post('methods')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async addPaymentMethod(@Request() req, @Body('paymentMethodId') paymentMethodId: string) {
    return this.paymentsService.addPaymentMethod(req.user.id, req.user.role, paymentMethodId);
  }

  @Delete('methods/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removePaymentMethod(@Param('id') id: string, @Request() req) {
    return this.paymentsService.removePaymentMethod(req.user.id, req.user.role, id);
  }

  @Put('methods/:id/default')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async setDefault(@Param('id') id: string, @Request() req) {
    return this.paymentsService.setDefaultPaymentMethod(req.user.id, req.user.role, id);
  }

  @Post('create-payment-intent')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async createPaymentIntent(@Request() req, @Body('amount') amount: number) {
    return this.paymentsService.createPaymentIntent(req.user.id, amount);
  }
}
