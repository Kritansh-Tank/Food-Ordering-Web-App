import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.restaurantsService.findAll(req.user.role, req.user.country);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const restaurant = await this.restaurantsService.findOne(id, req.user.role, req.user.country);
    if (!restaurant) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }
    return restaurant;
  }

  @Get(':id/menu')
  async getMenu(@Param('id') id: string, @Request() req) {
    // Verify access to the restaurant first
    const restaurant = await this.restaurantsService.findOne(id, req.user.role, req.user.country);
    if (!restaurant) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }
    return this.restaurantsService.getMenu(id);
  }
}
