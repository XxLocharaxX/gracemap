-- 1. Добавляем колонку image_url в таблицу сообщений
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Создаем бакет для хранения картинок чата (если еще нет)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Разрешаем публичный доступ на чтение картинок
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_media');

-- 4. Разрешаем авторизованным пользователям загружать картинки
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'chat_media' 
    AND auth.role() = 'authenticated'
);

-- 5. Разрешаем пользователям удалять свои собственные загруженные картинки (опционально)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (auth.uid() = owner);
