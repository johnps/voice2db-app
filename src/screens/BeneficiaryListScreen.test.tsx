import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { BeneficiaryListScreen } from './BeneficiaryListScreen';
import type { Beneficiary } from '../modules/beneficiary/BeneficiaryModule';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'worker-1' } } }),
}));

const mockGetAssigned = jest.fn();

jest.mock('../modules/beneficiary/BeneficiaryModule', () => ({
  createBeneficiaryModule: () => ({ getAssigned: mockGetAssigned }),
}));

jest.mock('../lib/supabase', () => ({ supabase: {} }));

const fakeBeneficiaries: Beneficiary[] = [
  {
    id: 'b-1', name: 'Meena Didi', village_name: 'Rampur',
    age: 34, family_size: 5, phone_number: '+91987', shg_name: 'Shakti SHG',
    baseline_income: 3000, baseline_savings: 500,
    baseline_non_livestock_assets: 10000, goat_value_per_head: 4000,
  },
  {
    id: 'b-2', name: 'Sunita Bai', village_name: 'Khanpur',
    age: 28, family_size: 4, phone_number: '+91876', shg_name: null,
    baseline_income: 2000, baseline_savings: 300,
    baseline_non_livestock_assets: 5000, goat_value_per_head: 4000,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAssigned.mockResolvedValue(fakeBeneficiaries);
});

describe('BeneficiaryListScreen', () => {
  it('renders the assigned beneficiaries', async () => {
    render(<BeneficiaryListScreen />);

    await waitFor(() => {
      expect(screen.getByText('Meena Didi')).toBeTruthy();
      expect(screen.getByText('Sunita Bai')).toBeTruthy();
    });
  });

  it('filters beneficiaries by name when searching', async () => {
    render(<BeneficiaryListScreen />);
    await waitFor(() => expect(screen.getByText('Meena Didi')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Search by name or village'), 'sunita');

    expect(screen.queryByText('Meena Didi')).toBeNull();
    expect(screen.getByText('Sunita Bai')).toBeTruthy();
  });

  it('filters beneficiaries by village when searching', async () => {
    render(<BeneficiaryListScreen />);
    await waitFor(() => expect(screen.getByText('Meena Didi')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('Search by name or village'), 'khanpur');

    expect(screen.queryByText('Meena Didi')).toBeNull();
    expect(screen.getByText('Sunita Bai')).toBeTruthy();
  });

  it('navigates to the beneficiary profile when tapped', async () => {
    render(<BeneficiaryListScreen />);
    await waitFor(() => expect(screen.getByText('Meena Didi')).toBeTruthy());

    fireEvent.press(screen.getByText('Meena Didi'));

    expect(mockNavigate).toHaveBeenCalledWith('BeneficiaryProfile', { id: 'b-1' });
  });
});
