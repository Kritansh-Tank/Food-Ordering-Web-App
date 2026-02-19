import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Request() req) {
    return this.ordersService.findAll(req.user.role, req.user.country, req.user.id);
  }

  @Post()
  async create(@Request() req, @Body() body: { restaurant_id: string; items: { menu_item_id: string; quantity: number }[] }) {
    return this.ordersService.create(req.user.id, req.user.role, req.user.country, body);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancel(id, req.user.role, req.user.country);
  }

  // Step 1: Create a Stripe PaymentIntent and return the clientSecret
  @Post(':id/checkout')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async checkout(@Param('id') id: string, @Request() req) {
    return this.ordersService.checkout(id, req.user.id, req.user.role, req.user.country);
  }

  // Step 2: Called after Stripe payment succeeds — marks order as placed
  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async confirm(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmPayment(id, req.user.role, req.user.country);
  }
}
