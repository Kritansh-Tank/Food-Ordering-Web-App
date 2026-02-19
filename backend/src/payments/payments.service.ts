import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(key || '', { apiVersion: '2025-01-27.acacia' as any });
  }

  // Ensure user has a Stripe customer ID, create one if not
  private async ensureStripeCustomer(userId: string): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, name, email')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Create Stripe customer
    const customer = await this.stripe.customers.create({
      name: user.name,
      email: user.email,
      metadata: { supabase_user_id: userId },
    });

    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    return customer.id;
  }

  async createSetupIntent(userId: string, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can manage payment methods');
    }

    const customerId = await this.ensureStripeCustomer(userId);
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return { clientSecret: setupIntent.client_secret };
  }

  async listPaymentMethods(userId: string, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view payment methods');
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addPaymentMethod(userId: string, userRole: string, paymentMethodId: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can add payment methods');
    }

    const customerId = await this.ensureStripeCustomer(userId);

    // Attach payment method to customer in Stripe
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Get card details from Stripe
    const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    const supabase = this.supabaseService.getClient();

    // Check if this is the first payment method (make it default)
    const { data: existing } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('user_id', userId);

    const isDefault = !existing || existing.length === 0;

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        stripe_payment_method_id: paymentMethodId,
        card_last4: pm.card?.last4 || '****',
        card_brand: pm.card?.brand || 'unknown',
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removePaymentMethod(userId: string, userRole: string, methodId: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can remove payment methods');
    }

    const supabase = this.supabaseService.getClient();
    const { data: method } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', methodId)
      .eq('user_id', userId)
      .single();

    if (method?.stripe_payment_method_id) {
      try {
        await this.stripe.paymentMethods.detach(method.stripe_payment_method_id);
      } catch (e) {
        // Stripe might fail if already detached
      }
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  async setDefaultPaymentMethod(userId: string, userRole: string, methodId: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can update payment methods');
    }

    const supabase = this.supabaseService.getClient();

    // Unset all defaults
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', methodId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createPaymentIntent(userId: string, amount: number) {
    const customerId = await this.ensureStripeCustomer(userId);

    // Get default payment method
    const supabase = this.supabaseService.getClient();
    const { data: defaultMethod } = await supabase
      .from('payment_methods')
      .select('stripe_payment_method_id')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    };

    if (defaultMethod) {
      paymentIntentData.payment_method = defaultMethod.stripe_payment_method_id;
    }

    const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // Used by OrdersService during checkout — creates a PaymentIntent with the correct currency
  async createPaymentIntentForOrder(userId: string, amount: number, currency: string) {
    const customerId = await this.ensureStripeCustomer(userId);

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: userId },
    };

    const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }
}
