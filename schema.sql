-- Supabase Schema for Borjoun Rewards Platform

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users Table
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  role text default 'user', -- 'user' or 'admin'
  wallet_balance decimal(12, 2) default 0.00,
  total_earned decimal(12, 2) default 0.00,
  daily_streak integer default 0,
  last_claim_date timestamp with time zone,
  referral_code text unique,
  referred_by uuid references public.users(id),
  status text default 'active', -- 'active', 'suspended', 'banned'
  created_at timestamp with time zone default now()
);

-- Withdrawals Table
create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount decimal(12, 2) not null,
  method text not null,
  details text not null,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  transaction_reference text,
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Deposits Table
create table if not exists public.deposits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount decimal(12, 2) not null,
  status text default 'awaiting_details', -- 'awaiting_details', 'awaiting_payment', 'pending_approval', 'approved', 'rejected'
  admin_instructions text,
  receipt_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Support Tickets Table
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status text default 'open', -- 'open', 'resolved', 'closed'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ticket Messages Table
create table if not exists public.ticket_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  message text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.ticket_messages enable row level security;
create policy "Users can view messages on their own tickets" on public.ticket_messages
  for select using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );
create policy "Users can insert messages on their own tickets" on public.ticket_messages
  for insert with check (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
    and is_admin = false
  );

-- Postback History / Conversions Table
create table if not exists public.conversions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  offerwall text not null,
  offer_id text not null,
  amount decimal(12, 2) not null,
  transaction_id text unique not null,
  ip_address text,
  status text default 'completed',
  created_at timestamp with time zone default now()
);

-- User Auth Trigger
-- This automatically inserts a row into public.users when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_code text;
  referred_by_id uuid;
begin
  -- Generate a random referral code (e.g. BOR-1A2B3C)
  ref_code := 'BOR-' || upper(substr(md5(random()::text), 1, 6));
  
  -- Resolve referring user if referral_code is provided in metadata
  if new.raw_user_meta_data->>'referral_code' is not null then
    select id into referred_by_id from public.users where referral_code = new.raw_user_meta_data->>'referral_code' limit 1;
  end if;

  insert into public.users (id, email, username, referral_code, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    ref_code,
    referred_by_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security (RLS) Policies
alter table public.users enable row level security;
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

alter table public.withdrawals enable row level security;
create policy "Users can view their own withdrawals" on public.withdrawals for select using (auth.uid() = user_id);
create policy "Users can insert their own withdrawals" on public.withdrawals for insert with check (auth.uid() = user_id);

alter table public.deposits enable row level security;
create policy "Users can view their own deposits" on public.deposits for select using (auth.uid() = user_id);
create policy "Users can insert their own deposits" on public.deposits for insert with check (auth.uid() = user_id);
create policy "Users can update their own deposits" on public.deposits for update using (auth.uid() = user_id);

alter table public.support_tickets enable row level security;
create policy "Users can view their own tickets" on public.support_tickets for select using (auth.uid() = user_id);
create policy "Users can create their own tickets" on public.support_tickets for insert with check (auth.uid() = user_id);

alter table public.conversions enable row level security;
create policy "Users can view their own conversions" on public.conversions for select using (auth.uid() = user_id);

-- Offerwalls Configuration Table
create table if not exists public.offerwalls (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  identifier text unique not null,
  api_key text,
  api_secret text,
  app_id text,
  iframe_url text not null,
  multiplier decimal(4, 2) default 1.00,
  is_enabled boolean default false,
  geo_restrictions text[] default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS for offerwalls
alter table public.offerwalls enable row level security;
create policy "Allow read access to offerwalls for authenticated users" on public.offerwalls
  for select using (auth.uid() is not null);


-- ----------------------------------------------------
-- Coupons System Tables
-- ----------------------------------------------------

-- Settings for Coupons
create table if not exists public.coupon_settings (
  id integer primary key default 1,
  timer_duration integer default 60,
  max_coupon_value integer default 200,
  daily_limit integer default 2,
  coupon_system_enabled boolean default true,
  winners_per_day integer default 5,
  coupon_value integer default 50
);

-- Seed initial coupon settings
insert into public.coupon_settings (id) values (1) on conflict (id) do nothing;

-- Draw Rounds
create table if not exists public.draw_rounds (
  id serial primary key,
  is_active boolean default true,
  cycle_start_date timestamp with time zone default now(),
  cycle_end_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Draw Entries (Linked to users table)
create table if not exists public.draw_entries (
  id serial primary key,
  user_id uuid references public.users(id) on delete set null,
  phone text,
  round_id integer references public.draw_rounds(id) on delete cascade,
  status text default 'WAITING', -- 'WAITING', 'COMPLETED', 'FORFEITED'
  is_winner boolean default false,
  coupon_code text,
  coupon_value integer,
  started_at timestamp with time zone default now(),
  last_heartbeat timestamp with time zone default now(),
  drawn_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, round_id), -- A user can only enter a round once
  unique(phone, round_id)    -- A phone can only enter a round once
);

-- Image Advertisements
create table if not exists public.advertisements (
  id serial primary key,
  image_url text not null,
  caption text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Dynamic Ads (HTML/Scripts)
create table if not exists public.dynamic_ads (
  id serial primary key,
  title text,
  html_code text,
  target_link text,
  placement text not null, -- 'Homepage', 'Coupons Page', 'Both'
  is_active boolean default true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  views integer default 0,
  clicks integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS for Coupons
alter table public.draw_entries enable row level security;
create policy "Users can view their own entries" on public.draw_entries for select using (auth.uid() = user_id);
create policy "Users can insert their own entries" on public.draw_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own entries" on public.draw_entries for update using (auth.uid() = user_id);

alter table public.coupon_settings enable row level security;
create policy "Anyone can view coupon settings" on public.coupon_settings for select using (true);

alter table public.draw_rounds enable row level security;
create policy "Anyone can view draw rounds" on public.draw_rounds for select using (true);

alter table public.advertisements enable row level security;
create policy "Anyone can view ads" on public.advertisements for select using (true);

alter table public.dynamic_ads enable row level security;
create policy "Anyone can view dynamic ads" on public.dynamic_ads for select using (true);
