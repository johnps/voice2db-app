import { createBeneficiaryUpdateModule } from './BeneficiaryUpdateModule';
import type { ExtractionResult } from '../extraction/extractionSchema';

const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
mockInsert.mockReturnValue({ error: null });

const mockSupabase = { from: mockFrom } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

const baseParams = {
  beneficiaryId: 'b-1',
  workerId: 'w-1',
  transcript: 'Meena bought 2 goats.',
  audioUri: 'file:///tmp/rec.m4a',
};

describe('BeneficiaryUpdateModule', () => {
  it('inserts income entries into income_entries table', async () => {
    const result: ExtractionResult = {
      income_entries: [{ livelihood_source: 'livestock', type: 'income', amount: 2000 }],
      savings_entries: [],
      goat_events: [],
      pop_progress: [],
    };
    const updater = createBeneficiaryUpdateModule(mockSupabase);

    await updater.applyUpdate({ ...baseParams, result });

    expect(mockFrom).toHaveBeenCalledWith('income_entries');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          beneficiary_id: 'b-1',
          worker_id: 'w-1',
          livelihood_source: 'livestock',
          type: 'income',
          amount: 2000,
        }),
      ])
    );
  });

  it('inserts goat events into goat_events table', async () => {
    const result: ExtractionResult = {
      income_entries: [],
      savings_entries: [],
      goat_events: [{ event_type: 'purchase', count: 2 }],
      pop_progress: [],
    };
    const updater = createBeneficiaryUpdateModule(mockSupabase);

    await updater.applyUpdate({ ...baseParams, result });

    expect(mockFrom).toHaveBeenCalledWith('goat_events');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          beneficiary_id: 'b-1',
          worker_id: 'w-1',
          event_type: 'purchase',
          count: 2,
        }),
      ])
    );
  });

  it('always inserts an audit row into beneficiary_updates', async () => {
    const result: ExtractionResult = {
      income_entries: [],
      savings_entries: [],
      goat_events: [],
      pop_progress: [],
    };
    const updater = createBeneficiaryUpdateModule(mockSupabase);

    await updater.applyUpdate({ ...baseParams, result });

    expect(mockFrom).toHaveBeenCalledWith('beneficiary_updates');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiary_id: 'b-1',
        worker_id: 'w-1',
        transcript: 'Meena bought 2 goats.',
        audio_url: 'file:///tmp/rec.m4a',
        json_diff: result,
      })
    );
  });

  it('skips insert calls for empty arrays', async () => {
    const result: ExtractionResult = {
      income_entries: [],
      savings_entries: [],
      goat_events: [],
      pop_progress: [],
    };
    const updater = createBeneficiaryUpdateModule(mockSupabase);

    await updater.applyUpdate({ ...baseParams, result });

    const calledTables = mockFrom.mock.calls.map((args: string[]) => args[0]);
    expect(calledTables).not.toContain('income_entries');
    expect(calledTables).not.toContain('goat_events');
    expect(calledTables).not.toContain('pop_progress');
    expect(calledTables).not.toContain('savings_entries');
    expect(calledTables).toContain('beneficiary_updates');
  });
});
