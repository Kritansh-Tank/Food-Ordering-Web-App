import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentsService } from '../payments/payments.service';

interface CreateOrderDto {
  restaurant_id: string;
  items: { menu_item_id: string; quantity: number }[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async findAll(userRole: string, userCountry: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name, cuisine, country),
        order_items(
          *,
          menu_item:menu_items(name, price)
        )
      `)
      .order('created_at', { ascending: false });

    if (userRole === 'admin') {
      // Admin sees all
    } else if (userRole === 'manager') {
      query = query.eq('country', userCountry);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(userId: string, userRole: string, userCountry: string, dto: CreateOrderDto) {
    const supabase = this.supabaseService.getClient();

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', dto.restaurant_id)
      .single();

    if (restError || !restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (userRole !== 'admin' && restaurant.country !== userCountry) {
      throw new ForbiddenException('Cannot order from restaurants outside your country');
    }

    const menuItemIds = dto.items.map((i) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, name')
      .in('id', menuItemIds);

    if (menuError) throw menuError;

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

    let total = 0;
    for (const item of dto.items) {
      const price = priceMap.get(item.menu_item_id);
      if (!price) throw new BadRequestException(`Menu item ${item.menu_item_id} not found`);
      total += price * item.quantity;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        restaurant_id: dto.restaurant_id,
        status: 'pending',
        total,
        country: restaurant.country,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = dto.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: priceMap.get(item.menu_item_id),
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return { ...order, items: orderItems };
  }

  async cancel(orderId: string, userRole: string, userCountry: string) {
    const supabase = this.supabaseService.getClient();

    if (userRole === 'member') {
      throw new ForbiddenException('Members cannot cancel orders');
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === 'manager' && order.country !== userCountry) {
      throw new ForbiddenException('Cannot cancel orders from another country');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Step 1: Create Stripe PaymentIntent and return clientSecret for the payment form
  async checkout(orderId: string, userId: string, userRole: string, userCountry: string) {
    const supabase = this.supabaseService.getClient();

    if (userRole === 'member') {
      throw new ForbiddenException('Members cannot checkout orders');
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name),
        order_items(*, menu_item:menu_items(name, price))
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === 'manager' && order.country !== userCountry) {
      throw new ForbiddenException('Cannot checkout orders from another country');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be checked out');
    }

    // Create a Stripe PaymentIntent
    const currency = order.country === 'India' ? 'inr' : 'usd';
    const stripeResult = await this.paymentsService.createPaymentIntentForOrder(
      userId, Number(order.total), currency,
    );

    // Store the PaymentIntent ID on the order
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: stripeResult.paymentIntentId })
      .eq('id', orderId);

    return {
      clientSecret: stripeResult.clientSecret,
      paymentIntentId: stripeResult.paymentIntentId,
      order,
    };
  }

  // Step 2: Called after payment succeeds — mark order as placed
  async confirmPayment(orderId: string, userRole: string, userCountry: string) {
    const supabase = this.supabaseService.getClient();

    if (userRole === 'member') {
      throw new ForbiddenException('Members cannot confirm orders');
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === 'manager' && order.country !== userCountry) {
      throw new ForbiddenException('Cannot confirm orders from another country');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'placed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
