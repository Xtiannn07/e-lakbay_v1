import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface DashboardAnalyticsSectionProps {
  displayName: string;
}

export const DashboardAnalyticsSection: React.FC<DashboardAnalyticsSectionProps> = ({ displayName }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.05 },
        };
  const getPanelMotion = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut', delay },
        };
  return (
    <section id="analytics-overview">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold">Welcome back, {displayName}</h1>
        <p className="text-white/70">Here is a quick overview of your travel analytics.</p>
      </div>

      <div id="key-metrics" className="grid gap-4 sm:grid-cols-2">
        {
          [
            { label: 'Monthly Visitors', value: '12.4k', delta: '+8.2%' },
            { label: 'Engagement', value: '68%', delta: '+2.9%' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="rounded-2xl bg-white/5 border border-white/10 p-4"
              {...getItemMotion(index)}
            >
              <p className="text-sm text-white/60">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-semibold">{stat.value}</span>
                <span className="text-sm text-emerald-300">{stat.delta}</span>
              </div>
            </motion.div>
          ))
        }
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          id="visitor-trends"
          className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6"
          {...getPanelMotion(0.08)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Visitor Trends</h2>
            <span className="text-xs text-white/60">Last 7 days</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {[40, 68, 52, 80, 64, 92, 76].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-teal-500 to-sky-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] text-white/50">Day {index + 1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          id="top-destinations"
          className="rounded-2xl bg-white/5 border border-white/10 p-6"
          {...getPanelMotion(0.14)}
        >
          <h2 className="text-lg font-semibold mb-4">Top Destinations</h2>
          <ul className="space-y-3">
            {[
              { name: 'Vigan Heritage', value: 82 },
              { name: 'Candon Beach', value: 64 },
              { name: 'Tagudin Trail', value: 52 },
              { name: 'San Vicente Cove', value: 39 },
            ].map((item) => (
              <li key={item.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-white/60">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};
