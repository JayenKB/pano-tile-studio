
export interface PanoTile {
  id: string;
  url: string;
  file: File;
  order: number;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  ARRANGE = 'ARRANGE',
  PREVIEW = 'PREVIEW'
}

export interface StitchResult {
  combinedUrl: string;
  width: number;
  height: number;
}

export type SliceCount = 2 | 3 | 4 | 5;
