import { createAudioRecorderModule } from './AudioRecorderModule';

const mockRequestPermissionsAsync = jest.fn();
const mockPrepareToRecordAsync = jest.fn();
const mockStartAsync = jest.fn();
const mockStopAndUnloadAsync = jest.fn();
const mockGetURI = jest.fn();

const mockRecordingInstance = {
  prepareToRecordAsync: mockPrepareToRecordAsync,
  startAsync: mockStartAsync,
  stopAndUnloadAsync: mockStopAndUnloadAsync,
  getURI: mockGetURI,
};

const mockAudio = {
  requestPermissionsAsync: mockRequestPermissionsAsync,
  Recording: jest.fn(() => mockRecordingInstance),
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
  mockPrepareToRecordAsync.mockResolvedValue(undefined);
  mockStartAsync.mockResolvedValue(undefined);
  mockStopAndUnloadAsync.mockResolvedValue(undefined);
  mockGetURI.mockReturnValue('file:///tmp/recording.m4a');
});

describe('AudioRecorderModule', () => {
  describe('start', () => {
    it('requests microphone permission and begins recording', async () => {
      const recorder = createAudioRecorderModule(mockAudio);

      await recorder.start();

      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(mockPrepareToRecordAsync).toHaveBeenCalled();
      expect(mockStartAsync).toHaveBeenCalled();
    });

    it('throws when microphone permission is denied', async () => {
      mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
      const recorder = createAudioRecorderModule(mockAudio);

      await expect(recorder.start()).rejects.toThrow('Microphone permission denied');
    });
  });

  describe('stop', () => {
    it('stops recording and returns the local file URI', async () => {
      const recorder = createAudioRecorderModule(mockAudio);
      await recorder.start();

      const result = await recorder.stop();

      expect(mockStopAndUnloadAsync).toHaveBeenCalled();
      expect(result).toEqual({ uri: 'file:///tmp/recording.m4a' });
    });

    it('throws when called before start', async () => {
      const recorder = createAudioRecorderModule(mockAudio);

      await expect(recorder.stop()).rejects.toThrow('No active recording');
    });
  });
});
