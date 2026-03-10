import { deepseek, DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek';
import { createMinimax } from 'vercel-minimax-ai-provider';
import { ModelMessage, stepCountIs, streamText, ToolLoopAgent, ToolSet } from 'ai';
import { tools } from '../tools/index.js';
import { theStartupFoundersLastStandPrompt } from '../prompts/index.js';
import "dotenv/config";
console.log(process.env)
// const toolMap = Object.fromEntries(tools.map((t: any) => [t.name, t]));

const modelSelector = (modelName: string) => {
  const provider = modelName.split('/')[0];
  const model = modelName.split('/')[1];
  switch(provider) {
    case 'deepseek':
      return deepseek(model);
    case 'minimax':
      const minimax = createMinimax({
        apiKey: process.env.MINIMAX_API_KEY,
        baseURL: process.env.MINIMAX_API_BASE_URL,
      })
      return minimax(model);
    default:
      return deepseek('deepseek-chat');
  }
}

const createToolAgent = (modelName: string) => new ToolLoopAgent({
  model: modelSelector(modelName),
  tools: tools,
});

export const runChat = async (
  messages: ModelMessage[],
  modelName: string = "reasoner",
  res,
) => {
  const isReasoner = modelName === "reasoner";
  const agent = createToolAgent(modelName);
    const result = await agent.stream({
  // const result = streamText({
    // model: deepseek(isReasoner ? 'deepseek-reasoner' : 'deepseek-chat'),
    // prompt: theStartupFoundersLastStandPrompt,
    // model: modelSelector(modelName),
    messages: messages,
    // ...(isReasoner ? {
      // providerOptions: {
      //   deepseek: {
      //     thinking: { type: 'enabled' },
      //   } satisfies DeepSeekLanguageModelOptions,
      // },
    // } : {}),
    // tools: tools,
    // stopWhen: stepCountIs(100),

    experimental_onStart({ model, functionId }) {
      console.log('Agent started', { model: model.modelId, functionId });
    },

    experimental_onStepStart({ stepNumber, model }) {
      console.log(`Step ${stepNumber} starting`, { model: model.modelId });
    },

    experimental_onToolCallStart({ toolCall }) {
      console.log(`Tool call starting: ${toolCall.toolName}`);
    },

    experimental_onToolCallFinish({ toolCall, durationMs, success }) {
      console.log(`Tool call finished: ${toolCall.toolName} (${durationMs}ms)`, {
        success,
      });
    },

    onStepFinish({ stepNumber, usage, finishReason, toolCalls }) {
      console.log(`Step ${stepNumber} completed:`, {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        finishReason,
        toolsUsed: toolCalls?.map(tc => tc.toolName),
      });
    },

    onFinish({ totalUsage, steps }) {
      console.log('Agent finished:', {
        totalSteps: steps.length,
        totalTokens: totalUsage.totalTokens,
      });
    },
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
