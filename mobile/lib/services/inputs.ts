import { supabase } from '../supabase';

export type InputRecord = {
  id: string;
  plot_id?: string;
  crop_id?: string;
  category: 'seed' | 'treatment' | 'fertilizer' | 'herbicide' | 'supply' | 'protection' | 'spare' | 'food' | 'bags';
  label?: string;
  quantity?: number;
  unit?: string; // kg, sac, sachet, fcfa, etc.
  planned?: boolean;
  cost_fcfa?: number;
  notes?: string;
  created_at?: string;
};

export const InputsService = {
  async listByPlot(plotId: string) {
    return supabase.from('inputs').select('*').eq('plot_id', plotId).order('created_at', { ascending: false });
  },
  async create(input: Omit<InputRecord, 'id' | 'created_at'>) {
    return supabase.from('inputs').insert(input).select('*').single();
  },
  async update(id: string, updates: Partial<InputRecord>) {
    return supabase.from('inputs').update(updates).eq('id', id).select('*').single();
  }
};

