import { supabase } from '../supabase';

export type Participant = {
  id: string;
  plot_id: string;
  name: string;
  role: string; // producteur | chef_menage | cotoncultrice | sourga | nawetane
  sex?: 'M' | 'F';
  birthdate?: string;
  cni?: string;
  literacy?: boolean;
  languages?: string[];
  is_young?: boolean;
  created_at?: string;
};

export const ParticipantsService = {
  async listByPlot(plotId: string) {
    return supabase.from('participants').select('*').eq('plot_id', plotId).order('created_at', { ascending: false });
  },
  async create(input: Omit<Participant, 'id' | 'created_at'>) {
    return supabase.from('participants').insert(input).select('*').single();
  },
  async update(id: string, updates: Partial<Participant>) {
    return supabase.from('participants').update(updates).eq('id', id).select('*').single();
  }
};

