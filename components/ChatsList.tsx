"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { X, MessageSquare, ChevronRight, Search } from 'lucide-react';

export const ChatsList = () => {
  const { user } = useAuthStore();
  const { isChatsListOpen, setChatsListOpen, chatsList, loadChatsList, openChat, searchUsers, createDirectChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isChatsListOpen && user) {
      loadChatsList(user.id);
    }
  }, [isChatsListOpen, user, loadChatsList]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, searchUsers, user]);

  const handleOpenChat = (chatId: string, otherUser: { id: string; username?: string }) => {
    openChat(chatId, otherUser);
    setSearchQuery('');
    setChatsListOpen(false);
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    if (!user) return;
    await createDirectChat(user.id, targetUserId);
    setSearchQuery('');
    setChatsListOpen(false);
  };

  return (
    <AnimatePresence>
      {isChatsListOpen && (
        <>
          {/* Фон с затемнением */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChatsListOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-auto"
          />
          
          {/* Сама панель списка чатов */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col pointer-events-auto"
          >
            {/* Хедер панели */}
            <div className="flex flex-col p-4 md:p-6 border-b border-[var(--grace-stone)] bg-white/50 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--grace-ink)] flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[var(--grace-gold)]" />
                  Мои сообщения
                </h2>
                <button 
                  onClick={() => setChatsListOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--grace-stone)] transition-colors active:scale-95"
                >
                  <X className="w-6 h-6 text-[var(--grace-muted)]" />
                </button>
              </div>
              
              {/* Строка поиска */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[var(--grace-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="Найти по юзернейму..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[var(--grace-stone)] rounded-xl leading-5 bg-[#f8f9fa] placeholder-[var(--grace-muted)] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--grace-gold)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Список чатов или результаты поиска */}
            <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
              {searchQuery.length >= 2 ? (
                // Результаты поиска
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-[var(--grace-muted)] uppercase tracking-wider px-2 py-1">
                    Результаты поиска {isSearching && '...'}
                  </h3>
                  {searchResults.length === 0 && !isSearching ? (
                    <div className="p-4 text-center text-[var(--grace-muted)]">Ничего не найдено</div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleStartDirectChat(result.id)}
                        className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#f8f9fa] active:bg-[#e2e8f0] transition-colors flex items-center gap-4 group border border-[var(--grace-stone)] shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-full bg-[var(--grace-ink)]/10 flex items-center justify-center text-[var(--grace-ink)] font-bold text-lg shrink-0">
                          {result.username ? result.username[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--grace-ink)] text-lg truncate">
                            {result.username}
                          </h3>
                          <p className="text-sm text-[var(--grace-muted)]">Написать сообщение</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : chatsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[var(--grace-muted)] opacity-70 p-6">
                  <div className="w-16 h-16 rounded-full bg-[var(--grace-stone)] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium mb-1 text-[var(--grace-ink)]">У вас пока нет чатов</p>
                  <p className="text-sm">Откликнитесь на заявку на карте, чтобы начать диалог с кем-нибудь.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatsList.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleOpenChat(chat.id, chat.otherUser)}
                      className="w-full text-left p-4 rounded-2xl hover:bg-[#f8f9fa] active:bg-[#e2e8f0] transition-colors flex items-center gap-4 group border border-transparent hover:border-[var(--grace-stone)] shadow-sm hover:shadow-md"
                    >
                      {/* Аватарка (первая буква) */}
                      <div className="w-14 h-14 rounded-full bg-[var(--grace-gold)]/20 flex items-center justify-center text-[var(--grace-gold)] font-bold text-xl shrink-0">
                        {chat.otherUser.username ? chat.otherUser.username[0].toUpperCase() : 'U'}
                      </div>
                      
                      {/* Информация о чате */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-semibold text-[var(--grace-ink)] text-lg truncate pr-3">
                            {chat.otherUser.username || 'Пользователь'}
                          </h3>
                          <span className="text-xs text-[var(--grace-muted)] shrink-0 font-medium">
                            {chat.lastMessage 
                              ? new Date(chat.lastMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                              : new Date(chat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--grace-muted)] truncate">
                          {chat.lastMessage ? chat.lastMessage.text : 'Чат создан'}
                        </p>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-[var(--grace-stone)] group-hover:text-[var(--grace-gold)] transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
