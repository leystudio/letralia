-- Letralia: ejecutar en Supabase SQL Editor.
create table if not exists public.parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free','premium')),
  created_at timestamptz not null default now()
);
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade default auth.uid(),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 24),
  avatar text not null default 'fox' check (avatar in ('fox','lion','rabbit','panda','tiger','unicorn')),
  age_band text not null check (age_band in ('4-5','6-7','8+')),
  created_at timestamptz not null default now()
);
create table if not exists public.progress (
  child_id uuid primary key references public.children(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.progress enable row level security;
drop policy if exists "parents own row" on public.parents;
create policy "parents own row" on public.parents for select to authenticated using (id = (select auth.uid()));
drop policy if exists "children belong to parent" on public.children;
create policy "children belong to parent" on public.children for all to authenticated using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
drop policy if exists "progress belongs to parent" on public.progress;
create policy "progress belongs to parent" on public.progress for all to authenticated
  using (exists (select 1 from public.children c where c.id = progress.child_id and c.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.children c where c.id = progress.child_id and c.parent_id = (select auth.uid())));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.parents (id,email) values (new.id, coalesce(new.email,''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
  for each row execute procedure public.handle_new_user();
insert into public.parents (id,email)
  select id, coalesce(email,'') from auth.users
  on conflict (id) do update set email = excluded.email;
grant select on public.parents to authenticated;
grant select, insert, update, delete on public.children, public.progress to authenticated;

-- Importación única y atómica; bloquear la fila del padre evita importar a dos niños.
alter table public.parents add column if not exists guest_imported_at timestamptz;
create index if not exists children_parent_id_idx on public.children(parent_id);
alter table public.progress drop constraint if exists progress_object;
alter table public.progress add constraint progress_object check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1048576);

create or replace function public.stamp_progress() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists stamp_progress on public.progress;
create trigger stamp_progress before insert or update on public.progress for each row execute function public.stamp_progress();

create or replace function public.initialize_child_progress(target_child uuid, guest_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  parent_uuid uuid := auth.uid();
  previous_import timestamptz;
  saved jsonb;
  candidate jsonb;
  inserted boolean;
  imported boolean := false;
begin
  if parent_uuid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select guest_imported_at into previous_import from public.parents where id = parent_uuid for update;
  if not found then raise exception 'Parent not found' using errcode = '42501'; end if;
  if not exists (select 1 from public.children where id = target_child and parent_id = parent_uuid) then
    raise exception 'Profile not found' using errcode = '42501';
  end if;
  if jsonb_typeof(guest_data) <> 'object' or octet_length(guest_data::text) > 1048576 or guest_data is null then
    raise exception 'Invalid progress' using errcode = '22023';
  end if;
  select data into saved from public.progress where child_id = target_child for update;
  if saved is null or saved = '{}'::jsonb then
    if previous_import is null and guest_data <> '{}'::jsonb and not exists (
      select 1 from public.progress p join public.children c on c.id=p.child_id
      where c.parent_id=parent_uuid and p.data <> '{}'::jsonb
    ) then saved := guest_data; imported := true;
    else saved := coalesce(saved, '{}'::jsonb); end if;
    candidate := saved;
    insert into public.progress(child_id,data) values(target_child,candidate)
      on conflict (child_id) do nothing;
    inserted := found;
    if not inserted then
      update public.progress set data=candidate where child_id=target_child and data='{}'::jsonb;
      imported := imported and found;
    end if;
    select data into saved from public.progress where child_id=target_child;
  end if;
  update public.parents set guest_imported_at=coalesce(guest_imported_at,now()) where id=parent_uuid;
  return jsonb_build_object('data',saved,'imported',imported);
end;
$$;

-- The client may read its parent's row, but may never edit plan/email or create parents.
revoke all on public.parents, public.children, public.progress from anon, authenticated;
grant select on public.parents to authenticated;
grant select, insert, update, delete on public.children, public.progress to authenticated;
revoke all on function public.initialize_child_progress(uuid,jsonb) from public, anon;
grant execute on function public.initialize_child_progress(uuid,jsonb) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.stamp_progress() from public, anon, authenticated;
