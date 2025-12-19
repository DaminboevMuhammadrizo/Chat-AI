import { db } from "@/db/client";
import type { Role } from "@/db/roles";

export interface Thread {
  id: string;
  title: string;
  created_at: number;
}

export interface Message {
  id: string;
  thread_id: string;  // Bu yerda thread_id
  role: Role;
  content: string;
  created_at: number;
}

export const Threads = {
  create: (title: string): Thread => {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO threads (id, title, created_at)
       VALUES (?, ?, ?)`
    ).run(id, title, Date.now());
    return { id, title, created_at: Date.now() };
  },

  getAll: (): Thread[] => {
    const threads = db.prepare("SELECT * FROM threads ORDER BY created_at DESC").all() as Thread[];
    return threads;
  },

  delete: (id: string) => {
    db.prepare("DELETE FROM threads WHERE id = ?").run(id);
  }
};

export const Messages = {
  create: (threadId: string, role: Role, content: string): Message => {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO messages (id, thread_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, threadId, role, content, Date.now());
    return {
      id,
      thread_id: threadId, // Bu yerda threadId'ni thread_id ga o'zgartirish kerak
      role,
      content,
      created_at: Date.now()
    };
  },

  getByThread: (threadId: string): Message[] => {
    const messages = db
      .prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC")
      .all(threadId) as Message[];
    return messages;
  },
};
