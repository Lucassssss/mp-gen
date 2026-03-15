import { tool } from 'ai';
import { z } from 'zod';

export const createCodeArtifactTool = tool({
  description: 'Create a code artifact with syntax highlighting',
  inputSchema: z.object({
    id: z.string().describe('Unique identifier for the artifact'),
    title: z.string().describe('Title of the code artifact'),
    language: z.string().describe('Programming language for syntax highlighting'),
    code: z.string().describe('The code content'),
  }),
  execute: async ({ id, title, language, code }) => {
    return {
      type: 'artifact',
      artifactType: 'code',
      id,
      title,
      language,
      code,
      status: 'complete',
      progress: 1
    };
  },
});

export const createDocumentArtifactTool = tool({
  description: 'Create a document artifact',
  inputSchema: z.object({
    id: z.string().describe('Unique identifier for the artifact'),
    title: z.string().describe('Title of the document'),
    content: z.string().describe('Document content'),
    format: z.enum(['markdown', 'html', 'text']).describe('Document format'),
  }),
  execute: async ({ id, title, content, format }) => {
    return {
      type: 'artifact',
      artifactType: 'document',
      id,
      title,
      content,
      format,
      status: 'complete',
      progress: 1
    };
  },
});

export const createDataArtifactTool = tool({
  description: 'Create a data artifact',
  inputSchema: z.object({
    id: z.string().describe('Unique identifier for the artifact'),
    title: z.string().describe('Title of the data'),
    data: z.any().describe('The data content'),
    schema: z.record(z.string(), z.string()).optional().describe('Data schema'),
  }),
  execute: async ({ id, title, data, schema }) => {
    return {
      type: 'artifact',
      artifactType: 'data',
      id,
      title,
      data,
      schema,
      status: 'complete',
      progress: 1
    };
  },
});

export const createTableArtifactTool = tool({
  description: 'Create a table artifact',
  inputSchema: z.object({
    id: z.string().describe('Unique identifier for the artifact'),
    title: z.string().describe('Title of the table'),
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['string', 'number', 'date', 'boolean'])
    })).describe('Table columns'),
    rows: z.array(z.record(z.string(), z.any())).describe('Table rows'),
  }),
  execute: async ({ id, title, columns, rows }) => {
    return {
      type: 'artifact',
      artifactType: 'table',
      id,
      title,
      columns,
      rows,
      status: 'complete',
      progress: 1
    };
  },
});

export const artifactTools = {
  createCodeArtifact: createCodeArtifactTool,
  createDocumentArtifact: createDocumentArtifactTool,
  createDataArtifact: createDataArtifactTool,
  createTableArtifact: createTableArtifactTool,
};
