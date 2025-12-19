'use client';

import { Bot, User, Send, Paperclip } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: number;
    thread_id: string;
}

interface ChatProps {
    threadId?: string | null;
}

export default function Chat({ threadId }: ChatProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Thread o'zgarganda messagelarni yuklash
    useEffect(() => {
        if (threadId) {
            fetchMessages(threadId);
        } else {
            setMessages([]);
        }
    }, [threadId]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        setError(null);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/messages?threadId=${id}`);
            if (response.ok) {
                const data: Message[] = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !threadId || sending) return;

        const userMessage = input;
        setInput('');
        setSending(true);
        setError(null);

        try {
            // 1. User messageni saqlash
            const messageResponse = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    content: userMessage,
                    role: 'user'
                })
            });

            if (!messageResponse.ok) {
                // JSON parse qilishdan oldin text o'qish
                const errorText = await messageResponse.text();
                console.error('Message save error:', errorText);
                throw new Error('Failed to save message');
            }

            // 2. Chat API ga so'rov (streaming response)
            const chatResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!chatResponse.ok) {
                const errorText = await chatResponse.text();
                console.error('Chat API error:', errorText);

                // Agar JSON response bo'lsa parse qilish
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || 'Chat API error');
                } catch {
                    throw new Error(errorText || 'Chat API error');
                }
            }

            // 3. Streaming javobni o'qish
            const reader = chatResponse.body?.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';

            if (reader) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        aiResponse += chunk;

                        // Real-time update (optional)
                        console.log('Received chunk:', chunk);
                    }
                    console.log('Full AI response:', aiResponse);
                } finally {
                    reader.releaseLock();
                }
            }

            // 4. AI javobini saqlash
            const aiMessageResponse = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    content: aiResponse,
                    role: 'assistant'
                })
            });

            if (!aiMessageResponse.ok) {
                const errorText = await aiMessageResponse.text();
                console.error('AI message save error:', errorText);
            }

            // 5. Messagelarni yangilash
            await fetchMessages(threadId);

        } catch (error) {
            console.error('Error sending message:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Error ko'rsatish uchun komponent
    const ErrorAlert = () => {
        if (!error) return null;

        return (
            <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
                <div className="flex items-center justify-between">
                    <span className="font-medium">Error: {error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    };

    // Agar thread tanlanmagan bo'lsa
    if (!threadId) {
        return (
            <div className="flex-1 flex flex-col bg-[#0F0F0F]">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <h1 className="text-lg font-semibold text-gray-300">Chat AI</h1>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                            <Bot className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">How can I help you?</h2>
                        <p className="text-gray-500">
                            Select a conversation or start a new chat
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative">
                            <div className="flex items-end space-x-2">
                                <button
                                    type="button"
                                    className="h-10 w-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>

                                <div className="flex-1 relative">
                                    <div className="w-full min-h-[56px] py-3 px-4 bg-gray-900 border border-gray-800 rounded text-gray-500 flex items-center">
                                        <span>Select a chat to start messaging...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#0F0F0F]">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <h1 className="text-lg font-semibold text-gray-300">Chat AI</h1>
                </div>
            </div>

            <ErrorAlert />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                            <Bot className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">How can I help you?</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Start the conversation by sending a message below
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
                                        {message.role === 'user' ?
                                            <User className="h-4 w-4 text-gray-400" /> :
                                            <Bot className="h-4 w-4 text-gray-400" />
                                        }
                                    </div>
                                </div>

                                <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
                                        <div className="text-gray-300 whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {formatTime(message.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="bg-gray-900 rounded-2xl px-4 py-3">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="flex items-end space-x-2">
                            <button
                                type="button"
                                className="h-10 w-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>

                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Message Chat AI..."
                                    className="w-full min-h-[56px] py-3 px-4 pr-12 bg-gray-900 border border-gray-800 rounded text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-gray-700 focus:ring-0"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!sending && input.trim()) {
                                                handleSubmit(e);
                                            }
                                        }
                                    }}
                                    rows={1}
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="absolute right-2 bottom-2 h-10 w-10 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:hover:bg-gray-800/50 rounded flex items-center justify-center text-gray-400 disabled:text-gray-600 transition-colors disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 text-center mt-2">
                            {sending ? "AI is thinking..." : "Chat AI can make mistakes. Consider checking important information."}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
