export type Role = 'user' | 'assistant';

export const Role = {
  User: 'user' as Role,
  Assistant: 'assistant' as Role,
} as const;
