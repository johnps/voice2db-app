import { createBeneficiaryModule } from './BeneficiaryModule';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
  })),
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: [], error: null });
});

const fakeBeneficiary = {
  id: 'b-1',
  name: 'Meena Didi',
  village_name: 'Rampur',
  age: 34,
  family_size: 5,
  phone_number: '+919876543210',
  shg_name: 'Shakti SHG',
  baseline_income: 3000,
  baseline_savings: 500,
  baseline_non_livestock_assets: 10000,
  goat_value_per_head: 4000,
};

describe('BeneficiaryModule', () => {
  describe('getAssigned', () => {
    it('queries beneficiaries joined through worker_beneficiary for the given worker', async () => {
      mockEq.mockResolvedValue({ data: [fakeBeneficiary], error: null });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      await beneficiaries.getAssigned('worker-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('beneficiaries');
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('worker_beneficiary')
      );
      expect(mockEq).toHaveBeenCalledWith('worker_beneficiary.worker_id', 'worker-1');
    });

    it('returns the list of assigned beneficiaries', async () => {
      mockEq.mockResolvedValue({ data: [fakeBeneficiary], error: null });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      const result = await beneficiaries.getAssigned('worker-1');

      expect(result).toEqual([fakeBeneficiary]);
    });

    it('returns an empty array when the worker has no assignments', async () => {
      mockEq.mockResolvedValue({ data: [], error: null });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      const result = await beneficiaries.getAssigned('worker-1');

      expect(result).toEqual([]);
    });

    it('throws when Supabase returns an error', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      await expect(beneficiaries.getAssigned('worker-1')).rejects.toThrow('Permission denied');
    });
  });

  describe('getProfile', () => {
    it('returns the full profile for a given beneficiary ID', async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: fakeBeneficiary, error: null });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      const result = await beneficiaries.getProfile('b-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('beneficiaries');
      expect(mockEq).toHaveBeenCalledWith('id', 'b-1');
      expect(result).toEqual(fakeBeneficiary);
    });

    it('throws when the beneficiary is not found', async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Row not found' } });
      const beneficiaries = createBeneficiaryModule(mockSupabase);

      await expect(beneficiaries.getProfile('missing')).rejects.toThrow('Row not found');
    });
  });
});
