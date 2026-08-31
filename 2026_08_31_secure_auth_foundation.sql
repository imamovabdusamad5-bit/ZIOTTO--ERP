-- ProERP secure authentication foundation
-- Run this migration in Supabase before deploying the matching frontend changes.

alter table public.profiles
    add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
    add column if not exists login_email text,
    add column if not exists attendance_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_auth_user_id_key
    on public.profiles (auth_user_id)
    where auth_user_id is not null;

create unique index if not exists profiles_login_email_key
    on public.profiles (lower(login_email))
    where login_email is not null;

create unique index if not exists profiles_attendance_token_key
    on public.profiles (attendance_token);

-- Existing employees must be linked manually after their Supabase Auth users are created:
-- update public.profiles set auth_user_id = '<auth.users.id>', login_email = '<email>' where id = '<profile.id>';
-- Do not use unique_code as a password or as attendance QR content after this migration.
