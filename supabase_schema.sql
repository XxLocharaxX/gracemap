-- 1. Создаем таблицу help_requests
CREATE TABLE public.help_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('urgent', 'project', 'prayer')),
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    description TEXT NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'telegram', 'whatsapp')),
    contact_value TEXT NOT NULL,
    prayers_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Разрешаем всем читать данные (Row Level Security - RLS)
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON public.help_requests FOR SELECT 
USING (true);

-- 3. Разрешаем анонимам вставлять данные (писать будем через API, но для удобства оставим)
CREATE POLICY "Allow public insert" 
ON public.help_requests FOR INSERT 
WITH CHECK (true);

-- 4. Включаем Realtime (вебсокеты) для этой таблицы
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
