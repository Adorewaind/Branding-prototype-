-- Crew call-out coverage.
-- Managers (logged-in users) own a location, its staff and its shifts via RLS.
-- Staff have no account: each gets a private link token, and every staff
-- action goes through a SECURITY DEFINER function that checks that token.

create table public.crew_locations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create index crew_locations_owner_idx on public.crew_locations(owner_id);

create table public.crew_staff (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.crew_locations(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  phone text check (phone is null or length(phone) <= 20),
  roles text[] not null default '{}',
  token uuid not null unique default gen_random_uuid(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index crew_staff_location_idx on public.crew_staff(location_id);

create table public.crew_shifts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.crew_locations(id) on delete cascade,
  role text not null check (length(role) between 1 and 40),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  called_out_staff_id uuid references public.crew_staff(id) on delete set null,
  covered_by_staff_id uuid references public.crew_staff(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'covered', 'cancelled')),
  bonus numeric(8,2) not null default 0 check (bonus >= 0),
  note text check (note is null or length(note) <= 280),
  source text not null default 'manager' check (source in ('manager', 'staff')),
  covered_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index crew_shifts_location_idx on public.crew_shifts(location_id, starts_at);
create index crew_shifts_called_out_idx on public.crew_shifts(called_out_staff_id);
create index crew_shifts_covered_by_idx on public.crew_shifts(covered_by_staff_id);

alter table public.crew_locations enable row level security;
alter table public.crew_staff enable row level security;
alter table public.crew_shifts enable row level security;

create policy "Owners manage their locations" on public.crew_locations
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners manage their staff" on public.crew_staff
  for all to authenticated
  using (exists (select 1 from public.crew_locations l where l.id = location_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.crew_locations l where l.id = location_id and l.owner_id = (select auth.uid())));

create policy "Owners manage their shifts" on public.crew_shifts
  for all to authenticated
  using (exists (select 1 from public.crew_locations l where l.id = location_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.crew_locations l where l.id = location_id and l.owner_id = (select auth.uid())));

-- What a staff member sees on their private link.
create or replace function public.crew_staff_view(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  s public.crew_staff;
  loc_name text;
begin
  select * into s from public.crew_staff where token = p_token and active;
  if not found then
    return null;
  end if;
  select name into loc_name from public.crew_locations where id = s.location_id;

  return jsonb_build_object(
    'name', s.name,
    'roles', to_jsonb(s.roles),
    'location', loc_name,
    'open_shifts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sh.id, 'role', sh.role, 'starts_at', sh.starts_at, 'ends_at', sh.ends_at,
        'bonus', sh.bonus, 'note', sh.note) order by sh.starts_at)
      from public.crew_shifts sh
      where sh.location_id = s.location_id
        and sh.status = 'open'
        and sh.ends_at > now()
        and sh.called_out_staff_id is distinct from s.id
        and (cardinality(s.roles) = 0 or sh.role = any(s.roles))
    ), '[]'::jsonb),
    'my_covers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sh.id, 'role', sh.role, 'starts_at', sh.starts_at, 'ends_at', sh.ends_at, 'bonus', sh.bonus)
        order by sh.starts_at)
      from public.crew_shifts sh
      where sh.covered_by_staff_id = s.id and sh.status = 'covered' and sh.ends_at > now()
    ), '[]'::jsonb),
    'my_callouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sh.id, 'role', sh.role, 'starts_at', sh.starts_at, 'ends_at', sh.ends_at, 'status', sh.status)
        order by sh.starts_at)
      from public.crew_shifts sh
      where sh.called_out_staff_id = s.id and sh.status <> 'cancelled' and sh.ends_at > now()
    ), '[]'::jsonb)
  );
end;
$$;

-- First person to claim an open shift gets it. The status check in the
-- UPDATE makes this safe when two people tap at the same moment.
create or replace function public.crew_claim_shift(p_token uuid, p_shift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.crew_staff;
  claimed uuid;
begin
  select * into s from public.crew_staff where token = p_token and active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'This link is no longer active. Ask your manager for a new one.');
  end if;

  update public.crew_shifts sh
     set status = 'covered', covered_by_staff_id = s.id, covered_at = now()
   where sh.id = p_shift_id
     and sh.location_id = s.location_id
     and sh.status = 'open'
     and sh.ends_at > now()
     and sh.called_out_staff_id is distinct from s.id
     and (cardinality(s.roles) = 0 or sh.role = any(s.roles))
  returning sh.id into claimed;

  if claimed is null then
    return jsonb_build_object('ok', false, 'message', 'Someone already grabbed this shift.');
  end if;
  return jsonb_build_object('ok', true, 'message', 'It''s yours! Your manager can see you''re covering.');
end;
$$;

-- A staff member calls out; the shift is posted as open for the crew.
create or replace function public.crew_call_out(
  p_token uuid, p_role text, p_starts_at timestamptz, p_ends_at timestamptz, p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.crew_staff;
  open_count int;
begin
  select * into s from public.crew_staff where token = p_token and active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'This link is no longer active. Ask your manager for a new one.');
  end if;
  if p_role is null or length(trim(p_role)) = 0 or length(p_role) > 40 then
    return jsonb_build_object('ok', false, 'message', 'Pick your position.');
  end if;
  if p_ends_at <= p_starts_at or p_ends_at - p_starts_at > interval '16 hours' then
    return jsonb_build_object('ok', false, 'message', 'Check the start and end times.');
  end if;
  if p_ends_at < now() or p_starts_at > now() + interval '30 days' then
    return jsonb_build_object('ok', false, 'message', 'That shift is too far in the past or future.');
  end if;

  select count(*) into open_count from public.crew_shifts
   where called_out_staff_id = s.id and status = 'open' and ends_at > now();
  if open_count >= 5 then
    return jsonb_build_object('ok', false, 'message', 'You already have 5 open call-outs. Talk to your manager.');
  end if;

  insert into public.crew_shifts (location_id, role, starts_at, ends_at, called_out_staff_id, note, source)
  values (s.location_id, trim(p_role), p_starts_at, p_ends_at, s.id, nullif(left(trim(coalesce(p_note, '')), 280), ''), 'staff');

  return jsonb_build_object('ok', true, 'message', 'Call-out posted. Your manager and crew can see it.');
end;
$$;

revoke all on function public.crew_staff_view(uuid) from public;
revoke all on function public.crew_claim_shift(uuid, uuid) from public;
revoke all on function public.crew_call_out(uuid, text, timestamptz, timestamptz, text) from public;
grant execute on function public.crew_staff_view(uuid) to anon, authenticated;
grant execute on function public.crew_claim_shift(uuid, uuid) to anon, authenticated;
grant execute on function public.crew_call_out(uuid, text, timestamptz, timestamptz, text) to anon, authenticated;
