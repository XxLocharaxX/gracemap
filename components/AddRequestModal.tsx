"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddRequestStore } from '../store/useAddRequestStore';
import { useMapStore, HelpType } from '../store/useMapStore';
import { useAuthStore } from '../store/useAuthStore';
import { useI18nStore } from '../store/useI18nStore';
import { X, ArrowLeft, Check, MapPin } from 'lucide-react';
import { UrgentIcon, ProjectIcon, PrayerIcon } from './Icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';

// Схема валидации (zod)
const formSchema = z.object({
  authorName: z.string().min(2, 'Имя слишком короткое').max(50, 'Имя слишком длинное'),
  title: z.string().min(10, 'Минимум 10 символов').max(80, 'Максимум 80 символов'),
  description: z.string().min(30, 'Минимум 30 символов'),
  contactType: z.enum(['phone', 'telegram', 'whatsapp']),
  contactValue: z.string().min(3, 'Укажите способ связи')
});

type FormData = z.infer<typeof formSchema>;

export const AddRequestModal = () => {
  const { isAdding, step, setStep, draftData, updateDraft, tempLocation, setTempLocation, cancelAdding } = useAddRequestStore();
  const { user } = useAuthStore();
  const { t } = useI18nStore();
  const [address, setAddress] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { authorName: '', title: '', description: '', contactType: 'telegram', contactValue: '' }
  });

  const authorNameValue = watch('authorName', '');
  const titleValue = watch('title', '');
  const descValue = watch('description', '');
  const contactTypeValue = watch('contactType', 'telegram');

  // Reverse Geocoding при изменении tempLocation
  useEffect(() => {
    if (step === 3 && tempLocation && !isTyping) {
      setAddress(t('addRequest.fetchingAddress'));
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempLocation[1]}&lon=${tempLocation[0]}&accept-language=ru`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            setAddress(parts.slice(0, 3).join(', ').trim());
          } else {
            setAddress('Локация выбрана на карте');
          }
        })
        .catch(() => setAddress('Локация выбрана на карте'));
    }
  }, [tempLocation, step, t, isTyping]);

  // Forward Geocoding (пользователь вводит текст)
  useEffect(() => {
    if (step === 3 && isTyping && address.length > 3) {
      const timer = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=ru`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              setTempLocation([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
            }
          })
          .catch(() => {});
      }, 1000); // 1s debounce
      return () => clearTimeout(timer);
    }
  }, [address, isTyping, step, setTempLocation]);

  if (!isAdding) return null;

  const handleTypeSelect = (type: HelpType) => {
    updateDraft({ type });
    setStep(2);
  };

  const onFormSubmit = (data: FormData) => {
    updateDraft({
      authorName: data.authorName,
      title: data.title,
      description: data.description,
      contact: {
        type: data.contactType,
        value: data.contactValue
      }
    });
    setIsTyping(false); // Reset typing state before step 3
    setStep(3);
  };

  const handlePublish = async () => {
    if (!draftData.type || !draftData.title || !draftData.description || !tempLocation) return;
    
    // Блокировка публикации если turnstile не пройден
    if (!turnstileToken || turnstileStatus !== 'success') return;
    
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: turnstileToken,
          type: draftData.type,
          authorName: draftData.authorName,
          title: draftData.title,
          description: draftData.description,
          location: tempLocation,
          contact: draftData.contact,
          userId: user?.id
        })
      });

      if (res.ok) {
        setTurnstileToken(null);
        setTurnstileStatus('idle');
        cancelAdding();
      } else {
        const errorData = await res.json();
        alert(`Ошибка сервера при публикации: ${errorData.details || errorData.error}`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Сетевая ошибка при публикации: ' + e.message);
    }
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col">
      <AnimatePresence mode="wait">
        {step < 3 ? (
          <motion.div 
            key="form-steps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto"
          >
            <div className="bg-[var(--grace-ivory)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-screen">
              <div className="flex items-center justify-between p-4 border-b border-[var(--grace-stone)]">
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="p-1 rounded-full hover:bg-[var(--grace-stone)] transition-colors">
                      <ArrowLeft className="w-5 h-5 text-[var(--grace-ink)]" />
                    </button>
                  )}
                  <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[var(--grace-ink)]">
                    {t('addRequest.title')}
                  </h2>
                </div>
                <button type="button" onClick={cancelAdding} className="p-1 rounded-full hover:bg-[var(--grace-stone)] transition-colors">
                  <X className="w-5 h-5 text-[var(--grace-muted)]" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-[var(--grace-muted)] mb-2 uppercase tracking-wider">{t('addRequest.step1')}</h3>
                    
                    <button type="button" onClick={() => handleTypeSelect('urgent')} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--grace-stone)] hover:border-[var(--urgent)] transition-all text-left bg-white relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--urgent)] transition-transform origin-left group-hover:scale-x-150" />
                      <div className="w-14 h-14 rounded-full bg-[#E8725A15] flex items-center justify-center text-[var(--urgent)] ml-2"><UrgentIcon className="w-7 h-7" /></div>
                      <div>
                        <div className="font-semibold text-lg text-[var(--grace-ink)]">{t('addRequest.typeUrgent')}</div>
                      </div>
                    </button>
                    
                    <button type="button" onClick={() => handleTypeSelect('project')} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--grace-stone)] hover:border-[var(--project)] transition-all text-left bg-white relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--project)] transition-transform origin-left group-hover:scale-x-150" />
                      <div className="w-14 h-14 rounded-full bg-[#D4973A15] flex items-center justify-center text-[var(--project)] ml-2"><ProjectIcon className="w-7 h-7" /></div>
                      <div>
                        <div className="font-semibold text-lg text-[var(--grace-ink)]">{t('addRequest.typeProject')}</div>
                      </div>
                    </button>
                    
                    <button type="button" onClick={() => handleTypeSelect('prayer')} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--grace-stone)] hover:border-[var(--prayer)] transition-all text-left bg-white relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--prayer)] transition-transform origin-left group-hover:scale-x-150" />
                      <div className="w-14 h-14 rounded-full bg-[#5B8FCC15] flex items-center justify-center text-[var(--prayer)] ml-2"><PrayerIcon className="w-7 h-7" /></div>
                      <div>
                        <div className="font-semibold text-lg text-[var(--grace-ink)]">{t('addRequest.typePrayer')}</div>
                      </div>
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4 pb-2">
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="text-sm font-semibold text-[var(--grace-ink)]">Как вас зовут?</label>
                      </div>
                      <input 
                        {...register('authorName')}
                        placeholder="Ваше имя или название организации"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors"
                      />
                      {errors.authorName && <p className="text-red-500 text-xs mt-1">{errors.authorName.message}</p>}
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="text-sm font-semibold text-[var(--grace-ink)]">{t('addRequest.formTitle')}</label>
                        <span className={`text-xs ${titleValue.length > 80 ? 'text-red-500' : 'text-[var(--grace-muted)]'}`}>
                          {titleValue.length} / 80
                        </span>
                      </div>
                      <input 
                        {...register('title')}
                        placeholder={t('addRequest.formTitlePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors"
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                       <div className="flex justify-between items-end mb-1.5">
                        <label className="text-sm font-semibold text-[var(--grace-ink)]">{t('addRequest.formDesc')}</label>
                        <span className={`text-xs ${descValue.length > 500 ? 'text-red-500' : 'text-[var(--grace-muted)]'}`}>
                          {descValue.length} / 500
                        </span>
                      </div>
                      <textarea 
                        {...register('description')}
                        placeholder={t('addRequest.formDescPlaceholder')}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors resize-none"
                      />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="bg-[var(--grace-stone)] h-[1px] w-full my-2 opacity-50" />

                    <div>
                      <label className="text-sm font-semibold text-[var(--grace-ink)] mb-1.5 block">Контакты (скрыто, для связи)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select 
                          {...register('contactType')}
                          className="px-4 py-3 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors sm:w-1/3"
                        >
                          <option value="telegram">Telegram</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="phone">Телефон</option>
                        </select>
                        <input 
                          {...register('contactValue')}
                          placeholder={contactTypeValue === 'telegram' ? '@username' : '+1234567890'}
                          className="flex-1 px-4 py-3 rounded-xl border border-[var(--grace-stone)] bg-white focus:outline-none focus:border-[var(--grace-ink)] transition-colors"
                        />
                      </div>
                      {errors.contactValue && <p className="text-red-500 text-xs mt-1">{errors.contactValue.message}</p>}
                    </div>

                    <button type="submit" className="w-full py-3.5 rounded-xl bg-[var(--grace-ink)] text-white font-medium hover:bg-black transition-colors mt-4">
                      {t('addRequest.btnNext')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="location-step"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 pointer-events-auto bg-[var(--grace-ivory)] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-safe z-30"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-[var(--grace-ink)] text-lg mb-1">{t('addRequest.step3')}</h3>
                <p className="text-sm text-[var(--grace-muted)]">{t('addRequest.selectLocation')}</p>
              </div>
              <button onClick={cancelAdding} className="p-2 rounded-full bg-[var(--grace-stone)] hover:bg-black/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6 bg-white rounded-xl border border-[var(--grace-stone)] flex items-center overflow-hidden focus-within:border-[var(--grace-ink)] transition-colors group">
              <div className="pl-4 pr-2">
                <MapPin className="text-[var(--grace-gold)] w-5 h-5 flex-shrink-0" />
              </div>
              <input
                value={address}
                onChange={e => {
                  setIsTyping(true);
                  setAddress(e.target.value);
                }}
                className="w-full py-3.5 pr-4 text-sm text-[var(--grace-ink)] font-medium focus:outline-none bg-transparent placeholder:text-[var(--grace-muted)]"
                placeholder="Напишите адрес для поиска..."
              />
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    setAddress('Определяем...');
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                         setIsTyping(false);
                         setTempLocation([pos.coords.longitude, pos.coords.latitude]);
                      },
                      () => setAddress('Ошибка определения локации')
                    );
                  }
                }}
                className="p-3 bg-[var(--grace-stone)] text-[var(--grace-ink)] hover:bg-[#e2e8f0] transition-colors flex-shrink-0 m-1 rounded-lg border-none outline-none"
                title="Моё местоположение"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setTurnstileStatus('success');
                }}
                onError={() => setTurnstileStatus('error')}
                onExpire={() => {
                  setTurnstileToken(null);
                  setTurnstileStatus('idle');
                }}
                options={{ theme: 'light', language: 'ru', size: 'invisible' }}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3.5 rounded-xl border border-[var(--grace-stone)] font-medium text-[var(--grace-ink)] hover:bg-[var(--grace-stone)] transition-colors">
                {t('addRequest.btnBack')}
              </button>
              <button 
                onClick={handlePublish}
                disabled={!tempLocation || !turnstileToken || turnstileStatus !== 'success'}
                className="flex-1 py-3.5 rounded-xl bg-[var(--grace-ink)] text-white font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {turnstileStatus === 'success' ? t('addRequest.btnPublish') : 'Проверка бота...'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
