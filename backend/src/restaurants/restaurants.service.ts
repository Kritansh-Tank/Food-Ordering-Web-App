import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userRole: string, userCountry: string) {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('restaurants').select('*').order('name');

    // Country-based filtering: non-admin users only see their country's restaurants
    if (userRole !== 'admin') {
      query = query.eq('country', userCountry);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string, userRole: string, userCountry: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Country-based check
    if (userRole !== 'admin' && data.country !== userCountry) {
      return null;
    }

    return data;
  }

  async getMenu(restaurantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category')
      .order('name');

    if (error) throw error;
    return data;
  }
}
