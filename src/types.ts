/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudyTheme = 'midnight' | 'vaporwave' | 'minimal-light' | 'cyberpunk' | 'forest' | 'coffee' | 'custom' | 'modern-slate';

export interface KeyConcept {
  concept: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface BulletPoint {
  title: string;
  details: string;
}

export interface SynthesizedBrain {
  title: string;
  originalWordCount: number;
  synthesizedWordCount: number;
  overview: string;
  concepts: KeyConcept[];
  summaryPoints: BulletPoint[];
  flashcards: Flashcard[];
  actionSteps: string[];
}

export interface SynthesizeRequest {
  notes: string;
  focusMode?: string;
  length?: 'concise' | 'detailed';
}

export interface SavedBrainItem {
  id: string;
  timestamp: string;
  notesExcerpt: string;
  themeUsed: StudyTheme;
  synthesis: SynthesizedBrain;
}
