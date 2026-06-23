import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  status: 'sending' | 'sent' | 'error';
  sender_username?: string;
}

export interface ChatPreview {
  id: string;
  otherUser: { id: string; username?: string; avatar_url?: string };
  lastMessage?: { text: string; created_at: string } | null;
  request_id?: string;
  created_at: string;
}

interface ChatState {
  messages: Message[];
  activeChatId: string | null;
  isChatOpen: boolean;
  chatsList: ChatPreview[];
  isChatsListOpen: boolean;
  activeChatOtherUser: { id: string; username?: string; avatar_url?: string } | null;
  setChatsListOpen: (isOpen: boolean) => void;
  loadChatsList: (userId: string) => Promise<void>;
  openChat: (chatId: string, otherUser?: { id: string; username?: string; avatar_url?: string }) => void;
  closeChat: () => void;
  subscribeToChat: (chatId: string) => () => void;
  sendMessage: (text: string, senderId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeChatId: null,
  activeChatOtherUser: null,
  isChatOpen: false,
  chatsList: [],
  isChatsListOpen: false,

  setChatsListOpen: (isOpen: boolean) => {
    set({ isChatsListOpen: isOpen });
  },

  loadChatsList: async (userId: string) => {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .or(`user_1.eq.${userId},user_2.eq.${userId}`);

    if (error || !chats) return;

    const otherUserIds = chats.map((c: any) => c.user_1 === userId ? c.user_2 : c.user_1);

    let profilesMap: Record<string, any> = {};
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds);

      profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
    }

    const previews = await Promise.all(chats.map(async (chat: any) => {
      const otherUserId = chat.user_1 === userId ? chat.user_2 : chat.user_1;
      const otherProfile = profilesMap[otherUserId] || { id: otherUserId, username: 'User' };

      const { data: messages } = await supabase
        .from('messages')
        .select('text, created_at')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        id: chat.id,
        otherUser: otherProfile,
        lastMessage: messages?.[0] || null,
        request_id: chat.request_id,
        created_at: chat.created_at
      } as ChatPreview;
    }));

    previews.sort((a, b) => {
      const timeA = a.lastMessage?.created_at || a.created_at;
      const timeB = b.lastMessage?.created_at || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    set({ chatsList: previews });
  },

  openChat: (chatId: string, otherUser?: { id: string; username?: string; avatar_url?: string }) => {
    set({ activeChatId: chatId, isChatOpen: true, activeChatOtherUser: otherUser || null });
  },

  closeChat: () => {
    set({ isChatOpen: false, activeChatId: null, activeChatOtherUser: null, messages: [] });
  },

  subscribeToChat: (chatId: string) => {
    set({ activeChatId: chatId, messages: [] });

    // Загружаем историю
    supabase.from('messages')
      .select(`
        id,
        chat_id,
        sender_id,
        text,
        created_at,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const messagesWithProfiles = data.map((m: any) => ({
            id: m.id,
            chat_id: m.chat_id,
            sender_id: m.sender_id,
            text: m.text,
            created_at: m.created_at,
            status: 'sent' as const,
            sender_username: m.profiles?.username
          }));
          set({ messages: messagesWithProfiles });
        }
      });

    // Подписка на Realtime
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          const currentMessages = get().messages;
          
          // Избегаем дублирования (если сообщение уже было добавлено оптимистично)
          if (!currentMessages.some(m => m.id === newMessage.id)) {
            set((state) => ({ messages: [...state.messages, { ...newMessage, status: 'sent' }] }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  sendMessage: async (text, senderId) => {
    const chatId = get().activeChatId;
    if (!chatId) return;

    // Временный ID для оптимистичного обновления
    const optimisticId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: senderId,
      text,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    // 1. Мгновенно добавляем в стейт (Optimistic Update)
    set((state) => ({ messages: [...state.messages, optimisticMessage] }));

    // 2. Отправляем в Supabase
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: senderId, text }])
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      set((state) => ({
        messages: state.messages.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m)
      }));
    } else {
      // 3. Заменяем временное сообщение реальным из базы данных
      set((state) => ({
        messages: state.messages.map(m => m.id === optimisticId ? { ...data, status: 'sent' } : m)
      }));
    }
  }
}));
