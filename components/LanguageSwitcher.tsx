"use client";

import React, { useState } from 'react';
import { useI18nStore } from '../store/useI18nStore';
import { motion, PanInfo } from 'framer-motion';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18nStore();
  const [isDragging, setIsDragging] = useState(false);

  const toggle = () => {
    if (!isDragging) {
      setLanguage(language === 'ru' ? 'en' : 'ru');
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Небольшая задержка, чтобы клик не сработал сразу после перетаскивания
    setTimeout(() => setIsDragging(false), 50);
    
    if (language === 'ru' && info.offset.x > 10) {
      setLanguage('en');
    } else if (language === 'en' && info.offset.x < -10) {
      setLanguage('ru');
    }
  };

  return (
    <div 
      className="relative flex items-center bg-white/80 backdrop-blur-md rounded-full border border-[var(--grace-stone)] shadow-sm p-1 cursor-pointer w-[76px] h-[40px] shrink-0"
      onClick={toggle}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 36 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className="absolute top-1 bottom-1 w-[32px] bg-[var(--grace-ink)] rounded-full z-0 cursor-grab active:cursor-grabbing shadow-sm"
        initial={false}
        animate={{
          x: language === 'ru' ? 0 : 36
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />

      <div className="relative z-10 flex w-full justify-between px-1 pointer-events-none select-none">
        <span className={`text-xs font-semibold w-[32px] text-center transition-colors duration-200 ${language === 'ru' ? 'text-white' : 'text-[var(--grace-muted)]'}`}>
          RU
        </span>
        <span className={`text-xs font-semibold w-[32px] text-center transition-colors duration-200 ${language === 'en' ? 'text-white' : 'text-[var(--grace-muted)]'}`}>
          EN
        </span>
      </div>
    </div>
  );
};
