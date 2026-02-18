export interface StressTestConfig {
  // Stress Mode Defaults
  stressMode: {
    scrollIterations: number; // Number of times to scroll through lists
    networkThrottle: number; // Simulate slow network (delay in ms per request)
    forceRefetch: boolean; // Force refetch all queries to test loading states
    clearCache: boolean; // Clear React Query cache before testing
    monitorMemory: boolean; // Track memory usage during tests
    waitTimeAfterNavigation: number; // Wait time after navigating to screen (ms)
    waitTimeBetweenTests: number; // Wait time between test screens (ms)
    waitTimeAfterScroll: number; // Wait time after each scroll action (ms)
  };

  // Performance Mode Defaults (lighter testing)
  performanceMode: {
    scrollIterations: number;
    networkThrottle: number;
    forceRefetch: boolean;
    clearCache: boolean;
    monitorMemory: boolean;
    waitTimeAfterNavigation: number;
    waitTimeBetweenTests: number;
    waitTimeAfterScroll: number;
  };

  // Performance Standards
  performanceStandards: {
    maxAvgRenderTime: number; // Average render time threshold (ms) - 60 FPS = 16ms
    maxMaxRenderTime: number; // Maximum render time threshold (ms)
    maxSlowRenderPercentage: number; // Percentage of slow renders allowed (%)
  };

  // Scroll Testing
  scrollTesting: {
    scrollDistance: number; // Distance to scroll (pixels)
    scrollToEndEnabled: boolean; // Whether to test scroll to end
    scrollRetryAttempts: number; // Number of retries to wait for scroll refs
    scrollRetryDelay: number; // Delay between retry attempts (ms)
  };

  // Detail Screen Testing
  detailScreenTesting: {
    enabled: boolean; // Whether to test detail screens
    waitTimeAfterNavigation: number; // Wait time after navigating to detail (ms)
    waitTimeAfterBack: number; // Wait time after going back (ms)
    waitTimeForFlows: number; // Extra wait time for Flows detail (ms) - flows need to load data
  };

  // Tab Testing
  tabTesting: {
    enabled: boolean; // Whether to test tab navigation
    waitTimeBetweenTabs: number; // Wait time between tab switches (ms)
  };
}

export const STRESS_TEST_CONFIG: StressTestConfig = {
  stressMode: {
    scrollIterations: 3,
    networkThrottle: 2000, // 2 second delay per request
    forceRefetch: true,
    clearCache: true,
    monitorMemory: true,
    waitTimeAfterNavigation: 8000, // Longer wait for throttled network
    waitTimeBetweenTests: 2000,
    waitTimeAfterScroll: 2000,
  },
  performanceMode: {
    scrollIterations: 1,
    networkThrottle: 0, // No throttling
    forceRefetch: false,
    clearCache: false,
    monitorMemory: false,
    waitTimeAfterNavigation: 5000,
    waitTimeBetweenTests: 1000,
    waitTimeAfterScroll: 1000,
  },
  performanceStandards: {
    maxAvgRenderTime: 16, // 60 FPS threshold
    maxMaxRenderTime: 100,
    maxSlowRenderPercentage: 20,
  },
  scrollTesting: {
    scrollDistance: 500,
    scrollToEndEnabled: true,
    scrollRetryAttempts: 5,
    scrollRetryDelay: 500,
  },
  detailScreenTesting: {
    enabled: true,
    waitTimeAfterNavigation: 5000, // Increased for flows and other async detail screens
    waitTimeAfterBack: 1000,
    waitTimeForFlows: 15000, // Extra wait for flows which need to load definition/instance (flows take longer to fetch)
  },
  tabTesting: {
    enabled: true,
    waitTimeBetweenTabs: 2000,
  },
};
