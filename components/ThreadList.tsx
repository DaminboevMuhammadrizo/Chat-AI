'use client';

import { MessageSquare, Plus, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Thread {
    id: string;
    title: string;
    created_at: number;
}

interface ThreadListProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    activeThreadId?: string | null;
    onThreadSelect?: (threadId: string | null) => void;
    threadTitles?: Record<string, string>;
    onNewThread?: () => void;
    threadsUpdated?: number;
}

export default function ThreadList({
    isCollapsed,
    onToggleCollapse,
    activeThreadId,
    onThreadSelect,
    threadTitles = {},
    onNewThread,
    threadsUpdated = 0
}: ThreadListProps) {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetch('/api/threads')
            .then(res => res.ok && res.json())
            .then(data => data && setThreads(data))
            .catch(() => console.error("Threadlarni yuklashda xato"));
    }, [threadsUpdated]);

    useEffect(() => {
        if (Object.keys(threadTitles).length > 0) {
            setThreads(prev =>
                prev.map(thread =>
                    threadTitles[thread.id]
                        ? { ...thread, title: threadTitles[thread.id] }
                        : thread
                )
            );
        }
    }, [threadTitles]);

    const handleNewThread = async () => {
        if (onNewThread) return onNewThread();

        try {
            const response = await fetch('/api/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Chat' })
            });

            if (response.ok) {
                const newThread = await response.json();
                setThreads(prev => [newThread, ...prev]);
                onThreadSelect?.(newThread.id);
            }
        } catch {
            console.error("Thread yaratishda xato");
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        setShowDeleteConfirm(null);
        setOpenMenuId(null);

        try {
            const response = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
            if (response.ok) {
                setThreads(prev => prev.filter(thread => thread.id !== threadId));
                if (activeThreadId === threadId) onThreadSelect?.(null);
            }
        } catch {
            console.error('Threadni o\'chirishda xato');
        }
    };

    const handleStartEdit = (threadId: string, currentTitle: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(null);
        setEditingThreadId(threadId);
        setEditTitle(currentTitle);
    };

    const handleSaveEdit = async (threadId: string) => {
        if (!editTitle.trim()) return setEditingThreadId(null);

        try {
            const response = await fetch(`/api/threads/${threadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle.trim() })
            });

            if (response.ok) {
                setThreads(prev => prev.map(thread =>
                    thread.id === threadId ? { ...thread, title: editTitle.trim() } : thread
                ));
                setEditingThreadId(null);
            }
        } catch {
            console.error('Thread nomini yangilashda xato');
        }
    };

    const handleCancelEdit = () => {
        setEditingThreadId(null);
        setEditTitle('');
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 60) return `${mins} daqiqa`;
        if (hours < 24) return `${hours} soat`;
        if (days < 7) return `${days} kun`;
        return new Date(timestamp).toLocaleDateString();
    };

    const getThreadTitle = (thread: Thread) => {
        return threadTitles[thread.id] || thread.title;
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, threadId: string) => {
        if (e.key === 'Enter') handleSaveEdit(threadId);
        else if (e.key === 'Escape') handleCancelEdit();
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-[#171717] border-r border-gray-800 flex flex-col">
                <button onClick={onToggleCollapse} className="h-12 border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-auto" />
                </button>
                <button onClick={handleNewThread} className="h-12 hover:bg-gray-800 transition-colors">
                    <Plus className="h-5 w-5 text-gray-400 mx-auto" />
                </button>
                <div className="flex-1 pt-4 overflow-y-auto">
                    {threads.slice(0, 8).map((thread) => (
                        <button
                            key={thread.id}
                            onClick={() => onThreadSelect?.(thread.id)}
                            className={`h-8 w-8 mx-2 my-1 rounded transition-colors flex items-center justify-center ${activeThreadId === thread.id
                                ? "bg-gray-700 text-white"
                                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                                }`}
                            title={getThreadTitle(thread)}
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <button onClick={onToggleCollapse} className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                    <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <span className="text-gray-300 font-medium">Suhbatlar</span>
                <button onClick={handleNewThread} className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                    <Plus className="h-5 w-5 text-gray-400" />
                </button>
            </div>

            <button
                onClick={handleNewThread}
                className="mx-4 my-3 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm font-medium flex items-center justify-center transition-colors"
            >
                <Plus className="h-4 w-4 mr-2" />
                Yangi suhbat
            </button>

            <div className="flex-1 overflow-y-auto px-3">
                {threads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Hozircha suhbat yo'q</div>
                ) : (
                    threads.map((thread) => (
                        <div
                            key={thread.id}
                            className={`relative group mb-1 ${activeThreadId === thread.id
                                ? "bg-gray-800 border border-gray-700"
                                : "hover:bg-gray-800/50 border border-transparent"
                                } rounded-lg transition-colors`}
                            onClick={() => onThreadSelect?.(thread.id)}
                        >
                            <div className="w-full text-left p-3 pr-10 cursor-pointer">
                                <div className="flex items-start space-x-3">
                                    <MessageSquare className={`h-4 w-4 mt-0.5 ${activeThreadId === thread.id ? "text-gray-300" : "text-gray-500"
                                        }`} />

                                    <div className="flex-1 min-w-0">
                                        {editingThreadId === thread.id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => handleEditKeyDown(e, thread.id)}
                                                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-600"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div
                                                    className="p-1 hover:bg-gray-700 rounded cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSaveEdit(thread.id);
                                                    }}
                                                >
                                                    <Check className="h-4 w-4 text-green-400" />
                                                </div>
                                                <div
                                                    className="p-1 hover:bg-gray-700 rounded cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelEdit();
                                                    }}
                                                >
                                                    <X className="h-4 w-4 text-red-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`text-sm font-medium truncate ${activeThreadId === thread.id ? "text-white" : "text-gray-300"
                                                    }`}>
                                                    {getThreadTitle(thread)}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                    {formatTime(thread.created_at)} oldin
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {editingThreadId !== thread.id && (
                                <div className="absolute right-2 top-3">
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === thread.id ? null : thread.id);
                                        }}
                                        className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </div>

                                    {openMenuId === thread.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-8 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div
                                                onClick={(e) => handleStartEdit(thread.id, getThreadTitle(thread), e)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span>Tahrirlash</span>
                                            </div>
                                            <div
                                                onClick={() => setShowDeleteConfirm(thread.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span>O'chirish</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-2">Suhbatni o'chirish</h3>
                        <p className="text-gray-300 mb-6">
                            Bu suhbatni o'chirishni istaysizmi? Barcha xabarlar ham o'chib ketadi.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={() => handleDeleteThread(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-3 border-t border-gray-800">
                <div className="text-xs text-gray-500 text-center">{threads.length} suhbat</div>
            </div>
        </div>
    );
}
