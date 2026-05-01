import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RecordingScreen } from './RecordingScreen';

const mockNavigate = jest.fn();
const mockRoute = { params: { beneficiaryId: 'b-1', beneficiaryName: 'Meena Didi' } };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => mockRoute,
}));

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockTranscribe = jest.fn();

jest.mock('../modules/recorder/AudioRecorderModule', () => ({
  createAudioRecorderModule: () => ({ start: mockStart, stop: mockStop }),
}));

jest.mock('../modules/stt/STTModule', () => ({
  createSTTModule: () => Promise.resolve({ transcribe: mockTranscribe }),
}));

jest.mock('expo-av', () => ({ Audio: {} }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockStart.mockResolvedValue(undefined);
  mockStop.mockResolvedValue({ uri: 'file:///tmp/recording.m4a' });
  mockTranscribe.mockResolvedValue('Meena has 2 goats and planted tomatoes.');
});

afterEach(() => jest.useRealTimers());

describe('RecordingScreen', () => {
  it('shows the record button initially', () => {
    render(<RecordingScreen />);
    expect(screen.getByTestId('record-button')).toBeTruthy();
  });

  it('disables the stop button for the first 10 seconds after recording starts', async () => {
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());

    expect(screen.getByTestId('stop-button')).toBeDisabled();
  });

  it('enables the stop button after 10 seconds', async () => {
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());

    act(() => jest.advanceTimersByTime(10000));

    expect(screen.getByTestId('stop-button')).not.toBeDisabled();
  });

  it('shows a transcribing indicator while Whisper is running', async () => {
    mockTranscribe.mockReturnValue(new Promise(() => {})); // never resolves
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());
    act(() => jest.advanceTimersByTime(10000));
    fireEvent.press(screen.getByTestId('stop-button'));

    await waitFor(() => expect(screen.getByTestId('transcribing-indicator')).toBeTruthy());
  });

  it('shows the transcript in an editable field after transcription', async () => {
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());
    act(() => jest.advanceTimersByTime(10000));
    fireEvent.press(screen.getByTestId('stop-button'));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Meena has 2 goats and planted tomatoes.')).toBeTruthy()
    );
  });

  it('allows the worker to edit the transcript', async () => {
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());
    act(() => jest.advanceTimersByTime(10000));
    fireEvent.press(screen.getByTestId('stop-button'));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Meena has 2 goats and planted tomatoes.')).toBeTruthy()
    );

    fireEvent.changeText(
      screen.getByDisplayValue('Meena has 2 goats and planted tomatoes.'),
      'Meena has 3 goats and planted tomatoes.'
    );

    expect(screen.getByDisplayValue('Meena has 3 goats and planted tomatoes.')).toBeTruthy();
  });

  it('navigates to the extraction screen with the transcript on continue', async () => {
    render(<RecordingScreen />);

    fireEvent.press(screen.getByTestId('record-button'));
    await waitFor(() => expect(screen.getByTestId('stop-button')).toBeTruthy());
    act(() => jest.advanceTimersByTime(10000));
    fireEvent.press(screen.getByTestId('stop-button'));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Meena has 2 goats and planted tomatoes.')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('continue-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Extraction', {
      beneficiaryId: 'b-1',
      transcript: 'Meena has 2 goats and planted tomatoes.',
      audioUri: 'file:///tmp/recording.m4a',
    });
  });
});
