'use client';

import { Bot, User, Send, Paperclip } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: number;
    thread_id: string;
}

interface ChatProps {
    threadId?: string | null;
    onThreadTitleUpdate?: (threadId: string, newTitle: string) => void;
}

export default function Chat({ threadId, onThreadTitleUpdate }: ChatProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasFirstMessage, setHasFirstMessage] = useState<Record<string, boolean>>({});
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (threadId) {
            fetchMessages(threadId);
        } else {
            setMessages([]);
        }
    }, [threadId]);

    useEffect(() => {
        if (isAutoScrolling && messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            requestAnimationFrame(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }, [messages, streamingText, isAutoScrolling]);

    useEffect(() => {
        if (messages.length > 0)
            scrollToBottom();

    }, [messages.length]);

    useEffect(() => {
        if (!sending && !streamingText && threadId) {
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = textareaRef.current.value.length;
                    textareaRef.current.selectionEnd = textareaRef.current.value.length;
                }
            }, 50);
        }
    }, [sending, streamingText, threadId]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/messages?threadId=${id}`);
            if (response.ok) {
                const data: Message[] = await response.json();
                setMessages(data);
                if (data.length > 0) setHasFirstMessage(prev => ({ ...prev, [id]: true }));
            }
        } catch {
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const extractThreadTitle = (aiResponse: string, userMessage: string): string => {
        const lines = aiResponse.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && trimmed.length < 100 &&
                !['#', '```', '|', '>', '- '].some(prefix => trimmed.startsWith(prefix)) &&
                !/^\d+\.\s+/.test(trimmed);
        });

        let title = lines[0]?.trim() || userMessage.trim();
        return title.length > 40 ? title.substring(0, 37) + '...' : title;
    };

    const updateThreadTitle = async (threadId: string, aiResponse: string, userMessage: string) => {
        try {
            const newTitle = extractThreadTitle(aiResponse, userMessage);
            await fetch(`/api/threads/${threadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            onThreadTitleUpdate?.(threadId, newTitle);
        } catch (error) {
            console.error("Thread nomini yangilashda xato:", error);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !threadId || sending) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);
        setError(null);
        setIsAutoScrolling(true);

        try {
            const userMessageResponse = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, content: userMessage, role: 'user' })
            });

            if (!userMessageResponse.ok) throw new Error('Failed to save user message');
            const savedUserMessage = await userMessageResponse.json();
            setMessages(prev => [...prev, savedUserMessage.message]);

            setStreamingText('');
            const chatResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!chatResponse.ok) throw new Error('AI service error');

            const reader = chatResponse.body?.getReader();
            const decoder = new TextDecoder();
            let aiFullResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    aiFullResponse += decoder.decode(value, { stream: true });
                    setStreamingText(aiFullResponse);
                }
                reader.releaseLock();
            }

            if (aiFullResponse.trim()) {
                const aiMessageResponse = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ threadId, content: aiFullResponse, role: 'assistant' })
                });

                if (aiMessageResponse.ok) {
                    const savedAiMessage = await aiMessageResponse.json();
                    setMessages(prev => [...prev, savedAiMessage.message]);

                    if (!hasFirstMessage[threadId]) {
                        await updateThreadTitle(threadId, aiFullResponse, userMessage);
                        setHasFirstMessage(prev => ({ ...prev, [threadId]: true }));
                    }
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setSending(false);
            setStreamingText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setIsAutoScrolling(isAtBottom);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayMessages = [...messages];
    if (streamingText) {
        displayMessages.push({
            id: 'streaming-' + Date.now(),
            role: 'assistant',
            content: streamingText,
            created_at: Date.now(),
            thread_id: threadId || ''
        });
    }

    if (!threadId) {
        return (
            <div className="flex-1 flex flex-col bg-[#0F0F0F] items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Loading chat...</h2>
                    <p className="text-gray-500">Please wait while we prepare your chat</p>
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

            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Error: {error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
                    </div>
                </div>
            )}

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : displayMessages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                            <Bot className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">How can I help you?</h2>
                        <p className="text-gray-500 max-w-md mx-auto">Start the conversation by typing below</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8">
                        {displayMessages.map((message) => (
                            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
                                        {message.role === 'user' ? <User className="h-4 w-4 text-gray-400" /> : <Bot className="h-4 w-4 text-gray-400" />}
                                    </div>
                                </div>

                                <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
                                        <div className="text-gray-300 whitespace-pre-wrap">
                                            {message.role === 'assistant' ? (
                                                <div className="prose prose-invert max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            code(props) {
                                                                const { children, className, node, ...rest } = props;
                                                                const match = /language-(\w+)/.exec(className || '');

                                                                if (match) {
                                                                    return (
                                                                        <div className="my-4 rounded-lg overflow-hidden border border-gray-700">
                                                                            <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 font-mono">
                                                                                {match[1]}
                                                                            </div>
                                                                            <SyntaxHighlighter
                                                                                style={vscDarkPlus}
                                                                                language={match[1]}
                                                                                PreTag="div"
                                                                                className="!m-0 !bg-gray-950"
                                                                            >
                                                                                {String(children).replace(/\n$/, '')}
                                                                            </SyntaxHighlighter>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-300" {...rest}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            a(props) {
                                                                const { href, children, ...rest } = props;
                                                                return (
                                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1" {...rest}>
                                                                        🔗 {children}
                                                                    </a>
                                                                );
                                                            },
                                                            ul(props) {
                                                                const { children, ...rest } = props;
                                                                return <ul className="list-disc list-inside my-4 space-y-2 pl-4" {...rest}>{children}</ul>;
                                                            },
                                                            ol(props) {
                                                                const { children, ...rest } = props;
                                                                return <ol className="list-decimal list-inside my-4 space-y-2 pl-4" {...rest}>{children}</ol>;
                                                            },
                                                            strong(props) {
                                                                const { children, ...rest } = props;
                                                                return <strong className="font-bold text-white" {...rest}>{children}</strong>;
                                                            },
                                                            em(props) {
                                                                const { children, ...rest } = props;
                                                                return <em className="italic" {...rest}>{children}</em>;
                                                            },
                                                            blockquote(props) {
                                                                const { children, ...rest } = props;
                                                                return (
                                                                    <blockquote className="border-l-4 border-gray-600 pl-4 my-4 italic text-gray-400 bg-gray-900/50 py-2 px-4 rounded-r" {...rest}>
                                                                        {children}
                                                                    </blockquote>
                                                                );
                                                            },
                                                            table(props) {
                                                                const { children, ...rest } = props;
                                                                return (
                                                                    <div className="overflow-x-auto my-4 border border-gray-700 rounded">
                                                                        <table className="min-w-full divide-y divide-gray-700" {...rest}>{children}</table>
                                                                    </div>
                                                                );
                                                            },
                                                            th(props) {
                                                                const { children, ...rest } = props;
                                                                return <th className="px-4 py-3 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...rest}>{children}</th>;
                                                            },
                                                            td(props) {
                                                                const { children, ...rest } = props;
                                                                return <td className="px-4 py-3 text-sm text-gray-300 border-t border-gray-700" {...rest}>{children}</td>;
                                                            },
                                                            h1(props) {
                                                                const { children, ...rest } = props;
                                                                return <h1 className="text-2xl font-bold my-4 text-white" {...rest}>{children}</h1>;
                                                            },
                                                            h2(props) {
                                                                const { children, ...rest } = props;
                                                                return <h2 className="text-xl font-bold my-3 text-white" {...rest}>{children}</h2>;
                                                            },
                                                            h3(props) {
                                                                const { children, ...rest } = props;
                                                                return <h3 className="text-lg font-bold my-2 text-white" {...rest}>{children}</h3>;
                                                            }
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{message.content}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">{formatTime(message.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#0F0F0F]">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="flex items-end space-x-2">
                            <button type="button" className="h-10 w-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded flex items-center justify-center transition-colors" disabled={sending}>
                                <Paperclip className="h-5 w-5" />
                            </button>

                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={handleTextareaChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message Chat AI..."
                                    className="w-full min-h-[56px] max-h-[150px] py-3 px-4 pr-12 bg-gray-900 border border-gray-800 rounded text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:border-gray-700 focus:ring-0 overflow-y-auto"
                                    rows={1}
                                    disabled={sending}
                                    autoFocus
                                />
                                <button type="submit" disabled={!input.trim() || sending} className="absolute right-2 bottom-2 h-10 w-10 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:hover:bg-gray-800/50 rounded flex items-center justify-center text-gray-400 disabled:text-gray-600 transition-colors disabled:cursor-not-allowed">
                                    {sending ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 text-center mt-2">
                            {sending ? "AI is thinking..." : "Shift+Enter for new line. Enter to send."}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
