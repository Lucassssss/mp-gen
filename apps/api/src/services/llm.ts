import { deepseek, DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek';
import { createMinimax } from 'vercel-minimax-ai-provider';
import { ModelMessage, stepCountIs, streamText, ToolLoopAgent, ToolSet } from 'ai6';
import { tools } from '../tools/index.js';
import { prompts } from '../prompts/index.js';
import { setToolSessionId, clearToolSessionId } from '../tools/mini-program.js';
import "dotenv/config";
import Model from './model.js';
import Agent from './agent.js';
// import { streamDeepAgentUpdates } from './deep-agent.js';

export interface ArtifactEvent {
  type: 'artifact';
  name: string;
  data: any;
  status: 'loading' | 'streaming' | 'complete' | 'error';
  progress?: number;
}

export interface RunChatOptions {
  onArtifact?: (event: ArtifactEvent) => void;
}

export const runChat = async (
  messages: ModelMessage[],
  modelName: string = "reasoner",
  res,
  sessionId: string,
  mode: string = "auto",
  onAssistantMessage?: (content: string, isComplete: boolean) => void,
  options?: RunChatOptions,
) => {
  const { onArtifact } = options || {};
  let result: any = null;
  let assistantContent = "";
  
  const systemPromptWithSession = `${prompts}

## 当前会话信息
当前会话ID: ${sessionId}
`;
  
  messages = [{
    role: "system",
    content: systemPromptWithSession,
  }, ...messages];

  if(mode === "auto") {
    const agent = Agent.get(modelName);
    result = await agent.stream({
      messages: messages,
    });
  } else if(mode === "agent") {
    result = await streamText({
      system: systemPromptWithSession,
      model: Model.create(modelName),
      messages: messages,
      tools: tools,
      stopWhen: stepCountIs(100),
    });
  }

  try {
    let toolErrorCount = 0;
    const MAX_TOOL_ERRORS = 10;

    for await (const part of result.fullStream) {
      try {
        switch (part.type) {
          case 'reasoning-delta':
            res.write(`data: ${JSON.stringify({ type: "reasoning", content: part.text })}\n\n`);
            break;
          case 'text-delta':
            assistantContent += part.text;
            onAssistantMessage?.(assistantContent, false);
            res.write(`data: ${JSON.stringify({ type: "text", content: part.text })}\n\n`);
            break;
          case 'tool-call': {
            const inputStr = typeof part.input === 'object' ? JSON.stringify(part.input) : String(part.input || '');
            if (part.toolName === 'initTaroProject' || part.toolName === 'editPageCode') {
              setToolSessionId(sessionId);
            }
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

            if (part.toolName && (
              part.toolName === 'createCodeArtifact' ||
              part.toolName === 'createDocumentArtifact' ||
              part.toolName === 'createDataArtifact' ||
              part.toolName === 'createTableArtifact' ||
              part.toolName === 'createMiniProgramArtifact' ||
              part.toolName === 'initTaroProject' ||
              part.toolName === 'editPageCode'
            )) {
              try {
                const outputData = typeof part.output === 'object' ? part.output : JSON.parse(String(part.output));
                if (outputData && outputData.type === 'artifact') {
                  const additionalFields: Record<string, unknown> = {};

                  if (outputData.files) {
                    additionalFields.files = outputData.files;
                  }
                  if (outputData.projectName) {
                    additionalFields.projectName = outputData.projectName;
                  }
                  if (outputData.metadata) {
                    additionalFields.metadata = outputData.metadata;
                  }

                  res.write(`data: ${JSON.stringify({
                    type: "artifact",
                    artifactType: outputData.artifactType,
                    id: outputData.id,
                    title: outputData.title,
                    content: outputData.code || outputData.content || JSON.stringify(outputData.data || outputData.rows || ''),
                    language: outputData.language,
                    format: outputData.format,
                    data: outputData.data,
                    columns: outputData.columns,
                    rows: outputData.rows,
                    status: outputData.status || 'complete',
                    progress: outputData.progress || 1,
                    ...additionalFields
                  })}\n\n`);
                  break;
                }
              } catch (e) {
                console.error('Error parsing artifact output:', e);
              }
            }

            res.write(`data: ${JSON.stringify({
              type: "tool_result",
              toolName: part.toolName,
              output: outputStr
            })}\n\n`);
            break;
          }
          case 'tool-error': {
            toolErrorCount++;
            if (toolErrorCount >= MAX_TOOL_ERRORS) {
              res.write(`data: ${JSON.stringify({
                type: "error",
                error: `工具调用错误次数过多 (${toolErrorCount}次)，已停止执行。可能存在模型生成格式问题，建议刷新对话重试。`
              })}\n\n`);
              break;
            }
            const errorStr = typeof part.error === 'object' ? JSON.stringify(part.error) : String(part.error || '');
            res.write(`data: ${JSON.stringify({
              type: "tool_error",
              error: errorStr,
              toolName: part.toolName
            })}\n\n`);
            break;
          }
          case 'error':
          case 'finish':
            break;
        }
      } catch (writeError: any) {
        console.error('Error writing to stream:', writeError);
        try {
          res.write(`data: ${JSON.stringify({
            type: "stream_error",
            error: `流式输出错误: ${writeError.message}`
          })}\n\n`);
        } catch {}
      }
    }

    onAssistantMessage?.(assistantContent, true);
  } catch (error: any) {
    console.error('runChat error:', error);

    let errorMessage = error.message || String(error);
    let errorType = "error";

    if (error.statusCode === 402 || error.message?.includes('Insufficient Balance')) {
      errorMessage = "AI 模型余额不足，请检查账户余额后重试。";
      errorType = "balance_error";
    } else if (error.message?.includes('invalid params') || error.message?.includes('tool_use.input')) {
      errorMessage = "AI 模型生成参数格式错误，正在自动重试...";
      errorType = "retry";
    } else if (error.statusCode === 400 || error.message?.includes('invalid_request_error')) {
      errorMessage = "AI 模型请求参数错误，请稍后重试。";
      errorType = "invalid_request";
    } else if (error.statusCode === 429) {
      errorMessage = "AI 模型请求过于频繁，请稍后重试。";
      errorType = "rate_limit";
    }

    try {
      res.write(`data: ${JSON.stringify({
        type: errorType,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })}\n\n`);
    } catch {}
  }
}
