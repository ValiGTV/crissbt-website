-- Public browser roles receive SELECT only. Row Level Security and the existing
-- "Public can read approved reviews" policy constrain reads to approved rows.
revoke all privileges on table public.reviews
from public, anon, authenticated;

grant select on table public.reviews
to anon, authenticated;

-- The server role receives only the CRUD privileges required for server-side
-- review submission and moderation. Destructive and schema-level privileges
-- such as TRUNCATE, TRIGGER, REFERENCES, and MAINTAIN are intentionally withheld.
revoke all privileges on table public.reviews
from service_role;

grant select, insert, update, delete on table public.reviews
to service_role;
