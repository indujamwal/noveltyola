-- =====================================================================
-- Novelty Ola website – Supabase database
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: it only creates what is missing and
-- refreshes the security rules. Seed content is added only if the
-- tables are empty.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Who can use the admin panel (Supabase login emails)
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- Free-form site settings: hero text, contact details, SEO, integrations
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.models (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null default 'scooter' check (type in ('scooter','bike')),
  is_gen3      boolean not null default false,
  tagline      text not null default '',
  emi          text not null default '',      -- e.g. 1,584  (shown as ₹1,584/month)
  price        text not null default '',      -- e.g. 80,999 (shown as ₹80,999)
  image_url    text not null default '',
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  show_in_hero boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.outlets (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  area        text not null default '',
  address     text not null default '',
  phone       text not null default '',
  is_flagship boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null default '',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  icon        text not null default 'service',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.enquiries (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  source         text not null default 'website',
  name           text not null,
  phone          text not null,
  pincode        text not null default '',
  product        text not null default '',
  interest       text not null default '',
  outlet         text not null default '',
  preferred_date text not null default '',
  message        text not null default '',
  page           text not null default '',
  status         text not null default 'new' check (status in ('new','contacted','booked','closed')),
  notes          text not null default ''
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['settings','models','outlets','faqs','services'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Security (Row Level Security)
--   * Visitors can read published content and submit enquiries.
--   * Only emails listed in public.admins can change anything
--     or read enquiries.
-- ---------------------------------------------------------------------

alter table public.admins    enable row level security;
alter table public.settings  enable row level security;
alter table public.models    enable row level security;
alter table public.outlets   enable row level security;
alter table public.faqs      enable row level security;
alter table public.services  enable row level security;
alter table public.enquiries enable row level security;

-- admins
drop policy if exists "admins read"   on public.admins;
drop policy if exists "admins manage" on public.admins;
create policy "admins read"   on public.admins for select to authenticated using (public.is_admin());
create policy "admins manage" on public.admins for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings
drop policy if exists "settings public read" on public.settings;
drop policy if exists "settings admin write" on public.settings;
create policy "settings public read" on public.settings for select to anon, authenticated using (key <> 'private');
create policy "settings admin write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- content tables: public sees active rows, admins see and edit everything
do $$
declare t text;
begin
  foreach t in array array['models','outlets','faqs','services'] loop
    execute format('drop policy if exists "%s public read" on public.%I', t, t);
    execute format('drop policy if exists "%s admin write" on public.%I', t, t);
    execute format('create policy "%s public read" on public.%I for select to anon, authenticated using (is_active or public.is_admin())', t, t);
    execute format('create policy "%s admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- enquiries: anyone can submit a valid one; only admins can read or change
drop policy if exists "enquiries submit" on public.enquiries;
drop policy if exists "enquiries admin"  on public.enquiries;
create policy "enquiries submit" on public.enquiries for insert to anon, authenticated
  with check (
    status = 'new' and notes = ''
    and char_length(name) between 1 and 100
    and phone ~ '^[6-9][0-9]{9}$'
    and char_length(message) <= 1000
    and char_length(pincode) <= 6
  );
create policy "enquiries admin" on public.enquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- table privileges
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.models, public.outlets, public.faqs, public.services to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Image storage: public bucket "site-images", only admins can upload
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site images public read" on storage.objects;
drop policy if exists "site images admin insert" on storage.objects;
drop policy if exists "site images admin update" on storage.objects;
drop policy if exists "site images admin delete" on storage.objects;
create policy "site images public read"  on storage.objects for select to anon, authenticated using (bucket_id = 'site-images');
create policy "site images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-images' and public.is_admin());
create policy "site images admin update" on storage.objects for update to authenticated using (bucket_id = 'site-images' and public.is_admin());
create policy "site images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'site-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- Starting content (copied from the current website). Added only once.
-- ---------------------------------------------------------------------

insert into public.settings (key, value) values
('hero', '{
  "badge": "New Year 2027 Celebrations",
  "pre_title": "Ride into 2027 with",
  "brand_1": "NOVELTY",
  "brand_2": "OLA",
  "sub_line": "Punjab''s Ola Electric dealer · 17 outlets · 11 cities",
  "lead": "Your new Ola is waiting at Novelty Ola. Walk into your nearest outlet for New Year offers, easy EMI, a fair exchange on your old two-wheeler and a free test ride, with service handled by our own team after you ride home.",
  "trust": ["17 outlets in 11 cities", "Free test ride", "Easy EMI", "Service under one roof"],
  "cta_primary": "Get New Year Offer →",
  "cta_secondary": "Find your Novelty Ola outlet",
  "tag_title": "New Year deliveries",
  "tag_sub": "Book now at Novelty Ola",
  "big_text": "2027",
  "countdown_on": true,
  "countdown_label": "Countdown to 2027",
  "countdown_target": "2027-01-01T00:00:00+05:30",
  "countdown_done": "Happy New Year 2027!",
  "popup_title": "New Year offers on your new Ola",
  "popup_sub": "Share your details and our team will call you with the best price, EMI and exchange offer.",
  "popup_auto_open": true,
  "popup_delay_seconds": 2.5
}'::jsonb),
('business', '{
  "phone_display": "+91 70873 00431",
  "phone": "917087300431",
  "whatsapp": "917087300431",
  "address": "Batala Road, Opposite Bank of India, Vijay Nagar, Opposite Pillar No. 20, Amritsar, Punjab 143001",
  "hours": "10:00 AM – 7:00 PM",
  "outlet_numbers": "Jalandhar: 76650 04436\nAll other outlets: 76650 04458",
  "outlets_count": "17",
  "cities_count": "11",
  "about_title": "A name Punjab already trusts, now electric.",
  "about_p1": "Novelty Group has sold and serviced vehicles across Punjab for years through Novelty Tata, Novelty Hyundai, Novelty Mahindra and our TVS and Ather two-wheeler outlets.",
  "about_p2": "Novelty Ola brings that same team and that same after-sales care to Ola Electric. Walk in for a test ride, get finance and insurance done at the counter, and ride home the same week.",
  "models_note": "Starting prices are ex-showroom. Monthly EMI amounts are indicative and depend on the finance scheme, down payment and tenure. Prices, offers and EMI are subject to change, so ask us for today''s on-road price."
}'::jsonb),
('integrations', '{
  "google_script_url": "https://script.google.com/macros/s/AKfycbwlc95V4DsDLvJzQarfW_qpt-UPcuy61Hm5PESaZnJnOB_tr20HwR48snmxBgY_41yQ1A/exec"
}'::jsonb),
('seo', '{
  "title": "Novelty Ola",
  "description": "Novelty Ola — authorised Ola Electric dealer in Punjab. Ola S1 scooters and Roadster motorcycles, test rides, finance and service across 17 outlets in 11 cities."
}'::jsonb)
on conflict (key) do nothing;

insert into public.models (name, type, is_gen3, tagline, emi, price, image_url, sort_order, show_in_hero)
select * from (values
  ('S1 Pro+',     'scooter', true,  'Our most powerful scooter yet',          '2,870', '1,49,999', '/assets/models/s1-pro-plus.jpg',     10, true),
  ('S1 Pro',      'scooter', true,  'Pure Power. Peak Performance',           '2,237', '1,30,999', '/assets/models/s1-pro.jpg',          20, true),
  ('S1 X+',       'scooter', true,  'Scooter for every Indian',               '1,831', '1,21,999', '/assets/models/s1-x-plus.jpg',       30, true),
  ('S1 X',        'scooter', true,  'Upgrade to electric with style',         '1,584', '80,999',   '/assets/models/s1-x.jpg',            40, true),
  ('S1 Z',        'scooter', false, 'Zyada in every aspect',                  '',      '79,999',   '/assets/models/s1-z.jpg',            50, true),
  ('Roadster X',  'bike',    false, 'Upgrade to electric with style',         '',      '95,280',   '/assets/models/roadster-x.jpg',      60, true),
  ('Roadster X+', 'bike',    false, 'India''s ultimate electric upgrade',     '',      '1,23,999', '/assets/models/roadster-x-plus.jpg', 70, false)
) v(name, type, is_gen3, tagline, emi, price, image_url, sort_order, show_in_hero)
where not exists (select 1 from public.models);

insert into public.outlets (city, area, phone, is_flagship, sort_order)
select * from (values
  ('Amritsar',   'Flagship showroom · Batala Road, Vijay Nagar', '7665004458', true,  10),
  ('Jalandhar',  '', '7665004436', false, 20),
  ('Ludhiana',   '', '7665004458', false, 30),
  ('Batala',     '', '7665004458', false, 40),
  ('Tarn Taran', '', '7665004458', false, 50),
  ('Hoshiarpur', '', '7665004458', false, 60),
  ('Kapurthala', '', '7665004458', false, 70),
  ('Moga',       '', '7665004458', false, 80),
  ('Khanna',     '', '7665004458', false, 90),
  ('Jagraon',    '', '7665004458', false, 100),
  ('Samrala',    '', '7665004458', false, 110)
) v(city, area, phone, is_flagship, sort_order)
where not exists (select 1 from public.outlets);

insert into public.faqs (question, answer, sort_order)
select * from (values
  ('Can I charge an Ola at home?', 'Yes. Ola scooters and motorcycles charge from a regular home socket with the charger provided. Most riders charge overnight, the same way they charge a phone.', 10),
  ('How much does it cost to run an Ola?', 'Usually a fraction of petrol. Use the savings calculator above with your own daily distance and electricity rate for an estimate.', 20),
  ('Do you offer finance and EMI?', 'Yes. We arrange finance with leading banks and NBFCs at the showroom. Bring your Aadhaar, PAN and address proof and we''ll handle the rest.', 30),
  ('Can I exchange my petrol scooter?', 'Yes. Bring your old two-wheeler to any Novelty Ola outlet. We''ll value it on the spot and adjust it against your new Ola.', 40),
  ('What about the warranty on the battery?', 'Battery and vehicle warranty depends on the model and variant you choose. Our team will walk you through the exact coverage before you book.', 50),
  ('Where do I get my Ola serviced?', 'Novelty Ola handles periodic service, software updates and repairs. Book a service through the form below or call us.', 60)
) v(question, answer, sort_order)
where not exists (select 1 from public.faqs);

insert into public.services (title, description, icon, sort_order)
select * from (values
  ('Free test rides', 'Ride any model at the showroom before you decide.', 'testride', 10),
  ('Easy finance & EMI', 'Low down payment options with leading banks and NBFCs, with paperwork done at the counter.', 'finance', 20),
  ('Exchange your old two-wheeler', 'Fair value for your petrol scooter or bike, adjusted against your new Ola.', 'exchange', 30),
  ('Insurance', 'New policies at delivery and hassle-free renewals every year.', 'insurance', 40),
  ('Service & repairs', 'Periodic service, software updates and battery health checks by trained technicians.', 'service', 50),
  ('Home charging setup', 'We explain charging, the Ola app and every riding mode on delivery day.', 'charging', 60)
) v(title, description, icon, sort_order)
where not exists (select 1 from public.services);

-- ---------------------------------------------------------------------
-- FIRST ADMIN: replace the email below with your own login email,
-- then run just these two lines again.
-- ---------------------------------------------------------------------
insert into public.admins (email) values ('admin@noveltyola.com')
on conflict (email) do nothing;
