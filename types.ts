
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
}

export interface FileInput {
  name: string;
  content: string;
}
