// app/page.tsx - 简化版
'use client';

import { useState } from 'react';
import ThreadList from "@/components/ThreadList";
import Chat from '@/components/Chat';

export default function Page() {
  const [threadId, setThreadId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <ThreadList
        activeThreadId={threadId}
        onThreadSelect={setThreadId}
      />
      <Chat
        threadId={threadId}
      />
    </div>
  );
}
