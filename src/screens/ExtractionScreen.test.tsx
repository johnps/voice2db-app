import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ExtractionScreen } from './ExtractionScreen';
import type { ExtractionResult } from '../modules/extraction/extractionSchema';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRoute = {
  params: {
    beneficiaryId: 'b-1',
    transcript: 'Meena bought 2 goats and is at step 3 for vegetable cultivation.',
    audioUri: 'file:///tmp/rec.m4a',
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => mockRoute,
}));

const mockExtract = jest.fn();

jest.mock('../modules/extraction/LLMExtractionModule', () => ({
  createLLMExtractionModule: () => ({ extract: mockExtract }),
}));

jest.mock('../lib/anthropic', () => ({ anthropic: {} }));

const fakeResult: ExtractionResult = {
  income_entries: [{ livelihood_source: 'livestock', type: 'income', amount: 2000 }],
  savings_entries: [],
  goat_events: [{ event_type: 'purchase', count: 2 }],
  pop_progress: [{ livelihood_track: 'vegetable_cultivation', step_number: 3 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockExtract.mockResolvedValue(fakeResult);
});

describe('ExtractionScreen', () => {
  it('shows a loading indicator while extraction is running', async () => {
    mockExtract.mockReturnValue(new Promise(() => {}));
    render(<ExtractionScreen />);
    expect(screen.getByTestId('extraction-loading')).toBeTruthy();
  });

  it('renders income entries after extraction', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByText('livestock · income')).toBeTruthy());
    expect(screen.getByDisplayValue('2000')).toBeTruthy();
  });

  it('renders goat events with an editable count', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByText('purchase')).toBeTruthy());
    expect(screen.getByDisplayValue('2')).toBeTruthy();
  });

  it('renders pop progress with an editable step number', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByText('vegetable cultivation')).toBeTruthy());
    expect(screen.getByDisplayValue('3')).toBeTruthy();
  });

  it('allows editing a goat event count', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('2')).toBeTruthy());

    fireEvent.changeText(screen.getByDisplayValue('2'), '4');

    expect(screen.getByDisplayValue('4')).toBeTruthy();
  });

  it('navigates back on discard without saving', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByTestId('discard-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('discard-button'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to the confirmation screen with the edited result on confirm', async () => {
    render(<ExtractionScreen />);
    await waitFor(() => expect(screen.getByTestId('confirm-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('confirm-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Confirmation', {
      beneficiaryId: 'b-1',
      transcript: mockRoute.params.transcript,
      audioUri: mockRoute.params.audioUri,
      extractionResult: fakeResult,
    });
  });
});
