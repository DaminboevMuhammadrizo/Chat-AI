// components/Chat.tsx - 修改接口以接受null
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  Loader2,
  Paperclip,
  Mic,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatProps {
  threadId: string | null;  // 明确接受null
  className?: string;
  onThreadTitleUpdate?: (title: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const Chat: React.FC<ChatProps> = ({
  threadId,
  className,
  onThreadTitleUpdate
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you today? I can analyze spreadsheets, help with Excel formulas, or answer any questions you might have.',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you help me analyze my sales data?',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '3',
      role: 'assistant',
      content: "Of course! I'd be happy to help analyze your sales data. Please share your spreadsheet or describe what specific insights you're looking for.",
      timestamp: new Date(Date.now() - 1200000)
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 根据threadId显示不同内容
  const displayTitle = threadId === null ? 'New Chat' : 'Conversation';

  // 如果没有选择线程，显示空状态
  const isEmptyState = threadId === null;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Auto-generate thread title if this is the first message
    if (messages.length === 1 && onThreadTitleUpdate) {
      const title = input.substring(0, 50) + (input.length > 50 ? '...' : '');
      onThreadTitleUpdate(title);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate AI response
      const responses = [
        "I've analyzed your data and found some interesting trends. Sales increased by 15% this quarter compared to last quarter.",
        "Based on your spreadsheet, the most profitable product line is the premium category with a 35% margin.",
        "I notice some seasonal patterns in your data. Sales peak during Q4 each year.",
        "Your customer retention rate is 78%, which is above industry average.",
        "I can help you create a formula to calculate the moving average of your sales data."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // You can implement file upload logic here
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // Optionally auto-submit
    setTimeout(() => {
      const submitEvent = new Event('submit', { bubbles: true }) as unknown as React.FormEvent;
      handleSubmit(submitEvent);
    }, 100);
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reloadChat = () => {
    setError(null);
    if (messages.length > 0) {
      const lastUserMessage = messages.find(m => m.role === 'user');
      if (lastUserMessage) {
        setInput(lastUserMessage.content);
      }
    }
  };

  // 如果没有选择线程，显示欢迎界面
  if (isEmptyState) {
    return (
      <div className={cn("flex flex-col h-full bg-gray-50 flex-1", className)}>
        {/* Chat Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {displayTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Welcome State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
              <Bot className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Welcome to AI Assistant
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Select a conversation from the left or create a new one to get started.
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Card
                className="p-5 cursor-pointer hover:border-blue-300 transition-colors hover:shadow-md"
                onClick={() => {
                  // 触发新对话创建
                  if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('create-new-thread'));
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Start a New Chat</h3>
                    <p className="text-sm text-gray-600 mt-1">Begin a new conversation with the AI assistant</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Explore Features</h3>
                    <p className="text-sm text-gray-600 mt-1">Analyze spreadsheets, create formulas, summarize data</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50 flex-1", className)}>
      {/* Chat Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              {displayTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {isLoading && (
              <Button variant="outline" size="sm" onClick={() => setIsLoading(false)}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Stop generating
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={reloadChat}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Card
              className="p-4 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => handleQuickPrompt("Analyze my sales data from the spreadsheet and show trends")}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Analyze Spreadsheet</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Get insights from your data</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => handleQuickPrompt("Help me create formulas for financial calculations")}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Excel Formulas</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Get help with calculations</p>
            </Card>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                I can help you analyze spreadsheets, create formulas, summarize data, and much more.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn(
                  "max-w-[80%]",
                  message.role === 'user' ? 'order-first' : 'order-last'
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border rounded-bl-none shadow-sm"
                  )}>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content)
                      }}
                    />
                  </div>

                  {/* Message Actions */}
                  <div className={cn(
                    "flex items-center space-x-2 mt-2 text-sm",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    <span className="text-gray-500 text-xs">
                      {formatTime(message.timestamp)}
                    </span>

                    {message.role !== 'user' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src="/user-avatar.png" />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4">
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-red-700 font-medium">Error</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Try again
              </Button>
            </div>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-white p-6">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative"
          >
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[56px] py-3 px-4 pr-12 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                {/* Input Actions */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.txt"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleFileUpload}
                    className="h-8 w-8"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!input.trim() || isLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Input Footer */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send</span>
                <span>Shift + Enter for new line</span>
              </div>
              <span>AI can make mistakes. Check important info.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
