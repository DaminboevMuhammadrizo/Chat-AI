// components/ThreadList.tsx
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Plus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Thread {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
  preview?: string;
}

interface ThreadListProps {
  activeThreadId: string | null;
  onThreadSelect: (threadId: string | null) => void;
  onNewThread?: () => void;
  onDeleteThread?: (threadId: string) => void;
  className?: string;
}

const ThreadList: React.FC<ThreadListProps> = ({
  activeThreadId,
  onThreadSelect,
  onNewThread,
  onDeleteThread,
  className
}) => {
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: '1',
      title: 'Sales Data Analysis Q1',
      created_at: '2 hours ago',
      message_count: 12,
      preview: 'Can you analyze the sales trends from...'
    },
    {
      id: '2',
      title: 'Excel Formula Issue',
      created_at: 'Yesterday',
      message_count: 8,
      preview: 'The VLOOKUP formula is not working...'
    },
    {
      id: '3',
      title: 'Financial Report Discussion',
      created_at: 'Jan 13',
      message_count: 15,
      preview: 'Here are the quarterly financials...'
    },
    {
      id: '4',
      title: 'Marketing Campaign Review',
      created_at: 'Jan 12',
      message_count: 6,
      preview: 'The campaign performance metrics show...'
    },
    {
      id: '5',
      title: 'Budget Planning Meeting',
      created_at: 'Jan 11',
      message_count: 20,
      preview: 'We need to allocate resources for...'
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewThread = () => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: `New Conversation ${threads.length + 1}`,
      created_at: 'Just now',
      message_count: 0,
      preview: 'Start a new conversation...'
    };
    setThreads([newThread, ...threads]);
    onThreadSelect(newThread.id);

    if (onNewThread) {
      onNewThread();
    }
  };

  const handleThreadSelect = (threadId: string) => {
    onThreadSelect(threadId);
  };

  const handleDeleteThread = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (onDeleteThread) {
      onDeleteThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));

      // If we're deleting the active thread, clear it
      if (activeThreadId === threadId) {
        onThreadSelect(null);
      }
    } else {
      setThreads(prev => prev.filter(t => t.id !== threadId));

      // If we're deleting the active thread, clear it
      if (activeThreadId === threadId) {
        onThreadSelect(null);
      }
    }
  };

  return (
    <div className={cn("flex flex-col h-full border-r bg-white w-64", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewThread}
            className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Threads List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all mb-1 border hover:border-blue-100",
                  activeThreadId === thread.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "border-transparent hover:bg-gray-50"
                )}
                onClick={() => handleThreadSelect(thread.id)}
              >
                <div className="flex items-start justify-between">
                  {/* Thread Icon and Title */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={cn(
                      "mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      activeThreadId === thread.id
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      <MessageSquare className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "font-medium truncate",
                          activeThreadId === thread.id
                            ? "text-blue-900"
                            : "text-gray-900"
                        )}>
                          {thread.title}
                        </h3>
                      </div>

                      {/* Preview */}
                      {thread.preview && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {thread.preview}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="flex items-center text-xs text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {thread.created_at}
                        </span>
                        <span className="text-xs text-gray-400">
                          {thread.message_count} messages
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeleteThread(e, thread.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-gray-400",
                      activeThreadId === thread.id && "text-blue-500"
                    )} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t text-xs text-gray-500 bg-gray-50">
        <div className="flex justify-between">
          <span>Total: {threads.length} chats</span>
          <span>{threads.reduce((acc, t) => acc + t.message_count, 0)} messages</span>
        </div>
      </div>
    </div>
  );
};

export default ThreadList;
