-- ============================================================================
-- MIGRATION: Add FK columns for destination/product and update analytics
-- ============================================================================

-- Step 1: Add destination_id and product_id columns with foreign keys
alter table public.analytics_events
add column if not exists destination_id uuid null,
add column if not exists product_id uuid null;

-- Drop constraints if they exist, then recreate them
alter table public.analytics_events
drop constraint if exists analytics_events_destination_id_fkey;

alter table public.analytics_events
drop constraint if exists analytics_events_product_id_fkey;

-- Add the constraints fresh
alter table public.analytics_events
add constraint analytics_events_destination_id_fkey 
  foreign key (destination_id) 
  references public.destinations(id) on delete set null;

alter table public.analytics_events
add constraint analytics_events_product_id_fkey 
  foreign key (product_id) 
  references public.products(id) on delete set null;

create index if not exists analytics_events_destination_idx on public.analytics_events(destination_id);
create index if not exists analytics_events_product_idx on public.analytics_events(product_id);

-- Step 2: Update traffic acquisition RPC to show specific items instead of generic categories
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

  -- Get most visited specific destinations and products (not generic categories)
  with landing_items as (
    select
      case
        when destination_id is not null then 'destination:' || coalesce(d.destination_name, 'Unknown Destination')
        when product_id is not null then 'product:' || coalesce(p.product_name, 'Unknown Product')
        when page_path = '/' then 'Home'
        when page_path ilike '/destinations%' then 'Destinations Page'
        when page_path ilike '/products%' then 'Products Page'
        when page_path ilike '/profile/%' then 'Profile Page'
        else coalesce(page_path, 'Other')
      end as label,
      count(distinct session_id)::integer as item_sessions,
      row_number() over (order by count(distinct session_id) desc) as rank_pos
    from public.analytics_events
    left join public.destinations d on analytics_events.destination_id = d.id
    left join public.products p on analytics_events.product_id = p.id
    where event_name = 'page_view'
      and created_at >= from_ts
      and created_at < to_ts
      and (
        (user_id is not null and user_id = auth.uid())
        or coalesce(nullif(metadata ->> 'owner_id', ''), '') = coalesce(auth.uid()::text, '__no_auth__')
      )
    group by label
  ),
  landing_ranked as (
    select
      case when rank_pos <= 10 then label else 'Others' end as final_label,
      sum(item_sessions)::integer as sessions
    from landing_items
    group by case when rank_pos <= 10 then label else 'Others' end
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', final_label,
        'sessions', sessions
      )
      order by sessions desc, final_label asc
    ),
    '[]'::jsonb
  )
  into landing_rows
  from landing_ranked;

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

-- Step 3: Keep search discovery RPC as-is (already user-scoped and working)
-- No changes needed for get_search_discovery_analytics
