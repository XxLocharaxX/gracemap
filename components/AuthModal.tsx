"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useI18nStore } from '../store/useI18nStore';
import { X, Mail, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthModal = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useAuthStore();
  const { t } = useI18nStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (user) {
      setAuthModalOpen(false);
      setIsOtpMode(false);
      setOtpCode('');
    }
  }, [user, setAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isOtpMode) {
        // Подтверждение OTP-кода
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: 'signup'
        });
        if (error) throw error;
        if (data.session) {
          setAuthModalOpen(false);
        }
      } else if (isLogin) {
        // Вход
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Регистрация
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.session) {
          setAuthModalOpen(false);
        } else {
          // Сессии нет, значит включено "Confirm Email", переключаемся на ввод кода
          setIsOtpMode(true);
          setMessage('Код подтверждения отправлен на вашу почту!');
        }
      }
    } catch (err: any) {
      console.error("SUPABASE AUTH ERROR:", err);
      // Ручная локализация популярных ошибок
      let errorMsg = err.message;
      if (!errorMsg || typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(err);
      }
      
      if (errorMsg === 'Invalid login credentials') errorMsg = 'Неверный email или пароль';
      if (errorMsg?.includes('Token has expired or is invalid')) errorMsg = 'Неверный или устаревший код';
      
      setError(errorMsg || 'Неизвестная ошибка: ' + JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setAuthModalOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[var(--grace-ivory)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--grace-stone)]"
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-[family-name:var(--font-cormorant)] font-semibold text-[var(--grace-ink)]">
              {isOtpMode ? 'Код подтверждения' : isLogin ? 'Вход в аккаунт' : 'Регистрация'}
            </h2>
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="p-2 bg-[var(--grace-stone)] rounded-full text-[var(--grace-ink)] hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isOtpMode ? (
              <>
                <div>
                  <label className="text-sm font-semibold text-[var(--grace-ink)] mb-1.5 block">Email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--grace-muted)]">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="hello@gracemap.ru"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--grace-ink)] mb-1.5 block">Пароль</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--grace-muted)]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input 
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-semibold text-[var(--grace-ink)] mb-1.5 block text-center">
                  Введите 6-значный код из письма
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--grace-muted)]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors text-center text-2xl font-bold tracking-widest"
                  />
                </div>
                <p className="text-xs text-[var(--grace-muted)] text-center mt-3">
                  Мы отправили код на {email}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}
            
            {message && !error && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 text-center">
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (isOtpMode && otpCode.length !== 6)}
              className="w-full py-4 mt-2 rounded-xl bg-[var(--grace-ink)] text-white font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isOtpMode ? 'Подтвердить код' : isLogin ? 'Войти' : 'Создать аккаунт'}
                  {!isOtpMode && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          {!isOtpMode && (
            <>
              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-sm text-[var(--grace-muted)] hover:text-[var(--grace-ink)] transition-colors"
                >
                  {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[var(--grace-stone)]"></div>
                  <span className="flex-shrink-0 mx-4 text-[var(--grace-muted)] text-sm">Или войти через</span>
                  <div className="flex-grow border-t border-[var(--grace-stone)]"></div>
                </div>
                
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--grace-stone)] bg-white text-[var(--grace-ink)] hover:bg-[#F8F9FA] transition-colors font-medium active:scale-95 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'yandex' as any })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--grace-stone)] bg-white text-[var(--grace-ink)] hover:bg-[#F8F9FA] transition-colors font-medium active:scale-95 shadow-sm"
                >
                  <span className="font-bold text-red-500 text-lg">Я</span>
                  <span>Яндекс</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
