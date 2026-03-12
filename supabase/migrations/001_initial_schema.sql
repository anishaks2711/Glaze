-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('freelancer', 'client')),
  full_name   text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
-- The role and full_name are expected as user_metadata fields.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
-- 2. FREELANCER_SERVICES
-- ============================================================
create table if not exists public.freelancer_services (
  id            uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  service_name  text not null,
  created_at    timestamptz not null default now()
);

alter table public.freelancer_services enable row level security;

create policy "Services are viewable by everyone"
  on public.freelancer_services for select
  using (true);

create policy "Freelancers can insert their own services"
  on public.freelancer_services for insert
  with check (auth.uid() = freelancer_id);

create policy "Freelancers can delete their own services"
  on public.freelancer_services for delete
  using (auth.uid() = freelancer_id);


-- ============================================================
-- 3. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  client_id     uuid not null references public.profiles (id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  text_content  text,
  media_url     text,
  media_type    text check (media_type in ('image', 'video')),
  created_at    timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Authenticated clients can insert reviews"
  on public.reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
  );


-- ============================================================
-- 4. STORAGE — review-media bucket
-- ============================================================
-- Run this block AFTER the tables above.
-- Note: bucket creation via SQL requires the storage schema to exist.
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

-- Allow anyone to read objects in the bucket
create policy "Public read access for review-media"
  on storage.objects for select
  using (bucket_id = 'review-media');

-- Allow authenticated users to upload
create policy "Authenticated users can upload review media"
  on storage.objects for insert
  with check (
    bucket_id = 'review-media'
    and auth.role() = 'authenticated'
  );

-- Allow uploaders to delete their own files
create policy "Users can delete their own review media"
  on storage.objects for delete
  using (
    bucket_id = 'review-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
