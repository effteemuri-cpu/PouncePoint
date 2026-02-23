export type PreyType = 'laser' | 'mouse' | 'bird' | 'bug';

export interface GameState {
  score: number;
  preyType: PreyType;
  speed: number;
  theme: 'garden' | 'night' | 'minimal';
  isMuted: boolean;
}

export interface Prey {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}
