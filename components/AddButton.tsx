"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAddRequestStore } from '../store/useAddRequestStore';
import { useI18nStore } from '../store/useI18nStore';

export const AddButton = () => {
  const { startAdding, isAdding } = useAddRequestStore();
  
  if (isAdding) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
      className="absolute bottom-32 right-4 md:bottom-8 md:right-[72px] z-10 flex items-center justify-center"
    >
      {/* Пульсирующий фон-подсказка */}
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 bg-[var(--grace-gold)] rounded-full -z-10"
      />
      <button
        onClick={startAdding}
        className="w-16 h-16 bg-[var(--grace-gold)] hover:bg-[#b59543] active:scale-95 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 lg:hover:scale-110 group"
      >
        <Plus className="w-8 h-8" />
      </button>
    </motion.div>
  );
};
