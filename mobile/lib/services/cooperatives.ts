import { supabase } from '../supabase-client';
import { Cooperative } from '../../types/fiche-creation';

export class CooperativeService {
  private static supabase = supabase;

  static async getCooperatives(): Promise<Cooperative[]> {
    try {
      const { data, error } = await this.supabase
        .from('cooperatives')
        .select('id, name, region, department')
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[CooperativeService.getCooperatives] error:', (e as any)?.message || e);
      return [];
    }
  }
}
