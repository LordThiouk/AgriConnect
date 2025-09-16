import { supabase } from '../lib/supabase';

export type Campaign = {
  id: string;
  title: string;
  description?: string | null;
  channel: 'sms' | 'push' | 'whatsapp' | 'inapp';
  message_template: string;
  locale: string;
  target_filters: Record<string, any>;
  schedule_at?: string | null;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateCampaignInput = {
  title: string;
  description?: string;
  channel: 'sms' | 'push' | 'whatsapp' | 'inapp';
  message_template: string;
  locale?: string;
  target_filters?: Record<string, any>;
  schedule_at?: string | null;
};

export const campaignsService = {
  async list() {
    return supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async create(input: CreateCampaignInput) {
    const payload = {
      title: input.title,
      description: input.description ?? null,
      channel: input.channel,
      message_template: input.message_template,
      locale: input.locale ?? 'fr',
      target_filters: input.target_filters ?? {},
      schedule_at: input.schedule_at ?? null,
    };
    return supabase
      .from('campaigns')
      .insert(payload)
      .select('*')
      .single();
  },

  async update(id: string, updates: Partial<Campaign>) {
    return supabase
      .from('campaigns')
      .update(updates as any)
      .eq('id', id)
      .select('*')
      .single();
  },

  async schedule(id: string, when?: string | null) {
    return this.update(id, { status: 'scheduled', schedule_at: when ?? null } as any);
  },
};


