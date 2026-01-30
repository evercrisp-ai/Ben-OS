/**
 * 5.2.2 Code Splitting - Dynamic imports for heavy components
 * 
 * This module provides lazy-loaded versions of heavy components
 * to reduce initial bundle size and improve First Contentful Paint.
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback for charts
const ChartSkeleton = () => (
  <div className="w-full h-[300px] rounded-lg border bg-card">
    <div className="p-4 border-b">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="p-4">
      <Skeleton className="h-[220px] w-full" />
    </div>
  </div>
);

// Loading fallback for Kanban board
const BoardSkeleton = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b">
      <Skeleton className="h-8 w-48" />
    </div>
    <div className="flex gap-4 p-4 overflow-x-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-72 shrink-0">
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-24 w-full mb-2" />
          <Skeleton className="h-24 w-full mb-2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Loading fallback for PRD Editor
const EditorSkeleton = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b flex items-center justify-between">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <div className="p-6 space-y-6 max-w-3xl mx-auto w-full">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Loading fallback for dashboard
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

// ============================================
// Lazy-loaded Charts (Recharts is ~100KB+)
// ============================================

export const LazyBurndownChart = dynamic(
  () => import('@/components/charts/BurndownChart').then((mod) => mod.BurndownChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyBurnupChart = dynamic(
  () => import('@/components/charts/BurnupChart').then((mod) => mod.BurnupChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyVelocityChart = dynamic(
  () => import('@/components/charts/VelocityChart').then((mod) => mod.VelocityChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyAreaDistributionChart = dynamic(
  () => import('@/components/charts/AreaDistributionChart').then((mod) => mod.AreaDistributionChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyActivityHeatmap = dynamic(
  () => import('@/components/charts/ActivityHeatmap').then((mod) => mod.ActivityHeatmap),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyGoalProgressBars = dynamic(
  () => import('@/components/charts/GoalProgressBars').then((mod) => mod.GoalProgressBars),
  { loading: () => <ChartSkeleton />, ssr: false }
);

// ============================================
// Lazy-loaded Kanban Board (DnD Kit is ~50KB+)
// ============================================

export const LazyBoard = dynamic(
  () => import('@/components/kanban/Board').then((mod) => mod.Board),
  { loading: () => <BoardSkeleton />, ssr: false }
);

export const LazyCardDetailPanel = dynamic(
  () => import('@/components/kanban/CardDetailPanel').then((mod) => mod.CardDetailPanel),
  { loading: () => null, ssr: false }
);

// ============================================
// Lazy-loaded PRD Editor
// ============================================

export const LazyPRDEditor = dynamic(
  () => import('@/components/prd/PRDEditor').then((mod) => mod.PRDEditor),
  { loading: () => <EditorSkeleton />, ssr: false }
);

export const LazyPRDVersionHistory = dynamic(
  () => import('@/components/prd/PRDVersionHistory').then((mod) => mod.PRDVersionHistory),
  { loading: () => <Skeleton className="h-8 w-24" />, ssr: false }
);

// ============================================
// Lazy-loaded Dashboard
// ============================================

export const LazyDashboard = dynamic(
  () => import('@/components/dashboard/Dashboard').then((mod) => mod.Dashboard),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

// ============================================
// Lazy-loaded Reports
// ============================================

export const LazyReportViewer = dynamic(
  () => import('@/components/reports/ReportViewer').then((mod) => mod.ReportViewer),
  { loading: () => <EditorSkeleton />, ssr: false }
);

// ============================================
// Lazy-loaded Activity Viewer
// ============================================

export const LazyActivityViewer = dynamic(
  () => import('@/components/activity/ActivityViewer').then((mod) => mod.ActivityViewer),
  { loading: () => <Skeleton className="h-96 w-full" />, ssr: false }
);
