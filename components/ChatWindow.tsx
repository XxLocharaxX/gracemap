"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Send, Paperclip, Image as ImageIcon } from 'lucide-react';

export const ChatWindow = () => {
  const { messages, sendMessage, isChatOpen, closeChat, activeChatId, subscribeToChat, activeChatOtherUser } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);

  const displayName = activeChatOtherUser?.username || 'Пользователь';
  const initial = displayName[0].toUpperCase();

  // Подписка на сообщения при открытии чата
  useEffect(() => {
    if (isChatOpen && activeChatId) {
      const unsubscribe = subscribeToChat(activeChatId);
      return () => unsubscribe();
    }
  }, [isChatOpen, activeChatId, subscribeToChat]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isChatOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const text = input.value.trim();
    
    if (!text && !selectedImage) return;
    
    sendMessage(text, user.id, selectedImage || undefined);
    
    form.reset();
    setSelectedImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end md:p-6 pointer-events-none">
        {/* Задний фон с размытием */}
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeChat}
        />

        {/* Окно чата */}
        <motion.div 
          className="relative w-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-t-[2rem] md:rounded-3xl flex flex-col overflow-hidden pointer-events-auto h-[85dvh] md:h-[600px] md:w-[400px] border border-white/50"
          initial={{ y: '100%', opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Хедер чата */}
          <div className="p-4 border-b border-[var(--grace-stone)] flex justify-between items-center bg-white/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--grace-gold)]/20 flex items-center justify-center text-[var(--grace-gold)] font-bold text-lg">
                {initial}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--grace-ink)] max-w-[200px] truncate">{displayName}</h3>
                <p className="text-xs text-[var(--grace-muted)]">Онлайн</p>
              </div>
            </div>
            <button 
              onClick={closeChat} 
              className="p-2 rounded-full hover:bg-[var(--grace-stone)] text-[var(--grace-muted)] transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Тело чата */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain bg-gradient-to-b from-transparent to-[var(--grace-ivory)]/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--grace-muted)] opacity-50">
                <div className="w-16 h-16 rounded-full bg-[var(--grace-stone)] flex items-center justify-center mb-4">
                  <Send className="w-6 h-6" />
                </div>
                <p>Здесь пока нет сообщений</p>
                <p className="text-sm">Напишите первым!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm transition-all relative
                      ${isMe 
                        ? 'bg-[var(--grace-ink)] text-white rounded-br-sm shadow-md' 
                        : 'bg-white border border-[var(--grace-stone)] text-[var(--grace-ink)] rounded-bl-sm shadow-sm'
                      }
                      ${msg.status === 'sending' ? 'opacity-70' : ''}
                      ${msg.status === 'error' ? 'bg-red-500 text-white' : ''}
                    `}>
                      {msg.image_url && (
                        <div className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-xl">
                          <img 
                            src={msg.image_url} 
                            alt="Прикрепленное изображение" 
                            className="w-full max-w-[250px] object-cover max-h-[300px]"
                          />
                        </div>
                      )}
                      {msg.text !== '[Изображение]' && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      )}
                      <div className={`text-[10px] text-right mt-1.5 flex items-center justify-end gap-1 ${isMe ? 'text-white/60' : 'text-[var(--grace-muted)]'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span>
                            {msg.status === 'sending' && '⏳'}
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'error' && '❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Превью выбранной картинки */}
          {selectedImage && (
            <div className="px-4 py-2 bg-[var(--grace-stone)]/30 border-t border-[var(--grace-stone)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--grace-gold)]" />
                <span className="text-sm text-[var(--grace-ink)] truncate max-w-[200px]">{selectedImage.name}</span>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-full hover:bg-[var(--grace-stone)] text-[var(--grace-muted)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Инпут */}
          <form 
            onSubmit={handleSubmit}
            className="p-3 border-t border-[var(--grace-stone)] bg-white flex gap-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] items-center"
          >
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl hover:bg-[var(--grace-stone)] text-[var(--grace-muted)] transition-colors flex shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            <input 
              name="message"
              type="text" 
              autoComplete="off"
              placeholder="Написать сообщение..." 
              className="flex-1 px-4 py-3 rounded-2xl border border-[var(--grace-stone)] bg-[var(--grace-ivory)] focus:outline-none focus:ring-2 focus:ring-[var(--grace-gold)]/50 focus:bg-white text-sm transition-all"
            />
            <button 
              type="submit" 
              className="bg-[var(--grace-gold)] hover:bg-[#b59540] text-white p-3 rounded-2xl shadow-sm transition-colors active:scale-95 flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
