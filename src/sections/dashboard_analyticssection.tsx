import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Skeleton } from '../components/ui/skeleton';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

type TopSearchedItem = CountItem & {
  type?: 'destination' | 'product';
};

type SearchDiscoveryAnalytics = {
  search_volume: number;
  top_destinations: CountItem[];
  top_searched: TopSearchedItem[];
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
      if (error) {
        console.error('get_search_discovery_analytics RPC failed', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          params: {
            p_days: selectedDays ?? 30,
            p_start_date: customStartDate,
            p_end_date: customEndDate,
          },
        });
        throw error;
      }
      return (data ?? {
        search_volume: 0,
        top_destinations: [],
        top_searched: [],
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
      if (error) {
        console.error('get_traffic_acquisition_analytics RPC failed', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          params: {
            p_days: selectedDays ?? 30,
            p_start_date: customStartDate,
            p_end_date: customEndDate,
          },
        });
        throw error;
      }
      return (data ?? {
        sessions: 0,
        top_landing_pages: [],
        top_rated_destinations: [],
        top_rated_products: [],
      }) as TrafficAcquisitionAnalytics;
    },
  });

  const searchVolume = searchDiscoveryData?.search_volume ?? 0;
  const topLandingPages = (trafficData?.top_landing_pages ?? []).slice(0, 11);
  const totalTrafficAcquisitionSessions = (trafficData?.top_landing_pages ?? []).reduce(
    (sum, item) => sum + (Number(item.sessions) || 0),
    0,
  );
  const tealBarShades = ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#10b981'];
  const tealBarHighlights = ['#a5b4fc', '#c4b5fd', '#d8b4fe', '#93c5fd', '#67e8f9', '#6ee7b7'];
  const topLandingPagesWithFill = topLandingPages.map((item, index) => ({
    ...item,
    sessions: Number(item.sessions) || 0,
    fill: item.label === 'Others' ? '#2dd4bf' : tealBarShades[index % tealBarShades.length],
    highlight: item.label === 'Others' ? '#99f6e4' : tealBarHighlights[index % tealBarHighlights.length],
    gradientId: `traffic-bar-gradient-${index}`,
  }));
  const chartLabelWidth = isMobile ? 58 : 84;
  const removeTrafficPrefix = (value: string) => value.replace(/^(destination|product)\s*:\s*/i, '').trim();
  const formatLandingLabel = (value: string) => {
    const cleanedLabel = removeTrafficPrefix(value);
    return cleanedLabel.split(/\s+/)[0] || cleanedLabel;
  };
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
            { label: 'Sessions', value: totalTrafficAcquisitionSessions.toLocaleString() },
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
          <div>
            {isLoading ? (
              <ul className="space-y-3">{renderListSkeleton(8)}</ul>
            ) : topLandingPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No traffic data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(280, topLandingPages.length * 32)}>
                <BarChart
                  data={topLandingPagesWithFill}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: -6, bottom: 8 }}
                  barCategoryGap="12%"
                >
                  <defs>
                    {topLandingPagesWithFill.map((entry) => (
                      <linearGradient
                        key={entry.gradientId}
                        id={entry.gradientId}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor={entry.fill} stopOpacity={0.9} />
                        <stop offset="50%" stopColor={entry.highlight} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={chartLabelWidth}
                    tick={{ fontSize: 14, fill: '#ffffff' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={2}
                    interval={0}
                    tickFormatter={formatLandingLabel}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                    formatter={(value) => value}
                    labelFormatter={(label) => removeTrafficPrefix(String(label))}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 500 }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    fill="#6366f1"
                    fillOpacity={1}
                    radius={6}
                  >
                    {topLandingPagesWithFill.map((entry) => (
                      <Cell
                        key={`landing-page-${entry.label}`}
                        fill={`url(#${entry.gradientId})`}
                        fillOpacity={1}
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                      />
                    ))}
                  </Bar>
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
              <h3 className="text-sm text-muted-foreground mb-3">Top Searched</h3>
              <ul className="space-y-2">
                {isLoading
                  ? renderListSkeleton(6)
                  : (searchDiscoveryData?.top_searched ?? searchDiscoveryData?.top_destinations ?? []).slice(0, 6).map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{item.name}</span>
                      {(item as TopSearchedItem).type && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-muted-foreground capitalize">
                          {(item as TopSearchedItem).type}
                        </span>
                      )}
                    </div>
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
