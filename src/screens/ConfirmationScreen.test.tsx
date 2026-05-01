import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ConfirmationScreen } from './ConfirmationScreen';
import type { ExtractionResult } from '../modules/extraction/extractionSchema';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const fakeResult: ExtractionResult = {
  income_entries: [{ livelihood_source: 'livestock', type: 'income', amount: 2000 }],
  savings_entries: [],
  goat_events: [{ event_type: 'purchase', count: 2 }],
  pop_progress: [{ livelihood_track: 'goat_rearing', step_number: 2 }],
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      beneficiaryId: 'b-1',
      transcript: 'Meena bought 2 goats.',
      audioUri: 'file:///tmp/rec.m4a',
      extractionResult: fakeResult,
    },
  }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'w-1' } } }),
}));

const mockApplyUpdate = jest.fn();

jest.mock('../modules/update/BeneficiaryUpdateModule', () => ({
  createBeneficiaryUpdateModule: () => ({ applyUpdate: mockApplyUpdate }),
}));

jest.mock('../lib/supabase', () => ({ supabase: {} }));

beforeEach(() => {
  jest.clearAllMocks();
  mockApplyUpdate.mockResolvedValue(undefined);
});

describe('ConfirmationScreen', () => {
  it('shows a summary of the extraction result', () => {
    render(<ConfirmationScreen />);
    expect(screen.getByText(/livestock.*income.*2000/i)).toBeTruthy();
    expect(screen.getByText(/purchase.*2/i)).toBeTruthy();
    expect(screen.getByText(/goat rearing.*step 2/i)).toBeTruthy();
  });

  it('calls applyUpdate and navigates to beneficiary profile on save', async () => {
    render(<ConfirmationScreen />);

    fireEvent.press(screen.getByTestId('save-button'));

    await waitFor(() => expect(mockApplyUpdate).toHaveBeenCalledWith({
      beneficiaryId: 'b-1',
      workerId: 'w-1',
      result: fakeResult,
      transcript: 'Meena bought 2 goats.',
      audioUri: 'file:///tmp/rec.m4a',
    }));

    expect(mockNavigate).toHaveBeenCalledWith('BeneficiaryProfile', { id: 'b-1' });
  });

  it('navigates back on cancel without saving', () => {
    render(<ConfirmationScreen />);
    fireEvent.press(screen.getByTestId('cancel-button'));
    expect(mockGoBack).toHaveBeenCalled();
    expect(mockApplyUpdate).not.toHaveBeenCalled();
  });
});
