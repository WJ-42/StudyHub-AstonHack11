import { api } from './client';

export interface FlashcardPair {
  front: string;
  back: string;
}

export async function generateFlashcards(text: string): Promise<FlashcardPair[]> {
  return api.post<FlashcardPair[]>('/api/ai/generate-flashcards', { text });
}