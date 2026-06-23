"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore, HelpType } from '../store/useMapStore';
import { useI18nStore } from '../store/useI18nStore';
import { AlertCircle, Church } from 'lucide-react';
import { PrayerIcon } from './Icons';

export const FilterBar = () => {
  const { activeFilters, toggleFilter } = useMapStore();
  const { t } = useI18nStore();

  const filters = [
    { id: 'urgent' as HelpType, label: t('filters.urgent'), icon: <AlertCircle className="w-4 h-4" />, color: 'var(--urgent)' },
    { id: 'project' as HelpType, label: t('filters.project'), icon: <Church className="w-4 h-4" />, color: 'var(--project)' },
    { id: 'prayer' as HelpType, label: t('filters.prayer'), icon: <PrayerIcon className="w-4 h-4" />, color: 'var(--prayer)' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:left-1/2 z-10 pointer-events-none w-[90%] md:w-auto"
    >
      <div className="bg-white/90 backdrop-blur-md px-2 py-2 rounded-full border border-[var(--grace-stone)] pointer-events-auto shadow-md w-full flex gap-1">
        {filters.map(f => {
          const isActive = activeFilters[f.id];
          return (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              className={`flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-full font-medium shadow-sm transition-all text-xs md:text-sm active:scale-95
                ${isActive 
                  ? 'bg-[var(--grace-ink)] text-white hover:bg-black drop-shadow-md' 
                  : 'bg-transparent text-[var(--grace-muted)] hover:bg-[var(--grace-stone)]'
                }`}
            >
              {React.cloneElement(f.icon as React.ReactElement<{className?: string}>, {
                 className: `w-4 h-4 mr-1.5 ${isActive ? 'text-white' : ''}`
              })}
              {f.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
