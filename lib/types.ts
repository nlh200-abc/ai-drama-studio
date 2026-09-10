export type AgentStatus = 'pending' | 'working' | 'completed' | 'error' | 'skipped';

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  status: AgentStatus;
  progress: number;
  text: string;
}

export interface CharacterDNA {
  faceShape: string;
  skinTone: string;
  hairStyle: string;
  outfit: string;
  props: string;
  bodyLanguage: string;
  colorScheme: string;
  silhouette: string;
}

export interface Character {
  name: string;
  description: string;
  appearance: string;
  visualPrompt?: string;
  dna?: CharacterDNA;
  speechStyle?: string;
  paradox?: string;
}

export interface Shot {
  shotNumber: number;
  sceneDescription: string;
  action: string;
  emotion: string;
  characters: string[];
  dialogue?: string;
}

export interface Script {
  title: string;
  logline: string;
  genre: string;
  shots: Shot[];
}

export interface Cinematography {
  shotSize: string;
  cameraAngle: string;
  cameraMovement: string;
  lighting: string;
  composition: string;
}

export interface Storyboard {
  shotNumber: number;
  prompt: string;
  negativePrompt?: string;
  cinematography?: Cinematography;
  characters: string[];
  imageUrl: string;
  imageStatus?: 'pending' | 'generating' | 'completed' | 'error' | 'skipped';
  imageError?: string;
}

export interface VideoClip {
  shotNumber: number;
  videoUrl: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
}

export interface ShootingPlan {
  title: string;
  genre: string;
  style: string;
  tone: string;
  targetAudience: string;
  logline: string;
  characters: Character[];
  storyStructure: {
    act1: string;
    act2: string;
    act3: string;
    totalShots: number;
  };
  visualStyle: {
    colorPalette: string;
    lightingStyle: string;
    artStyle: string;
    referenceMovies: string[];
  };
}

export interface GenerationResult {
  plan?: ShootingPlan;
  script?: Script;
  characters?: Character[];
  storyboards?: Storyboard[];
  videos?: VideoClip[];
  createdAt: string;
  params: {
    idea: string;
    genre: string;
    style: string;
    shots: number;
    enableImages: boolean;
    enableVideos: boolean;
  };
}

export interface ChatMessage {
  name: string;
  text: string;
  type?: 'text' | 'image' | 'system';
  imageUrl?: string;
}

export interface APIConfig {
  textApiKey: string;
  textBaseUrl: string;
  textModel: string;
  imageApiKey: string;
  imageBaseUrl: string;
  imageModel: string;
  videoApiKey: string;
  videoBaseUrl: string;
  videoModel: string;
}
