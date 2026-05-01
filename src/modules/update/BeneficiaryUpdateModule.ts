import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractionResult } from '../extraction/extractionSchema';

export interface UpdateParams {
  beneficiaryId: string;
  workerId: string;
  result: ExtractionResult;
  transcript: string;
  audioUri: string;
}

export interface BeneficiaryUpdateModule {
  applyUpdate(params: UpdateParams): Promise<void>;
}

export function createBeneficiaryUpdateModule(supabase: SupabaseClient): BeneficiaryUpdateModule {
  return {
    async applyUpdate({ beneficiaryId, workerId, result, transcript, audioUri }) {
      const today = new Date().toISOString().split('T')[0];

      if (result.income_entries.length > 0) {
        const { error } = await supabase.from('income_entries').insert(
          result.income_entries.map((e) => ({
            beneficiary_id: beneficiaryId,
            worker_id: workerId,
            entry_date: today,
            ...e,
          }))
        );
        if (error) throw new Error(error.message);
      }

      if (result.savings_entries.length > 0) {
        const { error } = await supabase.from('savings_entries').insert(
          result.savings_entries.map((e) => ({
            beneficiary_id: beneficiaryId,
            worker_id: workerId,
            entry_date: today,
            ...e,
          }))
        );
        if (error) throw new Error(error.message);
      }

      if (result.goat_events.length > 0) {
        const { error } = await supabase.from('goat_events').insert(
          result.goat_events.map((e) => ({
            beneficiary_id: beneficiaryId,
            worker_id: workerId,
            event_date: today,
            ...e,
          }))
        );
        if (error) throw new Error(error.message);
      }

      if (result.pop_progress.length > 0) {
        const { error } = await supabase.from('pop_progress').insert(
          result.pop_progress.map((e) => ({
            beneficiary_id: beneficiaryId,
            worker_id: workerId,
            completed_at: new Date().toISOString(),
            ...e,
          }))
        );
        if (error) throw new Error(error.message);
      }

      const { error: auditError } = await supabase.from('beneficiary_updates').insert({
        beneficiary_id: beneficiaryId,
        worker_id: workerId,
        transcript,
        audio_url: audioUri,
        json_diff: result,
      });
      if (auditError) throw new Error(auditError.message);
    },
  };
}
