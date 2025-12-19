'use client';

import { useState, useEffect } from 'react';
import ThreadList from "@/components/ThreadList";
import Chat from '@/components/Chat';

export default function Page() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});
    const [isInitializing, setIsInitializing] = useState(true);
    const [threadsUpdated, setThreadsUpdated] = useState(0);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const savedActiveThread = localStorage.getItem('chat-active-thread');
                const response = await fetch('/api/threads');

                if (!response.ok) throw new Error('Failed to fetch threads');

                const threads = await response.json();

                if (threads.length === 0) {
                    const createResponse = await fetch('/api/threads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'New Chat' })
                    });

                    if (createResponse.ok) {
                        const newThread = await createResponse.json();
                        setActiveThreadId(newThread.id);
                        localStorage.setItem('chat-active-thread', newThread.id);
                    }
                } else {
                    const validThread = savedActiveThread && threads.some((t: any) => t.id === savedActiveThread);
                    const threadId = validThread ? savedActiveThread : threads[0].id;
                    setActiveThreadId(threadId);
                    localStorage.setItem('chat-active-thread', threadId);
                }

            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (activeThreadId && !isInitializing) {
            localStorage.setItem('chat-active-thread', activeThreadId);
        }
    }, [activeThreadId, isInitializing]);

    const handleThreadTitleUpdate = (threadId: string, newTitle: string) => {
        setThreadTitles(prev => ({ ...prev, [threadId]: newTitle }));
    };

    const handleThreadSelect = (threadId: string | null) => {
        if (threadId) {
            setActiveThreadId(threadId);
        } else {
            setTimeout(async () => {
                try {
                    const response = await fetch('/api/threads');
                    if (response.ok) {
                        const threads = await response.json();
                        if (threads.length > 0) {
                            const nextThread = threads.find((t: any) => t.id !== activeThreadId) || threads[0];
                            setActiveThreadId(nextThread.id);
                        } else {
                            const createResponse = await fetch('/api/threads', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: 'New Chat' })
                            });

                            if (createResponse.ok) {
                                const newThread = await createResponse.json();
                                setActiveThreadId(newThread.id);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Thread tanlashda xato:', error);
                }
            }, 100);
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
                setActiveThreadId(newThread.id);
                setThreadsUpdated(prev => prev + 1);
            }
        } catch (error) {
            console.error("Yangi thread yaratishda xato:", error);
        }
    };

    if (isInitializing) {
        return (
            <div className="flex h-screen bg-[#0F0F0F] items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0F0F0F]">
            <ThreadList
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                activeThreadId={activeThreadId}
                onThreadSelect={handleThreadSelect}
                threadTitles={threadTitles}
                onNewThread={handleNewThread}
                threadsUpdated={threadsUpdated}
            />
            <Chat
                threadId={activeThreadId}
                onThreadTitleUpdate={handleThreadTitleUpdate}
            />
        </div>
    );
}
