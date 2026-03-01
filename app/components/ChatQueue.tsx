"use client";

import React, { useReducer, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';

// --- Types & Reducer ---
type Message = { id: string; text: string; status: 'sent' | 'queued' | 'processing' };

type State = {
  messages: Message[];
  queue: Message[];
  isWorking: boolean;
};

type Action = 
  | { type: 'SUBMIT_INPUT'; text: string }
  | { type: 'PROCESS_NEXT' }
  | { type: 'FINISH_PROCESSING'; id: string }
  | { type: 'DISMISS_QUEUED'; id: string };

function queueReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_INPUT':
      const newMsg: Message = { id: Date.now().toString(), text: action.text, status: state.isWorking ? 'queued' : 'processing' };
      if (state.isWorking) {
        return { ...state, queue: [...state.queue, newMsg] };
      }
      return { ...state, messages: [...state.messages, newMsg], isWorking: true };

    case 'PROCESS_NEXT':
      if (state.queue.length === 0) return { ...state, isWorking: false };
      const [next, ...remaining] = state.queue;
      return { 
        ...state, 
        messages: [...state.messages, { ...next, status: 'processing' }], 
        queue: remaining,
        isWorking: true 
      };

    case 'FINISH_PROCESSING':
      return { ...state, isWorking: false };

    case 'DISMISS_QUEUED':
      return { ...state, queue: state.queue.filter(m => m.id !== action.id) };
      
    default:
      return state;
  }
}

// --- Main Component ---
export default function ChatQueue() {
  const [state, dispatch] = useReducer(queueReducer, { messages: [], queue: [], isWorking: false });
  const [input, setInput] = useState("");

  // Simulate Assistant Work & WebSocket Events
  useEffect(() => {
    if (state.isWorking) {
      const timer = setTimeout(() => {
        console.log("WS Event: message_processed");
        dispatch({ type: 'FINISH_PROCESSING', id: "" });
      }, 3500); // 3.5s "work" delay
      return () => clearTimeout(timer);
    } else if (state.queue.length > 0) {
      console.log("WS Event: queue_processing");
      dispatch({ type: 'PROCESS_NEXT' });
    }
  }, [state.isWorking, state.queue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: 'SUBMIT_INPUT', text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-50">
      {/* Chat Display */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
        <AnimatePresence>
          {state.messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[80%]"
            >
              {m.text}
            </motion.div>
          ))}
          
          {/* Queued Messages Overlay */}
          {state.queue.map((m) => (
            <motion.div 
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.7, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="border-2 border-dashed border-gray-400 text-gray-600 p-3 rounded-2xl ml-auto max-w-[70%] flex justify-between items-center"
            >
              <span>{m.text}</span>
              <button onClick={() => dispatch({ type: 'DISMISS_QUEUED', id: m.id })} className="hover:text-red-500">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="relative">
        {state.queue.length > 0 && (
          <div className="text-xs text-gray-500 mb-1 ml-2 animate-pulse">
            {state.queue.length} message{state.queue.length > 1 ? 's' : ''} queued
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={state.isWorking ? "Add to queue..." : "Ask anything..."}
              className="w-full p-3 pr-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {state.isWorking && <Loader2 className="absolute right-3 top-3 animate-spin text-blue-500" size={20} />}
          </div>
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}