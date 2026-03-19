import fs from 'fs'
import path from 'path';

const promptsDir = path.dirname(path.join(__filename));

const codePrompt = fs.readFileSync(path.join(promptsDir, 'code.md'), 'utf-8')
const designPrompt = fs.readFileSync(path.join(promptsDir, 'design.md'), 'utf-8')

export const prompts = `
## Code Guidelines
${codePrompt}

## Design Guidelines
${designPrompt}
`