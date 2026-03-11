import { tool } from 'ai';
import { z } from 'zod';
import { createBashTool } from "bash-tool";
import path from 'node:path';

const bashInstances = new Map();
const PROJECT_ROOT = path.resolve(import.meta.dir, '../../../../');

const { tools } = await createBashTool({
  // files: {
  //   "src/index.ts": "export const hello = 'world';",
  //   "package.json": '{"name": "my-project"}',
  // },
  uploadDirectory: {
    source: PROJECT_ROOT,
    include: "**/*.{ts,json,js,jsx,tsx}",
  },
});

export const { bash } = tools;
export const { readFile } = tools;
export const { writeFile } = tools;
