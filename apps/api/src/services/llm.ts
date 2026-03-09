import { deepseek, DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek';
import { ModelMessage, stepCountIs, streamText, ToolSet } from 'ai';
import { tools } from '../tools/index.js';

// const toolMap = Object.fromEntries(tools.map((t: any) => [t.name, t]));

export const runChat = async (
  messages: ModelMessage[],
  modelName: string = "reasoner",
  res,
) => {
  const isReasoner = modelName === "reasoner";
  
  const result = streamText({
    model: deepseek(isReasoner ? 'deepseek-reasoner' : 'deepseek-chat'),
    messages: messages,
    ...(isReasoner ? {
      providerOptions: {
        deepseek: {
          thinking: { type: 'enabled' },
        } satisfies DeepSeekLanguageModelOptions,
      },
    } : {}),
    tools: tools,
    stopWhen: stepCountIs(100),
  });

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'reasoning-delta':
        res.write(`data: ${JSON.stringify({ type: "reasoning", content: part.text })}\n\n`);
        break;
      case 'text-delta':
        res.write(`data: ${JSON.stringify({ type: "text", content: part.text })}\n\n`);
        break;
      case 'tool-call': {
        const inputStr = typeof part.input === 'object' ? JSON.stringify(part.input) : String(part.input || '');
        res.write(`data: ${JSON.stringify({ 
          type: "tool_call", 
          id: part.toolCallId,
          name: part.toolName,
          input: inputStr
        })}\n\n`);
        break;
      }
      case 'tool-result': {
        const outputStr = typeof part.output === 'object' ? JSON.stringify(part.output) : String(part.output || '');
        res.write(`data: ${JSON.stringify({ 
          type: "tool_result", 
          toolName: part.toolName,
          output: outputStr
        })}\n\n`);
        break;
      }
      case 'tool-error': {
        const errorStr = typeof part.error === 'object' ? JSON.stringify(part.error) : String(part.error || '');
        res.write(`data: ${JSON.stringify({ 
          type: "tool_error", 
          error: errorStr
        })}\n\n`);
        break;
      }
    }
  }
}
