import { db } from "./client";
import { Role } from "./roles";

export const Threads = {
  create: (title: string) => {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO threads (id, title, created_at)
       VALUES (?, ?, ?)`
    ).run(id, title, Date.now());
    return { id, title };
  },

  getAll: () => {
    return db.prepare("SELECT * FROM threads ORDER BY created_at DESC").all();
  },

  delete: (id: string) => {
    db.prepare("DELETE FROM threads WHERE id = ?").run(id);
  }
};

export const Messages = {
  create: (threadId: string, role: Role, content: string) => {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO messages (id, thread_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, threadId, role, content, Date.now());
    return { id, threadId, role, content };
  },

  getByThread: (threadId: string) => {
    return db
      .prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC")
      .all(threadId);
  },
};
