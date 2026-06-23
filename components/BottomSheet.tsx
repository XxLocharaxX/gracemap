"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../store/useMapStore';
import { useI18nStore } from '../store/useI18nStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, BadgeCheck, X, MessageCircle } from 'lucide-react';
import { UrgentIcon, ProjectIcon, PrayerIcon } from './Icons';

export const BottomSheet = () => {
  const { selectedRequest, setSelectedRequest } = useMapStore();
  const { t } = useI18nStore();

  const getTypeInfo = (type: string) => {
    switch(type) {
      case 'urgent': return { color: 'var(--urgent)', label: t('bottomSheet.urgent'), icon: <UrgentIcon className="w-5 h-5" /> };
      case 'project': return { color: 'var(--project)', label: t('bottomSheet.project'), icon: <ProjectIcon className="w-5 h-5" /> };
      case 'prayer': return { color: 'var(--prayer)', label: t('bottomSheet.prayer'), icon: <PrayerIcon className="w-5 h-5" /> };
      default: return { color: 'var(--grace-ink)', label: t('bottomSheet.request'), icon: null };
    }
  };

  const [hasPrayed, setHasPrayed] = useState(false);

  useEffect(() => {
    if (selectedRequest) {
      const prayed = localStorage.getItem(`prayed_${selectedRequest.id}`);
      setHasPrayed(!!prayed);
    }
  }, [selectedRequest]);

  return (
    <AnimatePresence>
      {selectedRequest && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRequest(null)}
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-20"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-md bg-[var(--grace-ivory)] z-30 rounded-t-3xl shadow-2xl pb-safe flex flex-col"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <div className="flex justify-center pt-3 pb-2" onClick={() => setSelectedRequest(null)}>
              <div className="w-12 h-1.5 bg-[var(--grace-stone)] rounded-full" />
            </div>
            
            <div className="px-6 py-4">
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="flex items-center gap-2 text-sm font-semibold tracking-wider"
                  style={{ color: getTypeInfo(selectedRequest.type).color }}
                >
                  {getTypeInfo(selectedRequest.type).icon}
                  {getTypeInfo(selectedRequest.type).label}
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-[var(--grace-muted)] p-1 bg-[var(--grace-stone)] rounded-full hover:bg-black/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-[family-name:var(--font-cormorant)] font-semibold text-[var(--grace-ink)] mb-2">
                {selectedRequest.title}
              </h2>
              
              {selectedRequest.authorName !== 'OSM' && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white border border-[var(--grace-stone)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--grace-stone)] flex items-center justify-center text-[var(--grace-ink)] font-bold text-sm">
                    {selectedRequest.authorName
                      ? selectedRequest.authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                      : 'А'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[var(--grace-ink)]">{selectedRequest.authorName || 'Аноним'}</div>
                    <div className="text-xs text-[var(--grace-muted)]">автор запроса</div>
                  </div>
                </div>
              )}

              {selectedRequest.description && !selectedRequest.description.includes('Импортировано из OpenStreetMap') && (
                <p className="text-[var(--grace-ink)] text-sm leading-relaxed mb-6 italic">
                  «{selectedRequest.description}»
                </p>
              )}

              <div className="flex flex-col gap-3 mb-6 text-sm text-[var(--grace-muted)]">
                {selectedRequest.distance && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>📍 {selectedRequest.distance} {t('bottomSheet.distance')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('bottomSheet.published')} {selectedRequest.timeAgo}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--prayer)] font-medium">
                  <PrayerIcon className="w-4 h-4" />
                  <span>Молятся: {selectedRequest.prayersCount || 0}</span>
                </div>
                {selectedRequest.isVerified && (
                  <div className="flex items-center gap-2 text-[var(--verified)]">
                    <BadgeCheck className="w-4 h-4" />
                    <span>{t('bottomSheet.verified')}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const [lng, lat] = selectedRequest.location;
                    const label = encodeURIComponent(selectedRequest.title);
                    if (/iPhone|iPad/i.test(navigator.userAgent)) {
                      window.open(`maps://?daddr=${lat},${lng}&q=${label}`);
                    } else if (/Android/i.test(navigator.userAgent)) {
                      window.open(`google.navigation:q=${lat},${lng}`);
                    } else {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`);
                    }
                  }}
                  className="w-full py-3.5 rounded-xl font-medium transition-transform active:scale-[0.98] bg-[#5B9BD5] text-white hover:bg-[#4a8ac4] flex items-center justify-center gap-2 shadow-sm"
                >
                  <MapPin className="w-5 h-5 text-white" />
                  Как добраться
                </button>

                <div className="flex gap-3">
                  <button onClick={() => {
                    const contact = selectedRequest.contact;
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    
                    if (!contact) {
                      if (selectedRequest.phone) {
                         if (isMobile) window.location.href = `tel:${selectedRequest.phone}`;
                         else {
                           navigator.clipboard.writeText(selectedRequest.phone);
                           alert(`Номер ${selectedRequest.phone} скопирован в буфер обмена`);
                         }
                      } else {
                        alert('Автор не указал номер телефона.');
                      }
                      return;
                    }
                    if (contact.type === 'phone' || contact.type === 'whatsapp') {
                      if (isMobile) window.location.href = `tel:${contact.value}`;
                      else {
                         navigator.clipboard.writeText(contact.value);
                         alert(`Номер ${contact.value} скопирован в буфер обмена`);
                      }
                    } else {
                      alert('Этот автор принимает сообщения только в Telegram. Нажмите "Написать".');
                    }
                  }} className="flex-1 py-3.5 rounded-xl font-medium transition-transform active:scale-[0.98] border border-[var(--grace-stone)] text-[var(--grace-ink)] hover:bg-[var(--grace-stone)] flex items-center justify-center gap-2">
                    Позвонить
                  </button>
                  <button onClick={async () => {
                    const { user, setAuthModalOpen } = useAuthStore.getState();
                    
                    if (selectedRequest.user_id) {
                      if (!user) {
                        setAuthModalOpen(true);
                        return;
                      }
                      
                      if (user.id === selectedRequest.user_id) {
                        alert("Вы не можете писать самому себе.");
                        return;
                      }

                      // Проверяем, есть ли уже чат
                      const { data: existingChat } = await supabase
                        .from('chats')
                        .select('id')
                        .eq('request_id', selectedRequest.id)
                        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
                        .single();

                      if (existingChat) {
                        useChatStore.getState().openChat(existingChat.id);
                      } else {
                        // Создаем чат
                        const { data: newChat, error } = await supabase
                          .from('chats')
                          .insert([{
                            user_1: user.id,
                            user_2: selectedRequest.user_id,
                            request_id: selectedRequest.id
                          }])
                          .select()
                          .single();
                          
                        if (newChat) {
                          useChatStore.getState().openChat(newChat.id);
                        } else if (error) {
                          console.error(error);
                          alert("Ошибка при создании чата");
                        }
                      }
                      return;
                    }

                    // Fallback для старых маркеров без user_id
                    const contact = selectedRequest.contact;
                    if (!contact) {
                      alert('Контакт не указан');
                      return;
                    }
                    switch (contact.type) {
                      case 'telegram':
                        window.open(`https://t.me/${contact.value.replace('@', '')}`, '_blank');
                        break;
                      case 'whatsapp':
                        window.open(`https://wa.me/${contact.value.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Увидел ваш запрос на GraceMap, хочу помочь')}`, '_blank');
                        break;
                      case 'phone':
                        alert('Автор оставил только обычный телефонный номер. Пожалуйста, позвоните ему.');
                        break;
                    }
                  }} className="flex-1 py-3.5 rounded-xl font-medium transition-transform active:scale-[0.98] border border-[var(--grace-stone)] bg-[var(--grace-ink)] text-white hover:bg-black flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Написать
                  </button>
                </div>
                
                <button 
                  disabled={hasPrayed}
                  onClick={async () => {
                    if (hasPrayed) return;
                    
                    const currentCount = selectedRequest.prayersCount || 0;
                    const newCount = currentCount + 1;
                    
                    setHasPrayed(true);
                    localStorage.setItem(`prayed_${selectedRequest.id}`, 'true');

                    // Optimistic update
                    setSelectedRequest({ ...selectedRequest, prayersCount: newCount });
                    useMapStore.setState(state => ({
                      requests: state.requests.map(r => r.id === selectedRequest.id ? { ...r, prayersCount: newCount } : r)
                    }));

                    // DB update
                    const { supabase } = await import('../lib/supabase');
                    await supabase.from('help_requests').update({ prayers_count: newCount }).eq('id', selectedRequest.id);
                  }}
                  className={`w-full py-3.5 rounded-xl font-medium transition-transform flex items-center justify-center gap-2 border ${
                    hasPrayed 
                      ? 'bg-[var(--grace-stone)] text-[var(--grace-muted)] border-transparent cursor-not-allowed opacity-80' 
                      : 'border-[var(--grace-stone)] text-[var(--grace-ink)] hover:bg-[#5B8FCC08] hover:text-[var(--prayer)] hover:border-[var(--prayer)] active:scale-[0.98]'
                  }`}
                >
                  <PrayerIcon className="w-5 h-5" />
                  {hasPrayed ? 'Вы уже помолились' : t('bottomSheet.btnPray')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
