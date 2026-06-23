-- 1. Таблица комнат чата (chats)
CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Уникальный индекс, чтобы не создавать дубликаты чатов
    UNIQUE(user_1, user_2, request_id)
);

-- 2. Таблица сообщений (messages)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Включаем Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Политики для chats (пользователь может видеть и создавать чат только если он участник)
CREATE POLICY "Users can view their own chats"
ON public.chats FOR SELECT
USING (auth.uid() = user_1 OR auth.uid() = user_2);

CREATE POLICY "Users can insert chats they belong to"
ON public.chats FOR INSERT
WITH CHECK (auth.uid() = user_1 OR auth.uid() = user_2);

-- 5. RLS Политики для messages (можно видеть и писать сообщения только в свои чаты)
CREATE POLICY "Users can view messages in their chats"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chats 
        WHERE chats.id = messages.chat_id 
        AND (chats.user_1 = auth.uid() OR chats.user_2 = auth.uid())
    )
);

CREATE POLICY "Users can insert messages in their chats"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.chats 
        WHERE chats.id = messages.chat_id 
        AND (chats.user_1 = auth.uid() OR chats.user_2 = auth.uid())
    )
);

-- 6. Включаем Realtime для таблицы сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
