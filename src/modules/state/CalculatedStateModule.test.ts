import {
  calculateGoatCount,
  calculateProductiveAssetValue,
  calculateNetIncome,
  calculateSavingsBalance,
  getCurrentPopStep,
  getActiveLivelihoods,
} from './CalculatedStateModule';

describe('calculateGoatCount', () => {
  it('sums purchases and births minus sales and deaths', () => {
    const events = [
      { event_type: 'purchase' as const, count: 3, event_date: '2024-01-01' },
      { event_type: 'birth' as const, count: 2, event_date: '2024-02-01' },
      { event_type: 'sale' as const, count: 1, event_date: '2024-03-01' },
      { event_type: 'death' as const, count: 1, event_date: '2024-04-01' },
    ];
    expect(calculateGoatCount(events)).toBe(3);
  });

  it('returns 0 with no events', () => {
    expect(calculateGoatCount([])).toBe(0);
  });
});

describe('calculateProductiveAssetValue', () => {
  it('returns baseline non-livestock assets plus goat count times value per head', () => {
    expect(calculateProductiveAssetValue(5, 4000, 10000)).toBe(30000);
  });

  it('returns just the baseline when there are no goats', () => {
    expect(calculateProductiveAssetValue(0, 4000, 10000)).toBe(10000);
  });
});

describe('calculateNetIncome', () => {
  const today = new Date('2024-06-15');

  it('sums income minus expenses within the given number of days', () => {
    const entries = [
      { type: 'income' as const, amount: 1000, entry_date: '2024-06-10', livelihood_source: 'livestock' as const },
      { type: 'expense' as const, amount: 200, entry_date: '2024-06-12', livelihood_source: 'livestock' as const },
    ];
    expect(calculateNetIncome(entries, 30, today)).toBe(800);
  });

  it('ignores entries outside the date window', () => {
    const entries = [
      { type: 'income' as const, amount: 1000, entry_date: '2024-05-01', livelihood_source: 'livestock' as const },
      { type: 'income' as const, amount: 500, entry_date: '2024-06-10', livelihood_source: 'livestock' as const },
    ];
    expect(calculateNetIncome(entries, 30, today)).toBe(500);
  });

  it('returns 0 with no entries', () => {
    expect(calculateNetIncome([], 30, today)).toBe(0);
  });
});

describe('calculateSavingsBalance', () => {
  it('returns deposits minus withdrawals', () => {
    const entries = [
      { type: 'deposit' as const, amount: 500, entry_date: '2024-01-01' },
      { type: 'deposit' as const, amount: 300, entry_date: '2024-02-01' },
      { type: 'withdrawal' as const, amount: 100, entry_date: '2024-03-01' },
    ];
    expect(calculateSavingsBalance(entries)).toBe(700);
  });

  it('returns 0 with no entries', () => {
    expect(calculateSavingsBalance([])).toBe(0);
  });
});

describe('getCurrentPopStep', () => {
  it('returns the maximum step number for the given track', () => {
    const progress = [
      { livelihood_track: 'goat_rearing' as const, step_number: 2, completed_at: '2024-01-01' },
      { livelihood_track: 'goat_rearing' as const, step_number: 4, completed_at: '2024-03-01' },
      { livelihood_track: 'vegetable_cultivation' as const, step_number: 5, completed_at: '2024-02-01' },
    ];
    expect(getCurrentPopStep(progress, 'goat_rearing')).toBe(4);
  });

  it('returns null when the track has no progress', () => {
    expect(getCurrentPopStep([], 'nano_enterprise')).toBeNull();
  });
});

describe('getActiveLivelihoods', () => {
  it('returns unique tracks that have any progress entry', () => {
    const progress = [
      { livelihood_track: 'goat_rearing' as const, step_number: 1, completed_at: '2024-01-01' },
      { livelihood_track: 'goat_rearing' as const, step_number: 2, completed_at: '2024-02-01' },
      { livelihood_track: 'vegetable_cultivation' as const, step_number: 1, completed_at: '2024-03-01' },
    ];
    expect(getActiveLivelihoods(progress)).toEqual(
      expect.arrayContaining(['goat_rearing', 'vegetable_cultivation'])
    );
    expect(getActiveLivelihoods(progress)).toHaveLength(2);
  });

  it('returns empty array when there is no progress', () => {
    expect(getActiveLivelihoods([])).toEqual([]);
  });
});
