import { Audio } from 'expo-av';

export interface AudioFile {
  uri: string;
}

export interface AudioRecorderModule {
  start(): Promise<void>;
  stop(): Promise<AudioFile>;
}

type AudioDep = Pick<typeof Audio, 'requestPermissionsAsync' | 'Recording' | 'RecordingOptionsPresets'>;

export function createAudioRecorderModule(audio: AudioDep): AudioRecorderModule {
  let recording: InstanceType<typeof Audio.Recording> | null = null;

  return {
    async start() {
      const { granted } = await audio.requestPermissionsAsync();
      if (!granted) throw new Error('Microphone permission denied');

      recording = new audio.Recording();
      await recording.prepareToRecordAsync(audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
    },

    async stop() {
      if (!recording) throw new Error('No active recording');

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recording = null;

      return { uri: uri! };
    },
  };
}
