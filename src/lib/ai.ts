import { generate } from '@/lib/bonsai';

export type AiAction =
  | 'continue'
  | 'summarize'
  | 'expand'
  | 'rewrite'
  | 'fix-spelling'
  | 'change-tone';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const AI_ACTIONS: { id: AiAction; label: string }[] = [
  { id: 'continue', label: 'Continue writing' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'expand', label: 'Expand' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'fix-spelling', label: 'Fix spelling & grammar' },
  { id: 'change-tone', label: 'Change tone' }
];

const ACTION_PROMPTS: Record<
  AiAction,
  { system: string; instruction: string }
> = {
  continue: {
    system:
      "You are a writing assistant. Continue the user's text naturally, maintaining the same style, voice, and topic. Write only the continuation, do not repeat or summarize the existing text.",
    instruction: 'Continue the following text:'
  },
  summarize: {
    system:
      'You are a summarization assistant. Provide a concise summary of the key points. Be brief and to the point.',
    instruction: 'Summarize the following text:'
  },
  expand: {
    system:
      "You are a writing assistant. Expand the user's text with more detail, examples, and clarity while preserving the original meaning.",
    instruction: 'Expand the following text with more detail and examples:'
  },
  rewrite: {
    system:
      'You are an editing assistant. Rewrite the text with improved clarity, flow, and readability while preserving the original meaning.',
    instruction: 'Rewrite the following text with improved clarity and flow:'
  },
  'fix-spelling': {
    system:
      'You are a proofreading assistant. Correct only spelling, grammar, and punctuation errors. Do not change the wording or style unless it is grammatically incorrect.',
    instruction:
      'Correct any spelling, grammar, and punctuation errors in the following text:'
  },
  'change-tone': {
    system:
      'You are a writing assistant. Rewrite the text with a more professional, polished tone while preserving the original meaning.',
    instruction:
      'Rewrite the following with a more professional, polished tone:'
  }
};

export async function queryBonsai(
  text: string,
  action: AiAction
): Promise<string> {
  const { system, instruction } = ACTION_PROMPTS[action];
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: `${instruction}\n\n${text}` }
  ];
  return generate(messages);
}
