export interface IncomeEntry {
  livelihood_source: 'agriculture' | 'livestock' | 'enterprise' | 'other';
  type: 'income' | 'expense';
  amount: number;
  notes?: string;
}

export interface SavingsEntry {
  type: 'deposit' | 'withdrawal';
  amount: number;
}

export interface GoatEvent {
  event_type: 'purchase' | 'sale' | 'birth' | 'death';
  count: number;
}

export interface PopProgress {
  livelihood_track: 'vegetable_cultivation' | 'goat_rearing' | 'nano_enterprise';
  step_number: number;
}

export interface ExtractionResult {
  income_entries: IncomeEntry[];
  savings_entries: SavingsEntry[];
  goat_events: GoatEvent[];
  pop_progress: PopProgress[];
}

export const EMPTY_RESULT: ExtractionResult = {
  income_entries: [],
  savings_entries: [],
  goat_events: [],
  pop_progress: [],
};

export const EXTRACTION_TOOL = {
  name: 'extract_beneficiary_update',
  description:
    'Extract structured field data from a field worker voice note. Only include fields explicitly mentioned.',
  input_schema: {
    type: 'object' as const,
    properties: {
      income_entries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            livelihood_source: { type: 'string', enum: ['agriculture', 'livestock', 'enterprise', 'other'] },
            type: { type: 'string', enum: ['income', 'expense'] },
            amount: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['livelihood_source', 'type', 'amount'],
        },
      },
      savings_entries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['deposit', 'withdrawal'] },
            amount: { type: 'number' },
          },
          required: ['type', 'amount'],
        },
      },
      goat_events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            event_type: { type: 'string', enum: ['purchase', 'sale', 'birth', 'death'] },
            count: { type: 'number' },
          },
          required: ['event_type', 'count'],
        },
      },
      pop_progress: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            livelihood_track: { type: 'string', enum: ['vegetable_cultivation', 'goat_rearing', 'nano_enterprise'] },
            step_number: { type: 'number', minimum: 1, maximum: 5 },
          },
          required: ['livelihood_track', 'step_number'],
        },
      },
    },
    required: ['income_entries', 'savings_entries', 'goat_events', 'pop_progress'],
  },
} as const;
