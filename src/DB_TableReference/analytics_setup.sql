create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null,
  user_id uuid null references auth.users (id) on delete set null,
  event_name text not null,
  page_path text null,
  source text null,
  medium text null,
  landing_path text null,
  search_query text null,
  search_scope text null,
  search_result_count integer null,
  filters jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  constraint analytics_events_event_name_check
    check (event_name in ('page_view', 'search_performed', 'filter_used'))
);

create or replace function public.normalize_analytics_event()
returns trigger
language plpgsql
as $$
begin
  new.page_path := nullif(trim(coalesce(new.page_path, '')), '');
  new.landing_path := nullif(trim(coalesce(new.landing_path, '')), '');
  new.source := lower(nullif(trim(coalesce(new.source, '')), ''));
  new.medium := lower(nullif(trim(coalesce(new.medium, '')), ''));
  new.search_scope := lower(nullif(trim(coalesce(new.search_scope, '')), ''));
  new.search_query := lower(nullif(trim(coalesce(new.search_query, '')), ''));
  if new.search_result_count is not null and new.search_result_count < 0 then
    new.search_result_count := 0;
  end if;
  new.filters := coalesce(new.filters, '{}'::jsonb);
  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  return new;
end;
$$;

create or replace function public.reject_owner_analytics()
returns trigger
language plpgsql
as $$
declare
  owner_id text := nullif(coalesce(new.metadata ->> 'owner_id', ''), '');
  user_role text := nullif(coalesce(new.metadata ->> 'user_role', ''), '');
  clean_path text := coalesce(new.page_path, '');
  profile_match text;
begin
  if new.user_id is not null and user_role <> 'tourist' then
    return null;
  end if;

  if clean_path like '/dashboard%' or clean_path like '/admin%' then
    return null;
  end if;

  if new.user_id is not null and owner_id is not null and owner_id = new.user_id::text then
    return null;
  end if;

  profile_match := (regexp_match(clean_path, '^/profile/([^/]+)$'))[1];
  if new.user_id is not null and profile_match is not null and profile_match = new.user_id::text then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists analytics_events_normalize_trigger on public.analytics_events;
create trigger analytics_events_normalize_trigger
before insert or update on public.analytics_events
for each row
execute function public.normalize_analytics_event();

drop trigger if exists analytics_events_guard_trigger on public.analytics_events;
create trigger analytics_events_guard_trigger
before insert on public.analytics_events
for each row
execute function public.reject_owner_analytics();

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_created_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);

create index if not exists analytics_events_page_path_idx
  on public.analytics_events (page_path);

create index if not exists analytics_events_search_query_idx
  on public.analytics_events (search_query)
  where search_query is not null;

alter table public.analytics_events enable row level security;

-- Allow event writes from both anonymous and authenticated clients.
-- If user_id is provided, it must match auth.uid().
drop policy if exists "analytics_events_insert_policy" on public.analytics_events;
create policy "analytics_events_insert_policy"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- No direct select policy for clients. Dashboard reads through RPCs below.

grant insert on public.analytics_events to anon, authenticated;

drop function if exists public.get_search_discovery_analytics(integer);
drop function if exists public.get_search_discovery_analytics(integer, date, date);

create or replace function public.get_search_discovery_analytics(
  p_days integer default 30,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  from_ts timestamptz;
  to_ts timestamptz;
  normalized_start_date date;
  normalized_end_date date;
  volume_count integer := 0;
  no_result_count integer := 0;
  top_searches jsonb := '[]'::jsonb;
  filter_usage jsonb := '[]'::jsonb;
begin
  if p_start_date is not null and p_end_date is not null then
    normalized_start_date := least(p_start_date, p_end_date);
    normalized_end_date := greatest(p_start_date, p_end_date);
    from_ts := normalized_start_date::timestamptz;
    to_ts := (normalized_end_date + 1)::timestamptz;
  else
    from_ts := now() - make_interval(days => greatest(p_days, 1));
    to_ts := now() + interval '1 second';
  end if;

  select count(*)::integer
    into volume_count
  from public.analytics_events
  where event_name = 'search_performed'
    and created_at >= from_ts
    and created_at < to_ts
    and coalesce(search_query, '') <> '';

  select count(*)::integer
    into no_result_count
  from public.analytics_events
  where event_name = 'search_performed'
    and created_at >= from_ts
    and created_at < to_ts
    and coalesce(search_query, '') <> ''
    and coalesce(search_result_count, -1) = 0;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', grouped.name,
        'count', grouped.total_count
      )
      order by grouped.total_count desc, grouped.name asc
    ),
    '[]'::jsonb
  )
  into top_searches
  from (
    select lower(trim(search_query)) as name, count(*)::integer as total_count
    from public.analytics_events
    where event_name = 'search_performed'
      and created_at >= from_ts
      and created_at < to_ts
      and coalesce(search_query, '') <> ''
    group by lower(trim(search_query))
    order by total_count desc, name asc
    limit 8
  ) grouped;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', filter_rows.name,
        'count', filter_rows.total_count
      )
      order by filter_rows.total_count desc, filter_rows.name asc
    ),
    '[]'::jsonb
  )
  into filter_usage
  from (
    select
      coalesce(nullif(filters ->> 'filter_name', ''), 'search_query') as name,
      count(*)::integer as total_count
    from public.analytics_events
    where event_name = 'filter_used'
      and created_at >= from_ts
      and created_at < to_ts
    group by 1
    order by total_count desc, name asc
    limit 8
  ) filter_rows;

  return jsonb_build_object(
    'search_volume', volume_count,
    'no_result_searches', no_result_count,
    'top_destinations', top_searches,
    'filter_usage', filter_usage
  );
