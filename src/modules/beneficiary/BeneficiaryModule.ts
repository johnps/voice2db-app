import type { SupabaseClient } from '@supabase/supabase-js';

export interface Beneficiary {
  id: string;
  name: string;
  village_name: string;
  age: number;
  family_size: number;
  phone_number: string;
  shg_name: string | null;
  baseline_income: number;
  baseline_savings: number;
  baseline_non_livestock_assets: number;
  goat_value_per_head: number;
}

export interface BeneficiaryModule {
  getAssigned(workerId: string): Promise<Beneficiary[]>;
  getProfile(id: string): Promise<Beneficiary>;
}

export function createBeneficiaryModule(supabase: SupabaseClient): BeneficiaryModule {
  return {
    async getAssigned(workerId) {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*, worker_beneficiary!inner(worker_id)')
        .eq('worker_beneficiary.worker_id', workerId);

      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async getProfile(id) {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  };
}
