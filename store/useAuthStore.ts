import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  isLoading: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  setProfileModalOpen: (isOpen: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  initializeAuth: () => void | (() => void);
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  isLoading: true,
  
  setUser: (user, session) => set({ user, session }),
  setProfile: (profile) => set({ profile }),
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setProfileModalOpen: (isOpen) => set({ isProfileModalOpen: isOpen }),
  
  updateProfile: (updates) => set((state) => ({ 
    profile: state.profile ? { ...state.profile, ...updates } : null 
  })),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        set({ profile: data });
        // Если это временный системный юзернейм, предлагаем изменить
        if (data.username?.startsWith('user_')) {
          set({ isProfileModalOpen: true });
        }
      }
    };

    // Получаем текущую сессию при инициализации
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoading: false });
      if (session?.user) fetchProfile(session.user.id);
    }).catch(console.error);

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });

    return () => subscription.unsubscribe();
  }
}));
