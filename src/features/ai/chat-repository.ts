import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

interface ChatRow {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

function rowToMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role as ChatRole,
    content: row.content,
    createdAt: row.created_at,
  };
}

export const chatRepository = {
  getMessages(userId: string, limit = 50): ChatMessage[] {
    const rows = expoDb.getAllSync<ChatRow>(
      `SELECT * FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit],
    );
    // Return in chronological order (oldest first for display)
    return rows.map(rowToMessage).reverse();
  },

  getRecentForContext(userId: string, limit = 20): ChatMessage[] {
    const rows = expoDb.getAllSync<ChatRow>(
      `SELECT * FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit],
    );
    // Return in chronological order for Claude context window
    return rows.map(rowToMessage).reverse();
  },

  insertMessage(msg: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
    const id = generateId();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, msg.userId, msg.role, msg.content, now],
    );
    return { ...msg, id, createdAt: now };
  },

  clearHistory(userId: string): void {
    expoDb.runSync(`DELETE FROM chat_messages WHERE user_id = ?`, [userId]);
  },
};
