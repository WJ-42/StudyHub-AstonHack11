import { api } from './client';

export interface FlashcardPair {
  front: string;
  back: string;
}

export async function generateFlashcards(text: string): Promise<FlashcardPair[]> {
  return api.post<FlashcardPair[]>('/api/ai/generate-flashcards', { text });
}

export async function extractFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await api.postFile<{ text: string }>('/api/extract/file', formData);
  return result.text;
}

export async function extractFromUrl(url: string): Promise<string> {
  const result = await api.post<{ text: string }>('/api/extract/url', { url });
  return result.text;
}
