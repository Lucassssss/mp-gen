import { Router } from "express";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { runChat } from "../services/llm.js";
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
  const conversation = createConversation(title, model, mode);
  res.status(201).json({ conversation });
});

router.put("/conversations/:id", (req, res) => {
  const { title, model, mode } = req.body;
  updateConversation(req.params.id, { title, model, mode });
  res.json({ success: true });
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
      const newConversation = createConversation(undefined, modelName, mode);
      currentConversationId = newConversation.id;
      res.write(`data: ${JSON.stringify({ type: "conversation_created", id: newConversation.id })}\n\n`);
    }

    const conversation = getConversation(currentConversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

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

      const currentMessages = getMessages(currentConversationId);
      if (currentMessages.length === 2) {
        const title = await generateTitle(lastUserMessage);
        updateConversation(currentConversationId, { title });
        res.write(`data: ${JSON.stringify({ type: "title_generated", title })}\n\n`);
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
      }
    } finally {
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
