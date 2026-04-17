export type Language = 'java' | 'python' | 'r';

export interface Problem {
  id: string;
  title: string;
  description: string;
  testCases: number;
  starterCode: { [key in Language]: string };
}

export const THEMES = [
  { id: 'professional-polish', name: 'Professional Polish' },
  { id: 'cat-noir', name: 'Cat Noir' },
  { id: 'blood-red', name: 'Blood Red' },
  { id: 'cyberpunk-glow', name: 'Cyberpunk Glow' },
  { id: 'spiderman', name: 'Spiderman' },
  { id: 'dark-emerald', name: 'Dark Emerald' }
];