import {  generateText } from "ai6";
import { z } from "zod";
import db from "./database.js";
import type { Conversation, Message } from "../types/index.js";
import { promises as fs } from "fs";
import path from "path";
import Model from "./model.js";
import { ModelMessage } from "ai6";

const PROJECTS_DIR = path.join(process.cwd(), "..", "..", "projects");

async function ensureProjectDir(sessionId: string): Promise<string> {
  const projectPath = path.join(PROJECTS_DIR, sessionId);
  await fs.mkdir(projectPath, { recursive: true });
  return projectPath;
}

function generateId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createConversation(title?: string, model?: string, mode?: string): Promise<Conversation> {
  const id = generateId();
  const now = Date.now();
  const defaultTitle = title || "New Conversation";

  await ensureProjectDir(id);

  db.prepare(`
    INSERT INTO conversations (id, title, model, mode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, defaultTitle, model || "deepseek/deepseek-chat", mode || "agent", now, now);

  return {
    id,
    title: defaultTitle,
    model: model || "deepseek/deepseek-chat",
    mode: mode || "agent",
    createdAt: now,
    updatedAt: now,
  };
}

export function getConversations(): Conversation[] {
  const rows = db.prepare(`
    SELECT id, title, model, mode, created_at as createdAt, updated_at as updatedAt
    FROM conversations
    ORDER BY updated_at DESC
  `).all() as Conversation[];
  return rows;
}

export function getConversation(id: string): Conversation | null {
  const row = db.prepare(`
    SELECT id, title, model, mode, created_at as createdAt, updated_at as updatedAt
    FROM conversations
    WHERE id = ?
  `).get(id) as Conversation | undefined;
  return row || null;
}

export function updateConversation(id: string, data: Partial<Pick<Conversation, "title" | "model" | "mode">>): void {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.model !== undefined) {
    updates.push("model = ?");
    values.push(data.model);
  }
  if (data.mode !== undefined) {
    updates.push("mode = ?");
    values.push(data.mode);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    values.push(Date.now());
    values.push(id);

    db.prepare(`UPDATE conversations SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }
}

export function deleteConversation(id: string): void {
  db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
  db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
}

export function getMessages(conversationId: string): Message[] {
  const rows = db.prepare(`
    SELECT id, conversation_id as conversationId, role, content, created_at as createdAt
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(conversationId) as Message[];
  return rows;
}

export function addMessage(conversationId: string, role: "user" | "assistant" | "system", content: string): Message {
  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, conversationId, role, content, now);

  db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`).run(now, conversationId);

  return {
    id,
    conversationId,
    role,
    content,
    createdAt: now,
  };
}

export function clearMessages(conversationId: string): void {
  db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(conversationId);
  db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`).run(Date.now(), conversationId);
}

export async function generateTitle(userMessage: string): Promise<string> {
  const { text } = await generateText({
    model: Model.create("deepseek/deepseek-chat"),
    messages: [
      {
        role: "user",
        content: `Generate a short title (max 20 characters) for this conversation based on the first message. Just return the title, nothing else.\n\nFirst message: ${userMessage}`
      }
    ],
  });

  return text.trim().slice(0, 50);
}

export function convertToUIMessages(messages: Message[]): ModelMessage[] {
  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}
