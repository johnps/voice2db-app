import type { IncomeEntry, GoatEvent } from '../extraction/extractionSchema';

interface GoatEventRow {
  event_type: 'purchase' | 'sale' | 'birth' | 'death';
  count: number;
  event_date: string;
}

interface IncomeEntryRow extends IncomeEntry {
  entry_date: string;
}

interface SavingsEntryRow {
  type: 'deposit' | 'withdrawal';
  amount: number;
  entry_date: string;
}

interface PopProgressRow {
  livelihood_track: 'vegetable_cultivation' | 'goat_rearing' | 'nano_enterprise';
  step_number: number;
  completed_at: string;
}

export function calculateGoatCount(events: GoatEventRow[]): number {
  return events.reduce((total, e) => {
    if (e.event_type === 'purchase' || e.event_type === 'birth') return total + e.count;
    return total - e.count;
  }, 0);
}

export function calculateProductiveAssetValue(
  goatCount: number,
  goatValuePerHead: number,
  baselineNonLivestock: number,
): number {
  return baselineNonLivestock + goatCount * goatValuePerHead;
}

export function calculateNetIncome(
  entries: IncomeEntryRow[],
  days: number,
  today: Date = new Date(),
): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);

  return entries
    .filter((e) => new Date(e.entry_date) >= cutoff)
    .reduce((total, e) => (e.type === 'income' ? total + e.amount : total - e.amount), 0);
}

export function calculateSavingsBalance(entries: SavingsEntryRow[]): number {
  return entries.reduce(
    (total, e) => (e.type === 'deposit' ? total + e.amount : total - e.amount),
    0,
  );
}

export function getCurrentPopStep(
  progress: PopProgressRow[],
  track: string,
): number | null {
  const steps = progress
    .filter((p) => p.livelihood_track === track)
    .map((p) => p.step_number);
  return steps.length > 0 ? Math.max(...steps) : null;
}

export function getActiveLivelihoods(progress: PopProgressRow[]): string[] {
  return [...new Set(progress.map((p) => p.livelihood_track))];
}
