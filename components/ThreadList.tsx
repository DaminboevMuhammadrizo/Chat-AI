// components/ThreadList.tsx
'use client';

import { MessageSquare, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Thread {
  id: string;
  title: string;
  created_at: number;
}

interface ThreadListProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeThreadId?: string | null;
  onThreadSelect?: (threadId: string) => void;
}

export default function ThreadList({
  isCollapsed,
  onToggleCollapse,
  activeThreadId,
  onThreadSelect
}: ThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // Threadlarni serverdan olish
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewThread = async () => {
    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });

      if (response.ok) {
        const newThread = await response.json();
        setThreads(prev => [newThread, ...prev]);

        // Yangi threadni tanlash
        if (onThreadSelect) {
          onThreadSelect(newThread.id);
        }
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="w-12 bg-[#171717] border-r border-gray-800 flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="h-12 border-b border-gray-800 hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-400 mx-auto" />
        </button>
        <button
          onClick={handleNewThread}
          className="h-12 hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-5 w-5 text-gray-400 mx-auto" />
        </button>
        <div className="flex-1 pt-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            threads.slice(0, 8).map((thread) => (
              <button
                key={thread.id}
                onClick={() => onThreadSelect && onThreadSelect(thread.id)}
                className={`h-8 w-8 mx-2 my-1 rounded transition-colors flex items-center justify-center ${
                  activeThreadId === thread.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                }`}
                title={thread.title}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
        <span className="text-gray-300 font-medium">Chats</span>
        <button
          onClick={handleNewThread}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
        >
          <Plus className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <button
        onClick={handleNewThread}
        className="mx-4 my-3 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm font-medium flex items-center justify-center transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onThreadSelect && onThreadSelect(thread.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeThreadId === thread.id
                    ? "bg-gray-800 border border-gray-700"
                    : "hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <MessageSquare className={`h-4 w-4 mt-0.5 ${
                    activeThreadId === thread.id ? "text-gray-300" : "text-gray-500"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      activeThreadId === thread.id ? "text-white" : "text-gray-300"
                    }`}>
                      {thread.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {formatTime(thread.created_at)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
