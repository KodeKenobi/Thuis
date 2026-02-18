/**
 * Detail Screen Navigation Helpers
 *
 * Helps navigate to detail screens for testing
 */

import { queryClient } from "@/config/react-query";
import { TestTarget } from "./stress-test-runner";

export async function getFirstItemFromCache(
  target: TestTarget
): Promise<any | null> {
  if (!target.queryKey) return null;

  try {
    // Special handling for Repairs Screen which can render either MaintanancesContainer or CasesListContainer
    if (target.name === "Repairs Screen") {
      // First try maintenance queries (for MaintanancesContainer)
      const cache = queryClient.getQueryCache();
      const maintQueries = cache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length >= 2 &&
            key[0] === "maintananceDetails" &&
            key[1] === "relatie"
          );
        },
      });
      for (const query of maintQueries) {
        const data = query.state.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
      }
      
      // If no maintenance found, try cases queries (for CasesListContainer)
      const subsets = ["all", "open", "closed"];
      for (const subset of subsets) {
        const queryKey = ["cases", { subset }];
        const cachedData = queryClient.getQueryData(queryKey);
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          return cachedData[0];
        }
      }
      
      return null;
    }

    // For News List, useFetchLocalNews uses dynamic query keys based on tenant/corporation
    // Try to find any tenantNews or generalNews query that has data
    if (target.name === "News List") {
      const cache = queryClient.getQueryCache();
      const newsQueries = cache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length >= 1 &&
            (key[0] === "tenantNews" || key[0] === "generalNews")
          );
        },
      });
      
      console.log(
        `[DetailScreen] Found ${newsQueries.length} news queries in cache for News List`
      );
      
      // Try to find a query with data
      for (const query of newsQueries) {
        const data = query.state.data;
        const state = query.state.status;
        console.log(
          `[DetailScreen] News query key: ${JSON.stringify(query.queryKey)}, status: ${state}, hasData: ${Array.isArray(data) && data.length > 0}`
        );
        if (Array.isArray(data) && data.length > 0) {
          console.log(
            `[DetailScreen] Found news item from query: ${JSON.stringify(query.queryKey)}`
          );
          return data[0];
        }
      }
      
      // Also try the generalNews query key directly
      const generalNewsData = queryClient.getQueryData(["generalNews"]);
      if (Array.isArray(generalNewsData) && generalNewsData.length > 0) {
        console.log(
          `[DetailScreen] Found news item from direct generalNews query`
        );
        return generalNewsData[0];
      }
      
      console.warn(
        `[DetailScreen] No news items found in cache for News List. Searched ${newsQueries.length} queries.`
      );
      return null;
    }

    // For Cases List with tabs, try all possible subsets
    // Also check maintenance queries in case MaintanancesContainer is rendered instead
    if (target.name === "Cases List" && target.tabs) {
      // First try cases queries
      const subsets = ["all", "open", "closed"];
      for (const subset of subsets) {
        const queryKey = ["cases", { subset }];
        const cachedData = queryClient.getQueryData(queryKey);
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          return cachedData[0];
        }
      }

      // If no cases found, try maintenance queries (MaintanancesContainer might be rendered)
      // Maintenance uses useQueries with keys like ["maintananceDetails", "relatie", contractId, ...]
      // We need to find all queries and flatten the data like the hook does
      const cache = queryClient.getQueryCache();
      const maintQueries = cache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length >= 2 &&
            key[0] === "maintananceDetails" &&
            key[1] === "relatie"
          );
        },
      });

      // Flatten all maintenance data from all queries (like useFetchMaintenanceForRelatie does)
      const allMaintenanceData: any[] = [];
      for (const query of maintQueries) {
        const data = query.state.data;
        if (Array.isArray(data) && data.length > 0) {
          allMaintenanceData.push(...data);
        }
      }

      if (allMaintenanceData.length > 0) {
        return allMaintenanceData[0];
      }

      return null;
    }

    const cachedData = queryClient.getQueryData(target.queryKey);

    if (Array.isArray(cachedData) && cachedData.length > 0) {
      // For posts, data might be grouped by month - check if it's a section structure
      const firstItem = cachedData[0];
      if (
        firstItem &&
        typeof firstItem === "object" &&
        "data" in firstItem &&
        Array.isArray(firstItem.data)
      ) {
        // This is grouped data (like posts grouped by month)
        if (firstItem.data.length > 0) {
          return firstItem.data[0];
        }
      } else {
        // Regular array
        return firstItem;
      }
    }

    if (cachedData && typeof cachedData === "object") {
      // Handle cases where data is nested
      if (
        "items" in cachedData &&
        Array.isArray((cachedData as any).items) &&
        (cachedData as any).items.length > 0
      ) {
        return (cachedData as any).items[0];
      }

      // Handle sectioned data (like posts grouped by month)
      if (
        "sections" in cachedData &&
        Array.isArray((cachedData as any).sections)
      ) {
        const firstSection = (cachedData as any).sections[0];
        if (
          firstSection?.data &&
          Array.isArray(firstSection.data) &&
          firstSection.data.length > 0
        ) {
          return firstSection.data[0];
        }
      }
    }
  } catch (e) {
    console.warn(
      `[DetailScreen] Could not get first item for ${target.name}:`,
      e
    );
  }

  return null;
}

