create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.reviews (
  id uuid primary key default gen_random_uuid(), reviewer_name text not null,
  service_type text not null, rating smallint not null, review_text text not null,
  visit_date date null, language text not null default 'ro', status text not null default 'pending',
  consent_given boolean not null, submitted_at timestamptz not null default now(),
  approved_at timestamptz null, rejected_at timestamptz null, moderation_note text null,
  constraint reviews_rating_check check (rating between 1 and 5),
  constraint reviews_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint reviews_language_check check (language in ('ro', 'en')),
  constraint reviews_name_length_check check (char_length(reviewer_name) between 2 and 80),
  constraint reviews_text_length_check check (char_length(review_text) between 20 and 1000),
  constraint reviews_consent_check check (consent_given is true),
  constraint reviews_service_check check (service_type in ('bowen','facial_massage','relaxation_massage','therapeutic_massage','reflexology'))
);

create index reviews_status_submitted_idx on public.reviews (status, submitted_at desc);
create index reviews_approved_at_idx on public.reviews (approved_at desc);
create index reviews_service_type_idx on public.reviews (service_type);
alter table public.reviews enable row level security;
create policy "Public can read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved');
revoke insert, update, delete on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

create table private.review_submission_limits (
  id bigint generated always as identity primary key, ip_hash text not null,
  submitted_at timestamptz not null default now()
);
create index review_submission_limits_lookup_idx on private.review_submission_limits (ip_hash, submitted_at desc);

create table private.admin_auth_attempts (
  id bigint generated always as identity primary key, identifier_hash text not null,
  attempted_at timestamptz not null default now()
);
create index admin_auth_attempts_lookup_idx on private.admin_auth_attempts (identifier_hash, attempted_at desc);

create or replace function public.submit_pending_review(
  p_ip_hash text, p_reviewer_name text, p_service_type text, p_rating smallint,
  p_review_text text, p_visit_date date, p_language text, p_consent_given boolean
) returns boolean language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  delete from private.review_submission_limits where id in (
    select id from private.review_submission_limits where submitted_at < now() - interval '24 hours' order by submitted_at limit 500
  );
  if (select count(*) from private.review_submission_limits where ip_hash = p_ip_hash and submitted_at >= now() - interval '1 hour') >= 3 then
    return false;
  end if;
  insert into public.reviews (reviewer_name, service_type, rating, review_text, visit_date, language, status, consent_given)
  values (p_reviewer_name, p_service_type, p_rating, p_review_text, p_visit_date, p_language, 'pending', p_consent_given);
  insert into private.review_submission_limits (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

create or replace function public.record_admin_auth_failure(p_identifier_hash text)
returns boolean language plpgsql security definer set search_path = private, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_identifier_hash, 0));
  delete from private.admin_auth_attempts where id in (
    select id from private.admin_auth_attempts where attempted_at < now() - interval '24 hours' order by attempted_at limit 500
  );
  if (select count(*) from private.admin_auth_attempts where identifier_hash = p_identifier_hash and attempted_at >= now() - interval '15 minutes') >= 5 then
    return false;
  end if;
  insert into private.admin_auth_attempts (identifier_hash) values (p_identifier_hash);
  return true;
end;
$$;

revoke all on private.review_submission_limits, private.admin_auth_attempts from public, anon, authenticated;
revoke execute on function public.submit_pending_review(text,text,text,smallint,text,date,text,boolean) from public, anon, authenticated;
revoke execute on function public.record_admin_auth_failure(text) from public, anon, authenticated;
grant execute on function public.submit_pending_review(text,text,text,smallint,text,date,text,boolean) to service_role;
grant execute on function public.record_admin_auth_failure(text) to service_role;
