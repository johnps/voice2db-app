import type Anthropic from '@anthropic-ai/sdk';
import { EXTRACTION_TOOL, type ExtractionResult } from './extractionSchema';

export interface LLMExtractionModule {
  extract(transcript: string): Promise<ExtractionResult>;
}

const SYSTEM_PROMPT =
  'You are a data extraction assistant for a rural livelihoods programme. ' +
  'Extract only the fields explicitly mentioned in the field worker\'s voice note. ' +
  'Do not infer or guess values that were not stated.';

export function createLLMExtractionModule(
  client: Pick<Anthropic, 'messages'>,
  model = 'claude-haiku-4-5',
): LLMExtractionModule {
  return {
    async extract(transcript) {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [EXTRACTION_TOOL as unknown as Anthropic.Tool],
        tool_choice: { type: 'tool', name: EXTRACTION_TOOL.name },
        messages: [
          {
            role: 'user',
            content: `Extract structured data from this field observation:\n\n${transcript}`,
          },
        ],
      });

      const toolBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (!toolBlock) throw new Error('No tool use in response');

      return toolBlock.input as ExtractionResult;
    },
  };
}
