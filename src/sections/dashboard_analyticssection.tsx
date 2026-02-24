import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Skeleton } from '../components/ui/skeleton';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { DateRange } from 'react-day-picker';

type CountItem = {
  name: string;
  count: number;
};

type LandingVisitItem = {
  label: string;
  sessions: number;
};

type RatedItem = {
  id: string;
  name: string;
  rating_avg: number;
  rating_count: number;
};

type SearchDiscoveryAnalytics = {
  search_volume: number;
  top_destinations: CountItem[];
  filter_usage: CountItem[];
};

type TrafficAcquisitionAnalytics = {
  sessions: number;
  top_landing_pages: LandingVisitItem[];
  top_rated_destinations: RatedItem[];
  top_rated_products: RatedItem[];
};

interface DashboardAnalyticsSectionProps {
  displayName: string;
  userId?: string | null;
}

type DateFilterPreset = '7' | '14' | '30' | 'custom';

const formatDateParam = (date?: Date): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const renderListSkeleton = (count: number) =>
  Array.from({ length: count }).map((_, index) => (
    <li key={`analytics-skeleton-${index}`} className="flex items-center justify-between text-sm gap-3">
      <Skeleton className="h-3 w-2/3 rounded-full" />
      <Skeleton className="h-3 w-12 rounded-full" />
    </li>
  ));

