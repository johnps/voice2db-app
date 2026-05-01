import { createLLMExtractionModule } from './LLMExtractionModule';
import { EXTRACTION_TOOL } from './extractionSchema';

const mockCreate = jest.fn();

const mockAnthropic = {
  messages: { create: mockCreate },
} as any;

beforeEach(() => jest.clearAllMocks());

const makeToolResponse = (input: object) => ({
  content: [{ type: 'tool_use', name: EXTRACTION_TOOL.name, input }],
});

describe('LLMExtractionModule', () => {
  it('sends the transcript to Claude with the extraction tool', async () => {
    mockCreate.mockResolvedValue(makeToolResponse({
      income_entries: [], savings_entries: [], goat_events: [], pop_progress: [],
    }));
    const extractor = createLLMExtractionModule(mockAnthropic);

    await extractor.extract('Meena has 2 goats.');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5',
        tools: [expect.objectContaining({ name: EXTRACTION_TOOL.name })],
        messages: [expect.objectContaining({ role: 'user', content: expect.stringContaining('Meena has 2 goats.') })],
      })
    );
  });

  it('returns parsed ExtractionResult from the tool response', async () => {
    mockCreate.mockResolvedValue(makeToolResponse({
      income_entries: [],
      savings_entries: [],
      goat_events: [{ event_type: 'purchase', count: 2 }],
      pop_progress: [],
    }));
    const extractor = createLLMExtractionModule(mockAnthropic);

    const result = await extractor.extract('Meena bought 2 goats.');

    expect(result.goat_events).toEqual([{ event_type: 'purchase', count: 2 }]);
    expect(result.income_entries).toEqual([]);
  });

  it('returns empty arrays when Claude finds nothing to extract', async () => {
    mockCreate.mockResolvedValue(makeToolResponse({
      income_entries: [], savings_entries: [], goat_events: [], pop_progress: [],
    }));
    const extractor = createLLMExtractionModule(mockAnthropic);

    const result = await extractor.extract('The weather was nice today.');

    expect(result).toEqual({
      income_entries: [], savings_entries: [], goat_events: [], pop_progress: [],
    });
  });

  it('throws when the API returns an error', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));
    const extractor = createLLMExtractionModule(mockAnthropic);

    await expect(extractor.extract('test')).rejects.toThrow('API rate limit exceeded');
  });
});
