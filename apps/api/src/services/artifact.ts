import { artifact } from '@ai-sdk-tools/artifacts';
import { z } from 'zod';

export const CodeArtifact = artifact('code', z.object({
  id: z.string(),
  title: z.string(),
  language: z.string(),
  code: z.string(),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export const DocumentArtifact = artifact('document', z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  format: z.enum(['markdown', 'html', 'text']),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export const DataArtifact = artifact('data', z.object({
  id: z.string(),
  title: z.string(),
  data: z.any(),
  schema: z.record(z.string(), z.string()).optional(),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export const DashboardArtifact = artifact('dashboard', z.object({
  title: z.string(),
  metrics: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export const ChartArtifact = artifact('chart', z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['line', 'bar', 'pie', 'scatter', 'area']),
  data: z.array(z.record(z.string(), z.any())),
  options: z.record(z.string(), z.any()).optional(),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export const TableArtifact = artifact('table', z.object({
  id: z.string(),
  title: z.string(),
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean'])
  })),
  rows: z.array(z.record(z.string(), z.any())),
  status: z.enum(['loading', 'streaming', 'complete', 'error']),
  progress: z.number().min(0).max(1).default(0)
}));

export type ArtifactSchema = 
  | typeof CodeArtifact 
  | typeof DocumentArtifact 
  | typeof DataArtifact 
  | typeof DashboardArtifact 
  | typeof ChartArtifact 
  | typeof TableArtifact;

export interface ArtifactUpdate {
  type: 'artifact_start' | 'artifact_update' | 'artifact_complete' | 'artifact_error';
  name: string;
  data?: any;
  error?: string;
}

export function createArtifactStream(name: string) {
  return {
    start: (initialData: any) => ({
      type: 'artifact_start' as const,
      name,
      data: { ...initialData, status: 'loading', progress: 0 }
    }),
    update: (data: any, progress: number = 0.5) => ({
      type: 'artifact_update' as const,
      name,
      data: { ...data, status: 'streaming', progress }
    }),
    complete: (data: any) => ({
      type: 'artifact_complete' as const,
      name,
      data: { ...data, status: 'complete', progress: 1 }
    }),
    error: (error: string) => ({
      type: 'artifact_error' as const,
      name,
      error
    })
  };
}
