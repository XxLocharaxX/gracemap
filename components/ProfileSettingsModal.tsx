"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ProfileSettingsModal = () => {
  const { user, profile, isProfileModalOpen, setProfileModalOpen, updateProfile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isProfileModalOpen && profile?.username) {
      // Инициализируем текущим именем, если оно не системное
      if (!profile.username.startsWith('user_')) {
        setUsername(profile.username);
        setIsAvailable(true);
      } else {
        setUsername('');
      }
    }
  }, [isProfileModalOpen, profile]);

  const validateFormat = (val: string) => {
    const regex = /^[a-zA-Z0-9а-яА-Я_]{3,15}$/;
    return regex.test(val);
  };

  useEffect(() => {
    if (!username) {
      setIsAvailable(null);
      setIsValid(true);
      setIsChecking(false);
      return;
    }

    if (username.length < 3) {
      setIsAvailable(null);
      setIsValid(false);
      setIsChecking(false);
      return;
    }

    const valid = validateFormat(username);
    setIsValid(valid);
    if (!valid) return;

    // Если имя такое же, как сейчас у юзера
    if (profile?.username === username) {
      setIsAvailable(true);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    const delayDebounceFn = setTimeout(async () => {
      const reserved = ['admin', 'support', 'moderator', 'system', 'grace', 'gracemap'];
      if (reserved.includes(username.toLowerCase())) {
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      setIsAvailable(!data);
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, profile?.username]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid || isAvailable === false || isSaving) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;
      
      // Обновляем локальный стейт
      updateProfile({ username });
      setProfileModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Ошибка при сохранении имени');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isProfileModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setProfileModalOpen(false)}
        />
        
        <motion.div 
          className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/50"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <button 
            onClick={() => setProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--grace-stone)] text-[var(--grace-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-[family-name:var(--font-cormorant)] font-bold text-[var(--grace-ink)] mb-2">
              Настройки профиля
            </h2>
            <p className="text-[var(--grace-muted)] text-sm">
              Придумайте уникальный никнейм, чтобы другим было удобно с вами общаться.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--grace-ink)] mb-2">
                Имя пользователя (никнейм)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  placeholder="Например, Ivan99"
                  className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[var(--grace-gold)]/50 transition-all ${
                    !isValid && username.length > 0 ? 'border-red-500' : 
                    isValid && isAvailable === true ? 'border-green-500' : 
                    isValid && isAvailable === false ? 'border-red-500' : 
                    'border-[var(--grace-stone)]'
                  }`}
                />
                <div className="absolute right-3 top-3.5">
                  {isChecking && <Loader2 className="w-5 h-5 animate-spin text-[var(--grace-muted)]" />}
                  {!isChecking && isValid && isAvailable === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {!isChecking && isValid && isAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              
              <div className="mt-2 min-h-[20px]">
                {!isValid && username.length > 0 && (
                  <p className="text-red-500 text-xs">От 3 до 15 символов (буквы, цифры, _)</p>
                )}
                {isValid && isAvailable === true && profile?.username !== username && (
                  <p className="text-green-500 text-xs">Это имя свободно!</p>
                )}
                {isValid && isAvailable === false && profile?.username !== username && (
                  <p className="text-red-500 text-xs">К сожалению, имя уже занято</p>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!isValid || isAvailable === false || isSaving || !username}
              className="w-full bg-[var(--grace-ink)] hover:bg-black disabled:bg-[var(--grace-stone)] disabled:text-[var(--grace-muted)] text-white py-3.5 rounded-xl font-medium transition-all flex items-center justify-center shadow-sm"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить изменения'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