export function getDetailRoute(target: TestTarget, item: any): string | null {
  // For Flows, use code if available, otherwise id
  let itemId: string | undefined;
  if (target.name === "Flows List") {
    itemId = item?.code || item?.id || item?.flowCode;
  } else {
    itemId = item?.id || item?.slug || item?.ticketnumber;
  }

  if (!itemId) {
    console.warn(
      `[DetailScreen] No itemId found for ${target.name}. Item keys:`,
      item ? Object.keys(item).slice(0, 10) : "null"
    );
    return null;
  }

  switch (target.name) {
    case "Posts List":
      return `/post/${itemId}?subject=${encodeURIComponent(
        item.subject || ""
      )}`;
    case "Cases List":
      // Cases List uses a modal, not a route - return null to use detail opener
      return null;
    case "Repairs Screen":
      // Repairs Screen uses a modal, not a route - return null to use detail opener
      return null;
    case "News List":
      // News route uses [id] param, but we pass slug as the id value
      const newsSlug = item?.slug || itemId;
      if (!newsSlug) {
        console.warn(
          `[DetailScreen] No slug found for News List item. Item keys:`,
          item ? Object.keys(item).slice(0, 10) : "null"
        );
        return null;
      }
      console.log(
        `[DetailScreen] News List detail route: /news/${newsSlug} (from item.slug: ${item?.slug}, itemId: ${itemId})`
      );
      return `/news/${newsSlug}`;
    case "Contracts List":
      return `/contracts/${itemId}`;
    case "Invoices List":
      return `/financial/${itemId}`;
    case "Flows List":
      // Flows use code for navigation (flow.code or flow.flowCode), not id
      // The route path is [id] but the actual param used is code
      const flowCode = item?.code || item?.flowCode || item?.id;
      console.log(
        `[DetailScreen] Flows List detail route: /flows/${flowCode} (from item.code: ${item?.code}, item.flowCode: ${item?.flowCode}, item.id: ${item?.id})`
      );
      if (!flowCode) {
        console.warn(
          `[DetailScreen] No flow code found for Flows List item. Item keys:`,
          item ? Object.keys(item).slice(0, 10) : "null"
        );
        return null;
      }
      return `/flows/${flowCode}`;
    default:
      return null;
  }
}

export function getDetailComponentName(target: TestTarget): string | null {
  switch (target.name) {
    case "Posts List":
      return "PostDetailContainer";
    case "Cases List":
      return "CaseCommentContainer"; // Cases use CaseCommentContainer bottom sheet
    case "Repairs Screen":
      return "MaintananceDetailContainer"; // Repairs use MaintananceDetailContainer bottom sheet
    case "News List":
      return "NewsDetailContainer";
    case "Contracts List":
      return "ContractDetailContainer";
    case "Invoices List":
      return "InvoiceDetailContainer";
    case "Flows List":
      return "FlowDetailContainer";
    default:
      return null;
  }
}
