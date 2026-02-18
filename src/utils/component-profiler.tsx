/**
 * Component Profiler
 *
 * Wraps components with React Profiler to measure render performance
 * without modifying component code.
 */

import React, { Profiler, ProfilerOnRenderCallback, ReactNode } from "react";

export interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  renderTimes: number[];
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalRenderTime: number;
  slowRenders: number; // Renders > 16ms (60 FPS threshold)
}

const metricsMap = new Map<string, ComponentMetrics>();

const profilerCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (!metricsMap.has(id)) {
    metricsMap.set(id, {
      componentName: id,
      renderCount: 0,
      renderTimes: [],
      avgRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity,
      totalRenderTime: 0,
      slowRenders: 0,
    });
  }

  const metrics = metricsMap.get(id)!;
  metrics.renderCount++;
  metrics.renderTimes.push(actualDuration);
  metrics.totalRenderTime += actualDuration;
  metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount;
  metrics.maxRenderTime = Math.max(metrics.maxRenderTime, actualDuration);
  metrics.minRenderTime = Math.min(metrics.minRenderTime, actualDuration);

  if (actualDuration > 16) {
    metrics.slowRenders++;
  }
};

interface ComponentProfilerProps {
  componentName: string;
  children: ReactNode;
  enabled?: boolean;
}

export function ComponentProfiler({
  componentName,
  children,
  enabled = __DEV__,
}: ComponentProfilerProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={componentName} onRender={profilerCallback}>
      {children}
    </Profiler>
  );
}

export function getComponentMetrics(
  componentName: string
): ComponentMetrics | null {
  return metricsMap.get(componentName) || null;
}

export function getAllMetrics(): Map<string, ComponentMetrics> {
  return new Map(metricsMap);
}

export function resetMetrics(componentName?: string): void {
  if (componentName) {
    metricsMap.delete(componentName);
  } else {
    metricsMap.clear();
  }
}
