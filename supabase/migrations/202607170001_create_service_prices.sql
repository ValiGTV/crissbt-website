create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_group text not null,
  service_key text not null unique,
  title_ro text not null,
  title_en text not null,
  description_ro text,
  description_en text,
  duration_minutes integer,
  session_price_ron integer not null,
  package_sessions integer,
  package_price_ron integer,
  audience text,
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_email text,
  constraint service_prices_group_check check (service_group in ('bowen', 'massage')),
  constraint service_prices_session_price_check check (session_price_ron > 0),
  constraint service_prices_duration_check check (duration_minutes is null or duration_minutes > 0),
  constraint service_prices_package_sessions_check check (package_sessions is null or package_sessions > 0),
  constraint service_prices_package_price_check check (package_price_ron is null or package_price_ron > 0),
  constraint service_prices_package_pair_check check ((package_sessions is null) = (package_price_ron is null)),
  constraint service_prices_display_order_check check (display_order >= 0)
);

create index service_prices_service_group_idx on public.service_prices (service_group);
create index service_prices_display_order_idx on public.service_prices (display_order);
create index service_prices_is_active_idx on public.service_prices (is_active);

create or replace function public.set_service_prices_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger service_prices_set_updated_at
before update on public.service_prices
for each row execute function public.set_service_prices_updated_at();

alter table public.service_prices enable row level security;

create policy "Public can read active service prices"
on public.service_prices
for select
to anon, authenticated
using (is_active = true);

-- Browser roles receive SELECT only, and RLS constrains those reads to active rows.
revoke all privileges on table public.service_prices from public, anon, authenticated;
grant select on table public.service_prices to anon, authenticated;

-- The server role receives only CRUD required by the protected price APIs.
-- TRUNCATE, TRIGGER, REFERENCES, MAINTAIN, and schema-level privileges are withheld.
revoke all privileges on table public.service_prices from service_role;
grant select, insert, update, delete on table public.service_prices to service_role;

revoke all on function public.set_service_prices_updated_at() from public, anon, authenticated;

insert into public.service_prices
  (service_group, service_key, title_ro, title_en, duration_minutes, session_price_ron, package_sessions, package_price_ron, audience, display_order)
values
  ('bowen', 'bowen_adult', 'Adult', 'Adult', null, 150, null, null, 'adult', 1),
  ('bowen', 'bowen_child', 'Copil', 'Child', null, 80, null, null, 'child', 2),
  ('massage', 'facial_massage', 'Masaj facial', 'Facial massage', 50, 200, 6, 1000, 'general', 1),
  ('massage', 'relaxation_massage', 'Masaj de relaxare', 'Relaxation massage', 50, 150, 10, 1200, 'general', 2),
  ('massage', 'therapeutic_massage', 'Masaj terapeutic', 'Therapeutic massage', 50, 150, 10, 1200, 'general', 3),
  ('massage', 'reflexology_30', 'Reflexoterapie', 'Reflexology', 30, 60, 10, 480, 'general', 4),
  ('massage', 'reflexology_50', 'Reflexoterapie', 'Reflexology', 50, 100, 10, 800, 'general', 5);
