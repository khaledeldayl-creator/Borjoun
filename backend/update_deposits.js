require('dotenv').config();
const db = require('./db');

const depositsSql = `
create table if not exists public.deposits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount decimal(12, 2) not null,
  status text default 'awaiting_details',
  admin_instructions text,
  receipt_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'deposits'
        AND policyname = 'Users can view their own deposits'
    ) THEN
        CREATE POLICY "Users can view their own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'deposits'
        AND policyname = 'Users can insert their own deposits'
    ) THEN
        CREATE POLICY "Users can insert their own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'deposits'
        AND policyname = 'Users can update their own deposits'
    ) THEN
        CREATE POLICY "Users can update their own deposits" ON public.deposits FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
`;

db.query(depositsSql)
  .then(() => {
    console.log('Deposits table added successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error adding deposits table:', err);
    process.exit(1);
  });
