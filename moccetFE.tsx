"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant' | 'queued';
}

export default function QueuedChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [queue, setQueue] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or queue change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, queue]);

  // FIFO Logic: Process next item in queue when assistant is no longer working
  useEffect(() => {
    if (!isWorking && queue.length > 0) {
      const nextMessage = queue[0];
      setQueue((prev) => prev.slice(1));
      processMessage(nextMessage.text);
    }
  }, [isWorking, queue]);

  const processMessage = async (text: string) => {
    setIsWorking(true);
    
    // Add user message to main chat
    const userMsg: Message = { id: Date.now().toString(), text, role: 'user' };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate AI Processing Delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const assistantMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      text: `Processed: "${text}". Here is your response.`, 
      role: 'assistant' 
    };
    
    setMessages((prev) => [...prev, assistantMsg]);
    setIsWorking(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isWorking) {
      const queuedMsg: Message = { id: Date.now().toString(), text: input, role: 'queued' };
      setQueue((prev) => [...prev, queuedMsg]);
    } else {
      processMessage(input);
    }
    setInput('');
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-slate-50 border-x shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="font-semibold text-slate-700">Async Assistant</h1>
        {isWorking && (
          <div className="flex items-center gap-2 text-blue-500 text-sm font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Assistant is working...
          </div>
        )}
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border text-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Queued Messages */}
          {queue.map((msg, index) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-end relative group"
            >
              <div className="max-w-[70%] p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100/50 text-slate-500 flex items-center gap-3">
                <span className="text-sm italic line-clamp-1">{msg.text}</span>
                <button 
                  onClick={() => removeFromQueue(msg.id)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <AnimatePresence>
          {queue.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-bold text-blue-500 mb-2 px-1 uppercase tracking-wider"
            >
              {queue.length} {queue.length === 1 ? 'message' : 'messages'} queued
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWorking ? "Add to queue..." : "Ask anything..."}
            className={`w-full p-4 pr-12 rounded-xl border transition-all outline-none focus:ring-2 ${
              isWorking 
              ? 'bg-slate-50 border-dashed border-blue-200 focus:ring-blue-100' 
              : 'bg-white border-slate-200 focus:ring-slate-100'
            }`}
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-3 p-2 text-blue-600 hover:bg-blue-50 disabled:text-slate-300 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
