"use client";

import { motion } from "framer-motion";
import { MapComponent as Map } from "@/components/Map";
import { FilterBar } from "@/components/FilterBar";
import { BottomSheet } from "@/components/BottomSheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AddButton } from "@/components/AddButton";
import { AddRequestModal } from "@/components/AddRequestModal";
import { HeaderAuth } from "@/components/HeaderAuth";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatsList } from "@/components/ChatsList";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";

export default function MapPage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-[var(--grace-ivory)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="absolute top-6 left-6 z-10 flex gap-2 pointer-events-auto"
      >
        <div className="drop-shadow-sm bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[var(--grace-stone)] pointer-events-none">
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold text-[var(--grace-ink)] flex items-center gap-2 tracking-tight">
            Grace<span className="text-[var(--grace-gold)]">Map</span>
          </h1>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex flex-row items-center gap-3 pointer-events-auto"
      >
        <HeaderAuth />
        <LanguageSwitcher />
      </motion.div>

      <Map />
      <FilterBar />
      <AddButton />
      <BottomSheet />
      <AddRequestModal />
      <ChatWindow />
      <ChatsList />
      <ProfileSettingsModal />
    </main>
  );
}
