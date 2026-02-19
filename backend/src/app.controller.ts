import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      status: 'running',
      message: 'FoodOrder API is running 🚀',
      docs: {
        auth: '/auth/users',
        restaurants: '/restaurants',
        orders: '/orders',
        payments: '/payments/methods',
      },
    };
  }
}
