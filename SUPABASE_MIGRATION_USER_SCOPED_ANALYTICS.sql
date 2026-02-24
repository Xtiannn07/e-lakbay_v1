-- ============================================================================
-- SUPABASE MIGRATION: User-scoped Analytics with Top 10 + Others Landing Pages
-- ============================================================================
-- Apply this file in Supabase SQL Editor to update analytics functions.
-- Safe to run multiple times (uses DROP IF EXISTS).

-- Step 1: Update search discovery RPC to filter by current user
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
    and (
      (user_id is not null and user_id = auth.uid())
      or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
    )
    and coalesce(search_query, '') <> '';

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
      and (
        (user_id is not null and user_id = auth.uid())
        or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
      )
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
      and (
        (user_id is not null and user_id = auth.uid())
        or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
      )
    group by 1
    order by total_count desc, name asc
    limit 8
  ) filter_rows;

  return jsonb_build_object(
    'search_volume', volume_count,
    'top_destinations', top_searches,
    'filter_usage', filter_usage
  );
end;
$$;

revoke all on function public.get_search_discovery_analytics(integer, date, date) from public;
grant execute on function public.get_search_discovery_analytics(integer, date, date) to authenticated;

-- Step 2: Update traffic acquisition RPC with user-scoped top 10 + Others landing pages
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
    and created_at < to_ts
    and (
      (user_id is not null and user_id = auth.uid())
      or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
    );

  with landing_categories as (
    select
      case
        when page_path ilike 'modal:destination:%' then 'Destination'
        when page_path ilike 'modal:product:%' then 'Product'
        when page_path ilike '/destinations%' then 'Destinations'
        when page_path ilike '/products%' then 'Products'
        when page_path ilike '/profile/%' then 'Profiles'
        when page_path ilike '/home%' or page_path = '/' then 'Home'
        else 'Other Pages'
      end as category,
      count(distinct session_id)::integer as category_sessions,
      row_number() over (order by count(distinct session_id) desc) as rank_pos
    from public.analytics_events
    where event_name = 'page_view'
      and created_at >= from_ts
      and created_at < to_ts
      and (
        (user_id is not null and user_id = auth.uid())
        or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
      )
    group by category
  ),
  landing_aggregated as (
    select
      case when rank_pos <= 10 then category else 'Others' end as label,
      sum(category_sessions)::integer as sessions
    from landing_categories
    group by case when rank_pos <= 10 then category else 'Others' end
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', label,
        'sessions', sessions
      )
      order by sessions desc, label asc
    ),
    '[]'::jsonb
  )
  into landing_rows
  from landing_aggregated;

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
      and d.user_id = auth.uid()
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
      and p.user_id = auth.uid()
    order by p.rating_avg desc nulls last, p.rating_count desc
    limit 5
  ) rows;

  return jsonb_build_object(
    'sessions', sessions_count,
    'top_landing_pages', landing_rows,
    'top_rated_destinations', top_rated_destinations,
    'top_rated_products', top_rated_products
  );
end;
$$;

revoke all on function public.get_traffic_acquisition_analytics(integer, date, date) from public;
grant execute on function public.get_traffic_acquisition_analytics(integer, date, date) to authenticated;
