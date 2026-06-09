require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);
const couponsRoutes = require('./routes/coupons');
app.use('/api', couponsRoutes);

// Database initialization
const db = require('./db');
const initDb = async () => {
  try {
    // 1. Offerwalls Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.offerwalls (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        name text NOT NULL,
        identifier text UNIQUE NOT NULL,
        api_key text,
        api_secret text,
        app_id text,
        iframe_url text NOT NULL,
        multiplier decimal(4, 2) DEFAULT 1.00,
        is_enabled boolean DEFAULT false,
        geo_restrictions text[] DEFAULT '{}',
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // 2. Settings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.admin_settings (
        key text PRIMARY KEY,
        value text NOT NULL
      );
    `);

    // Seed default settings
    await db.query(`
      INSERT INTO public.admin_settings (key, value) VALUES
      ('min_withdrawal', '1000'),
      ('referral_percentage', '10'),
      ('maintenance_mode', 'false'),
      ('seo_title', 'Borjoun - Next-Gen Rewards Protocol'),
      ('seo_description', 'Unlock the ultimate earning potential. Complete high-value tasks and withdraw cash instantly.')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 3. Audit Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        admin_username text NOT NULL,
        action text NOT NULL,
        details text,
        ip_address text,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // 4. CMS Blocks Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.cms_blocks (
        key text PRIMARY KEY,
        content text NOT NULL
      );
    `);

    // Seed default CMS content
    await db.query(`
      INSERT INTO public.cms_blocks (key, content) VALUES
      ('landing_headline', 'اربح المكافآت بذكاء مع برجون'),
      ('landing_subtitle', 'افتح الباب لأقصى أرباح ممكنة. أكمل العروض وتفاعل واسحب أرباحك فوراً إلى محفظتك المفضلة.'),
      ('faq_content', '[{"q":"كيف يمكنني البدء؟","a":"سجل حساباً مجانياً ثم ابدأ في إكمال العروض من صفحة العروض."},{"q":"ما هو الحد الأدنى للسحب؟","a":"الحد الأدنى للسحب هو 1000 نقطة فقط."}]'),
      ('terms_content', 'الشروط والأحكام الخاصة بنظام مكافآت برجون...'),
      ('privacy_content', 'سياسة الخصوصية وحماية بيانات المستخدمين...')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 5. Fraud Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.fraud_logs (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        username text,
        ip_address text,
        country text,
        risk_score integer DEFAULT 0,
        is_vpn boolean DEFAULT false,
        is_proxy boolean DEFAULT false,
        detection_reason text,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // 5b. Add missing columns to withdrawals if they don't exist
    await db.query(`ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS transaction_reference text`);
    await db.query(`ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS admin_notes text`);

    // 5c. Ticket Messages Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.ticket_messages (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
        message text NOT NULL,
        is_admin boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
      );
    `);

    // 6. Coupons System Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.coupon_settings (
        id integer PRIMARY KEY DEFAULT 1,
        timer_duration integer DEFAULT 60,
        max_coupon_value integer DEFAULT 200,
        daily_limit integer DEFAULT 2,
        coupon_system_enabled boolean DEFAULT true,
        winners_per_day integer DEFAULT 5,
        coupon_value integer DEFAULT 50
      );

      INSERT INTO public.coupon_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS public.draw_rounds (
        id serial PRIMARY KEY,
        is_active boolean DEFAULT true,
        cycle_start_date timestamp with time zone DEFAULT now(),
        cycle_end_date timestamp with time zone,
        created_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.draw_entries (
        id serial PRIMARY KEY,
        user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        phone text,
        round_id integer REFERENCES public.draw_rounds(id) ON DELETE CASCADE,
        status text DEFAULT 'WAITING',
        is_winner boolean DEFAULT false,
        coupon_code text,
        coupon_value integer,
        started_at timestamp with time zone DEFAULT now(),
        last_heartbeat timestamp with time zone DEFAULT now(),
        drawn_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(user_id, round_id),
        UNIQUE(phone, round_id)
      );

      CREATE TABLE IF NOT EXISTS public.advertisements (
        id serial PRIMARY KEY,
        image_url text NOT NULL,
        caption text,
        is_active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.dynamic_ads (
        id serial PRIMARY KEY,
        title text,
        html_code text,
        target_link text,
        placement text NOT NULL,
        is_active boolean DEFAULT true,
        start_date timestamp with time zone,
        end_date timestamp with time zone,
        views integer DEFAULT 0,
        clicks integer DEFAULT 0,
        created_at timestamp with time zone DEFAULT now()
      );
    `);


  } catch (err) {
    console.error('Error seeding admin tables in Supabase:', err);
  }
};
initDb();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
