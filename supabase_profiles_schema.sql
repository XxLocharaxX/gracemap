-- 1. Включаем расширение для регистронезависимого текста (если еще не включено)
create extension if not exists citext;

-- 2. Создаем таблицу профилей
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username citext unique,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ограничение: юзернейм должен быть от 3 до 15 символов, только английские/русские буквы, цифры и подчёркивание
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 15),
  constraint username_format check (username ~ '^[a-zA-Z0-9а-яА-Я_]+$')
);

-- 3. Включаем Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 4. Создаем политики безопасности (RLS Policies)
create policy "Публичные профили видимы всем" on public.profiles
  for select using (true);

create policy "Пользователи могут обновлять только свой профиль" on public.profiles
  for update using (auth.uid() = id);

-- 5. Функция-триггер для автоматического создания профиля при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    -- Генерируем временный никнейм вроде user_a1b2c3
    'user_' || substring(md5(random()::text) from 1 for 6)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 6. Привязываем триггер к таблице auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Заполняем профили для УЖЕ существующих пользователей
insert into public.profiles (id, username)
select id, 'user_' || substring(md5(random()::text) from 1 for 6) from auth.users
where not exists (
    select 1 from public.profiles where profiles.id = auth.users.id
);
