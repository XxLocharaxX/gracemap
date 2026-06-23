"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { UserCircle, LogOut, MessageSquare } from 'lucide-react';

export const HeaderAuth = () => {
  const { user, profile, isLoading, setAuthModalOpen, setProfileModalOpen, signOut, initializeAuth } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => cleanup?.();
  }, [initializeAuth]);

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-[var(--grace-stone)] animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="z-20 pointer-events-auto">
        <button 
          onClick={() => setAuthModalOpen(true)}
          className="bg-[var(--grace-ink)] hover:bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          Войти
        </button>
      </div>
    );
  }

  const displayName = profile?.username && !profile.username.startsWith('user_') 
    ? profile.username 
    : user.email;
    
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  return (
    <div className="z-20 pointer-events-auto">
      <div className="relative flex items-center gap-2">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-[var(--grace-stone)] text-[var(--grace-ink)] font-bold border-2 border-white shadow-md flex items-center justify-center hover:bg-[#e2e8f0] active:scale-95 transition-all"
        >
          {initial}
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[var(--grace-stone)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-[var(--grace-stone)]">
              <div className="text-xs text-[var(--grace-muted)] uppercase tracking-wider mb-1">Аккаунт</div>
              <div className="text-sm font-medium text-[var(--grace-ink)] truncate" title={displayName || 'User'}>
                {displayName}
              </div>
              {profile?.username && profile.username.startsWith('user_') && (
                <div className="text-xs text-amber-500 mt-1 cursor-pointer" onClick={() => { setShowDropdown(false); setProfileModalOpen(true); }}>
                  Задать никнейм
                </div>
              )}
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  useChatStore.getState().setChatsListOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--grace-ink)] hover:bg-[var(--grace-stone)] rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[var(--grace-gold)]" />
                Мои сообщения
              </button>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  setProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--grace-ink)] hover:bg-[var(--grace-stone)] rounded-lg transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                Настройки профиля
              </button>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