export const DashboardAnalyticsSection: React.FC<DashboardAnalyticsSectionProps> = ({ displayName, userId }) => {
  const shouldReduceMotion = useReducedMotion();
  const [datePreset, setDatePreset] = React.useState<DateFilterPreset>('30');
  const [customRangeDraft, setCustomRangeDraft] = React.useState<DateRange | undefined>();
  const [customRangeApplied, setCustomRangeApplied] = React.useState<DateRange | undefined>();
  const [isCustomModalOpen, setIsCustomModalOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const hasAppliedCustomRange = Boolean(customRangeApplied?.from && customRangeApplied?.to);
  const selectedDays = datePreset === 'custom' ? null : Number(datePreset);
  const customStartDate = datePreset === 'custom' ? formatDateParam(customRangeApplied?.from) : null;
  const customEndDate = datePreset === 'custom' ? formatDateParam(customRangeApplied?.to) : null;
  const shouldFetchAnalytics = Boolean(userId) && (datePreset !== 'custom' || hasAppliedCustomRange);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange as (event: MediaQueryListEvent) => void);
    return () => mediaQuery.removeListener(handleChange as (event: MediaQueryListEvent) => void);
  }, []);

  const { data: searchDiscoveryData, isPending: isSearchDiscoveryPending } = useQuery({
    queryKey: ['analytics', 'search-discovery', userId ?? 'anonymous', selectedDays, customStartDate, customEndDate],
    enabled: shouldFetchAnalytics,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_search_discovery_analytics', {
        p_days: selectedDays ?? 30,
        p_start_date: customStartDate,
        p_end_date: customEndDate,
      });
      if (error) throw error;
      return (data ?? {
        search_volume: 0,
        top_destinations: [],
        filter_usage: [],
      }) as SearchDiscoveryAnalytics;
    },
  });

  const { data: trafficData, isPending: isTrafficPending } = useQuery({
    queryKey: ['analytics', 'traffic-acquisition', userId ?? 'anonymous', selectedDays, customStartDate, customEndDate],
    enabled: shouldFetchAnalytics,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_traffic_acquisition_analytics', {
        p_days: selectedDays ?? 30,
        p_start_date: customStartDate,
        p_end_date: customEndDate,
      });
      if (error) throw error;
      return (data ?? {
        sessions: 0,
        top_landing_pages: [],
        top_rated_destinations: [],
        top_rated_products: [],
      }) as TrafficAcquisitionAnalytics;
    },
  });

  const searchVolume = searchDiscoveryData?.search_volume ?? 0;
  const sessions = trafficData?.sessions ?? 0;
  const topLandingPages = (trafficData?.top_landing_pages ?? []).slice(0, 11);
  const maxLandingSessions = topLandingPages.reduce((max, item) => Math.max(max, item.sessions), 0);
  const isLoading = isSearchDiscoveryPending || isTrafficPending;

  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut' as const, delay: index * 0.05 },
        };
  const getPanelMotion = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut' as const, delay },
        };
  return (
    <section id="analytics-overview">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-semibold">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground">Here is a quick overview of your travel analytics.</p>
        </div>

        <div className="md:ml-auto md:self-start flex justify-end">
          <select
            value={datePreset}
            onChange={(event) => {
              const nextValue = event.target.value as DateFilterPreset;
              if (nextValue === 'custom') {
                setCustomRangeDraft(customRangeApplied);
                setIsCustomModalOpen(true);
                return;
              }

              setDatePreset(nextValue);
            }}
            className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Select analytics date range"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="custom">Custom date range</option>
          </select>
        </div>
      </div>

      <div id="key-metrics" className="grid gap-4 sm:grid-cols-2">
        {
          [
            { label: 'Sessions', value: sessions.toLocaleString() },
            { label: 'Search Volume', value: searchVolume.toLocaleString() },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="rounded-2xl glass-card-nonmodal p-4"
              {...getItemMotion(index)}
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                {isLoading ? <Skeleton className="h-8 w-24 rounded-md" /> : <span className="text-2xl font-semibold">{stat.value}</span>}
              </div>
            </motion.div>
          ))
        }
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <motion.div
          id="traffic-acquisition"
          className="rounded-2xl glass-card-nonmodal p-6"
          {...getPanelMotion(0.08)}
        >
          <h2 className="text-lg font-semibold mb-4">Traffic & Acquisition</h2>
          <h3 className="text-sm text-muted-foreground mb-4">Most Visits (Top 10 + Others)</h3>
          <div className="space-y-3">
            {isLoading ? (
              <ul className="space-y-3">{renderListSkeleton(8)}</ul>
            ) : topLandingPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No traffic data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topLandingPages}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={190}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
                    formatter={(value) => value}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    fill={(entry) => {
                      if (entry.label === 'Others') return '#cbd5e1';
                      return '#14b8a6';
                    }}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          id="search-discovery"
          className="rounded-2xl glass-card-nonmodal p-6"
          {...getPanelMotion(0.14)}
        >
          <h2 className="text-lg font-semibold mb-4">Search & Discovery</h2>
          <div className="grid gap-5">
            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Top Destinations (searched)</h3>
              <ul className="space-y-2">
                {isLoading
                  ? renderListSkeleton(6)
                  : (searchDiscoveryData?.top_destinations ?? []).slice(0, 6).map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.name}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Filter Usage</h3>
              <ul className="space-y-2">
                {isLoading
                  ? renderListSkeleton(6)
                  : (searchDiscoveryData?.filter_usage ?? []).slice(0, 6).map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <motion.div
          id="top-rated-destinations"
          className="rounded-2xl glass-card-nonmodal p-6"
          {...getPanelMotion(0.16)}
        >
          <h2 className="text-lg font-semibold mb-4">Top Rated Destinations</h2>
          <ul className="space-y-2">
            {isLoading
              ? renderListSkeleton(5)
              : (trafficData?.top_rated_destinations ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm gap-3">
                <span className="truncate">{item.name}</span>
                <span className="text-muted-foreground shrink-0">{Number(item.rating_avg).toFixed(2)} ({item.rating_count})</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          id="top-rated-products"
          className="rounded-2xl glass-card-nonmodal p-6"
          {...getPanelMotion(0.2)}
        >
          <h2 className="text-lg font-semibold mb-4">Top Rated Products</h2>
          <ul className="space-y-2">
            {isLoading
              ? renderListSkeleton(5)
              : (trafficData?.top_rated_products ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm gap-3">
                <span className="truncate">{item.name}</span>
                <span className="text-muted-foreground shrink-0">{Number(item.rating_avg).toFixed(2)} ({item.rating_count})</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {isCustomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setIsCustomModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl glass-card-nonmodal p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-date-range-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <h3 id="custom-date-range-title" className="text-xl font-semibold">Custom Date Range</h3>
                <p className="text-sm text-muted-foreground">Pick a start and end date.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsCustomModalOpen(false)}>
                Close
              </Button>
            </div>

            <Calendar
              mode="range"
              selected={customRangeDraft}
              onSelect={(range) => setCustomRangeDraft(range)}
              numberOfMonths={isMobile ? 1 : 2}
              disabled={{ after: new Date() }}
              className="w-full **:data-[range-start=true]:bg-teal-600 **:data-[range-start=true]:text-white **:data-[range-end=true]:bg-teal-600 **:data-[range-end=true]:text-white **:data-[range-middle=true]:bg-teal-500/30 **:data-[selected-single=true]:bg-teal-600 **:data-[selected-single=true]:text-white"
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCustomRangeDraft(customRangeApplied);
                  setIsCustomModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!customRangeDraft?.from || !customRangeDraft?.to) return;
                  setCustomRangeApplied(customRangeDraft);
                  setDatePreset('custom');
                  setIsCustomModalOpen(false);
                }}
                disabled={!customRangeDraft?.from || !customRangeDraft?.to}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