end;
$$;

revoke all on function public.get_search_discovery_analytics(integer, date, date) from public;
grant execute on function public.get_search_discovery_analytics(integer, date, date) to authenticated;

drop function if exists public.get_traffic_acquisition_analytics(integer);
drop function if exists public.get_traffic_acquisition_analytics(integer, date, date);

create or replace function public.get_traffic_acquisition_analytics(
  p_days integer default 30,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  from_ts timestamptz;
  to_ts timestamptz;
  normalized_start_date date;
  normalized_end_date date;
  sessions_count integer := 0;
  users_count integer := 0;
  source_medium_rows jsonb := '[]'::jsonb;
  landing_rows jsonb := '[]'::jsonb;
  top_rated_destinations jsonb := '[]'::jsonb;
  top_rated_products jsonb := '[]'::jsonb;
begin
  if p_start_date is not null and p_end_date is not null then
    normalized_start_date := least(p_start_date, p_end_date);
    normalized_end_date := greatest(p_start_date, p_end_date);
    from_ts := normalized_start_date::timestamptz;
    to_ts := (normalized_end_date + 1)::timestamptz;
  else
    from_ts := now() - make_interval(days => greatest(p_days, 1));
    to_ts := now() + interval '1 second';
  end if;

  select count(distinct session_id)::integer
    into sessions_count
  from public.analytics_events
  where event_name = 'page_view'
    and created_at >= from_ts
    and created_at < to_ts;

  select count(distinct user_id)::integer
    into users_count
  from public.analytics_events
  where event_name = 'page_view'
    and created_at >= from_ts
    and created_at < to_ts
    and user_id is not null;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'source', grouped.source,
        'medium', grouped.medium,
        'count', grouped.total_count
      )
      order by grouped.total_count desc, grouped.source asc, grouped.medium asc
    ),
    '[]'::jsonb
  )
  into source_medium_rows
  from (
    select
      coalesce(nullif(source, ''), 'direct') as source,
      coalesce(nullif(medium, ''), 'none') as medium,
      count(*)::integer as total_count
    from public.analytics_events
    where event_name = 'page_view'
      and created_at >= from_ts
      and created_at < to_ts
    group by 1, 2
    order by total_count desc, source asc, medium asc
    limit 8
  ) grouped;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'path', grouped.path,
        'count', grouped.total_count
      )
      order by grouped.total_count desc, grouped.path asc
    ),
    '[]'::jsonb
  )
  into landing_rows
  from (
    select
      coalesce(nullif(landing_path, ''), '/') as path,
      count(*)::integer as total_count
    from public.analytics_events
    where event_name = 'page_view'
      and created_at >= from_ts
      and created_at < to_ts
    group by 1
    order by total_count desc, path asc
    limit 8
  ) grouped;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', rows.id,
        'name', rows.destination_name,
        'rating_avg', rows.rating_avg,
        'rating_count', rows.rating_count
      )
      order by rows.rating_avg desc, rows.rating_count desc
    ),
    '[]'::jsonb
  )
  into top_rated_destinations
  from (
    select d.id, d.destination_name, d.rating_avg, d.rating_count
    from public.destinations d
    where d.rating_count > 0
    order by d.rating_avg desc, d.rating_count desc
    limit 5
  ) rows;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', rows.id,
        'name', rows.product_name,
        'rating_avg', rows.rating_avg,
        'rating_count', rows.rating_count
      )
      order by rows.rating_avg desc, rows.rating_count desc
    ),
    '[]'::jsonb
  )
  into top_rated_products
  from (
    select p.id, p.product_name, coalesce(p.rating_avg, 0)::numeric as rating_avg, coalesce(p.rating_count, 0) as rating_count
    from public.products p
    where coalesce(p.rating_count, 0) > 0
    order by p.rating_avg desc nulls last, p.rating_count desc
    limit 5
  ) rows;

  return jsonb_build_object(
    'sessions', sessions_count,
    'users', users_count,
    'source_medium', source_medium_rows,
    'top_landing_pages', landing_rows,
    'top_rated_destinations', top_rated_destinations,
    'top_rated_products', top_rated_products
  );
end;
$$;

revoke all on function public.get_traffic_acquisition_analytics(integer, date, date) from public;
grant execute on function public.get_traffic_acquisition_analytics(integer, date, date) to authenticated;
