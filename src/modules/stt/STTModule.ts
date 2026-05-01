import { initWhisper } from 'whisper.rn';

export interface STTModule {
  transcribe(audioUri: string): Promise<string>;
}

export async function createSTTModule(modelPath: string): Promise<STTModule> {
  const context = await initWhisper({ filePath: modelPath });

  return {
    async transcribe(audioUri) {
      const { result } = await context.transcribe(audioUri, {
        language: 'en',
      });
      return result.trim();
    },
  };
}
