import { db } from "./client";

export interface Thread {
    id: string;
    title: string;
    created_at: number;
}

export interface Message {
    id: string;
    thread_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: number;
}

export type Role = 'user' | 'assistant';

export const Role = {
  User: 'user' as Role,
  Assistant: 'assistant' as Role,
} as const;

export const Threads = {
    create: (title: string): Thread => {
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        db.prepare(`INSERT INTO threads (id, title, created_at) VALUES (?, ?, ?)`).run(id, title, createdAt);
        return { id, title, created_at: createdAt };
    },

    getAll: (): Thread[] => {
        return db.prepare("SELECT * FROM threads ORDER BY created_at DESC").all() as Thread[];
    },

    updateTitle: (id: string, title: string): boolean => {
        try {
            const threadExists = db.prepare("SELECT id FROM threads WHERE id = ?").get(id);
            if (!threadExists) return false;
            const result = db.prepare("UPDATE threads SET title = ? WHERE id = ?").run(title.trim(), id);
            return result.changes > 0;
        } catch {
            return false;
        }
    },

    delete: (id: string): boolean => {
        try {
            const result = db.prepare("DELETE FROM threads WHERE id = ?").run(id);
            return result.changes > 0;
        } catch {
            return false;
        }
    }
};

export const Messages = {
    create: (threadId: string, role: 'user' | 'assistant', content: string): Message => {
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        db.prepare(`INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`)
          .run(id, threadId, role, content, createdAt);
        return { id, thread_id: threadId, role, content, created_at: createdAt };
    },

    getByThread: (threadId: string): Message[] => {
        return db.prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC").all(threadId) as Message[];
    },

    deleteByThread: (threadId: string): boolean => {
        try {
            const result = db.prepare("DELETE FROM messages WHERE thread_id = ?").run(threadId);
            return result.changes > 0;
        } catch {
            return false;
        }
    }
};
