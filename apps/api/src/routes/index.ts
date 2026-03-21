import { Router } from "express";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { runChat } from "../services/llm.js";
import { tools } from "../tools/index.js";
import { initTaroProjectTool, editPageCodeTool, setToolSessionId, clearToolSessionId } from "../tools/mini-program.js";
import {
  getConversation,
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  addMessage,
  clearMessages,
  generateTitle,
  convertToUIMessages,
} from "../services/conversation.js";

const router = Router();

router.get("/debug/tools", (req, res) => {
  res.json({
    tools: Object.keys(tools),
    hasInitTaro: 'initTaroProject' in tools,
    hasEditPageCode: 'editPageCode' in tools,
  });
});

router.post("/debug/test-taro", async (req, res) => {
  try {
    const testData = {
      id: "test-project",
      name: "测试项目",
      description: "测试用项目",
      pages: [
        { name: "pages/index/index", title: "首页" },
        { name: "pages/about/about", title: "关于" }
      ],
      config: {
        window: { navigationBarTitleText: "测试" }
      }
    };
    
    console.log('[Debug] Testing initTaroProject with data:', testData);
    const result = await (initTaroProjectTool as any).execute(testData);
    console.log('[Debug] Result:', JSON.stringify(result).substring(0, 500));
    res.json({ success: true, result });
  } catch (error) {
    console.error('[Debug] Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/models", (req, res) => {
  res.json({ models: [] });
});

router.get("/conversations", (req, res) => {
  const conversations = getConversations();
  res.json({ conversations });
});

router.get("/conversations/:id", (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.json({ conversation });
});

router.post("/conversations", async (req, res) => {
  const { title, model, mode } = req.body;
  const conversation = await createConversation(title, model, mode);
  res.status(201).json({ conversation });
});

router.put("/conversations/:id", (req, res) => {
  const { title, model, mode } = req.body;
  updateConversation(req.params.id, { title, model, mode });
  res.json({ success: true });
});

router.post("/conversations/:id/generate-title", async (req, res) => {
  const { model } = req.body;
  const conversationId = req.params.id;

  const conversation = getConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const messages = getMessages(conversationId);
  if (messages.length === 0) {
    return res.status(400).json({ error: "No messages in conversation" });
  }

  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) {
    return res.status(400).json({ error: "No user message found" });
  }

  try {
    const title = await generateTitle(firstUserMessage.content, model || conversation.model);
    updateConversation(conversationId, { title });
    res.json({ title });
  } catch (error) {
    console.error("Generate title error:", error);
    res.status(500).json({ error: String(error) });
  }
});

router.delete("/conversations/:id", (req, res) => {
  deleteConversation(req.params.id);
  res.json({ success: true });
});

router.get("/conversations/:id/messages", (req, res) => {
  const messages = getMessages(req.params.id);
  res.json({ conversationId: req.params.id, messages });
});

router.delete("/conversations/:id/messages", (req, res) => {
  clearMessages(req.params.id);
  res.json({ success: true });
});

router.post("/api/chat", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { 
      conversationId, 
      messages, 
      mode = "agent", 
      model: modelName = "deepseek/deepseek-chat" 
    } = req.body;

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const newConversation = await createConversation(undefined, modelName, mode);
      currentConversationId = newConversation.id;
      res.write(`data: ${JSON.stringify({ type: "conversation_created", id: newConversation.id })}\n\n`);
    }

    const conversation = getConversation(currentConversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    setToolSessionId(currentConversationId);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const historicalMessages = getMessages(currentConversationId);
    const historicalUIMessages = convertToUIMessages(historicalMessages);

    const incomingUIMessages = messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    const allMessages = [...historicalUIMessages, ...incomingUIMessages];

    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

    try {
      let lastAssistantContent = "";
      
      await runChat(
        allMessages, 
        modelName, 
        res, 
        currentConversationId, 
        mode,
        (content, isComplete) => {
          if (isComplete) {
            lastAssistantContent = content;
          }
        }
      );

      res.write("data: [DONE]\n\n");

      for (const msg of incomingUIMessages) {
        addMessage(currentConversationId, msg.role, msg.content);
      }

      if (lastAssistantContent) {
        addMessage(currentConversationId, "assistant", lastAssistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
      }
    } finally {
      clearToolSessionId();
      if (!res.destroyed) res.end();
    }
  } catch (error) {
    console.error("Request error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    } else if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
