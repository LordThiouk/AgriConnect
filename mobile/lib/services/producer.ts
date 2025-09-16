import { supabase } from '../supabase-client';

export type ProducerDb = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_id: string | null;
  cooperative_id: string | null;
};

export type CreateProducerByAgentInput = {
  firstName: string;
  lastName: string;
  phone?: string | null;
  birthDate?: string | null;
  gender?: 'M' | 'F' | null;
  cooperativeId?: string | null;
};

export class ProducerService {
  private static supabase = supabase;

  // Find a producer by unique phone
  static async findProducerByPhone(phone: string): Promise<ProducerDb | null> {
    if (!phone) return null;
    const { data, error } = await this.supabase
      .from('producers')
      .select('id, first_name, last_name, phone, profile_id, cooperative_id')
      .eq('phone', phone)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[ProducerService.findProducerByPhone] error:', error.message);
      return null;
    }
    return data as ProducerDb | null;
  }

  // Create a producer record as agent (profile_id remains NULL)
  static async createProducerByAgent(input: CreateProducerByAgentInput): Promise<{ id: string } | null> {
    // 0) If a producer with the same phone already exists, reuse it
    if (input.phone) {
      const existing = await this.findProducerByPhone(input.phone);
      if (existing?.id) {
        // Optionally update cooperative if missing
        if (!existing.cooperative_id && input.cooperativeId) {
          await this.updateProducerById(existing.id, { cooperativeId: input.cooperativeId });
        }
        // Optionally update names if empty
        if ((!existing.first_name || !existing.last_name) && (input.firstName || input.lastName)) {
          await this.updateProducerById(existing.id, { firstName: input.firstName, lastName: input.lastName });
        }
        return { id: existing.id };
      }
    }

    // Prefer secured RPC to bypass RLS
    const { data, error } = await this.supabase.rpc('create_producer_for_agent', {
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_phone: input.phone ?? null,
      p_birth_date: input.birthDate ?? null,
      p_gender: input.gender ?? null,
      p_cooperative_id: input.cooperativeId ?? null,
    });
    if (error || !data) {
      console.error('[ProducerService.createProducerByAgent] insert error:', error?.message || 'unknown');
      return null;
    }
    return { id: data as unknown as string };
  }

  // Link or create a producer when a user signs up in the app (post-OTP)
  // Returns the linked/created producerId
  static async onboardProducerFromApp(params: {
    userId: string;
    phone: string | null;
    displayName?: string | null;
  }): Promise<{ producerId: string | null }> {
    const { userId, phone, displayName } = params;

    // 1) Try to link an existing producer with same phone and NULL profile_id
    if (phone) {
      const { data: linked, error: linkError } = await this.supabase
        .from('producers')
        .update({ profile_id: userId })
        .eq('phone', phone)
        .is('profile_id', null)
        .select('id')
        .single();

      if (!linkError && linked?.id) {
        return { producerId: linked.id };
      }

      // If a producer exists but already linked, reuse that id (read-only)
      const existing = await this.findProducerByPhone(phone);
      if (existing?.profile_id) {
        return { producerId: existing.id };
      }
    }

    // 2) Otherwise create a new producer for this user
    const [firstName, ...rest] = (displayName || '').trim().split(' ').filter(Boolean);
    const lastName = rest.join(' ') || firstName || 'Producteur';
    const safeFirst = firstName || 'N/A';

    const createPayload: any = {
      first_name: safeFirst,
      last_name: lastName,
      phone: phone || null,
      profile_id: userId,
    };

    const { data: created, error: createErr } = await this.supabase
      .from('producers')
      .insert(createPayload)
      .select('id')
      .single();

    if (createErr) {
      console.error('[ProducerService.onboardProducerFromApp] create error:', createErr.message);
      return { producerId: null };
    }

    return { producerId: (created as any).id };
  }

  // Update a producer by id
  static async updateProducerById(producerId: string, updates: Partial<Omit<CreateProducerByAgentInput, 'firstName'|'lastName'>> & { firstName?: string; lastName?: string; }): Promise<boolean> {
    if (!producerId) return false;
    const record: any = {};
    if (typeof updates.firstName !== 'undefined') record.first_name = updates.firstName;
    if (typeof updates.lastName !== 'undefined') record.last_name = updates.lastName;
    if (typeof updates.phone !== 'undefined') record.phone = updates.phone ?? null;
    if (typeof updates.birthDate !== 'undefined') record.birth_date = updates.birthDate ?? null;
    if (typeof updates.gender !== 'undefined') record.gender = updates.gender ?? null;
    if (typeof updates.cooperativeId !== 'undefined') record.cooperative_id = updates.cooperativeId ?? null;

    const { error } = await this.supabase
      .from('producers')
      .update(record)
      .eq('id', producerId);

    if (error) {
      console.error('[ProducerService.updateProducerById] error:', error.message);
      return false;
    }
    return true;
  }
}
