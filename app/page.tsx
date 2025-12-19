'use client';

import { useState } from 'react';
import ThreadList from "@/components/ThreadList";
import Chat from '@/components/Chat';

export default function Page() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <ThreadList
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeThreadId={activeThreadId}
        onThreadSelect={setActiveThreadId}
      />
      <Chat threadId={activeThreadId} />
    </div>
  );
}
