import { UIManager, findNodeHandle, Platform } from "react-native";

interface ScrollableRef {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
  scrollToEnd?: (options?: { animated?: boolean }) => void;
}

const scrollableRefs = new Map<string, ScrollableRef>();
const detailOpeners = new Map<string, (item: any) => void>();

export function getScrollableRefs(): Map<string, ScrollableRef> {
  return scrollableRefs;
}

export function registerScrollable(id: string, ref: ScrollableRef | null) {
  if (ref) {
    scrollableRefs.set(id, ref);
  } else {
    scrollableRefs.delete(id);
  }
}

export function registerDetailOpener(
  id: string,
  opener: ((item: any) => void) | null
) {
  if (opener) {
    detailOpeners.set(id, opener);
  } else {
    detailOpeners.delete(id);
  }
}

export function isDetailOpenerRegistered(componentName: string): boolean {
  return detailOpeners.has(componentName);
}

export function getRegisteredDetailOpeners(): string[] {
  return Array.from(detailOpeners.keys());
}

/**
 * Closes all open bottom sheets by calling their openers with null
 * @returns Promise that resolves after a delay to allow animations to complete
 */
export async function closeAllDetailSheets(): Promise<void> {
  const openers = Array.from(detailOpeners.entries());
  console.log(
    `[DetailHelper] Closing ${openers.length} detail sheet(s)...`,
    openers.map(([name]) => name)
  );

  // Close all registered detail openers
  for (const [componentName, opener] of openers) {
    try {
      opener(null);
      console.log(`[DetailHelper] Closed detail sheet for ${componentName}`);
    } catch (e) {
      console.warn(
        `[DetailHelper] Failed to close detail sheet for ${componentName}:`,
        e
      );
    }
  }

  // Wait for animations to complete (bottom sheets animate out)
  await new Promise((resolve) => setTimeout(resolve, 500));
}

export function openDetail(componentName: string, item: any): boolean {
  const opener = detailOpeners.get(componentName);
  if (!opener) {
    console.warn(
      `[DetailHelper] No detail opener found for ${componentName}. Available openers:`,
      Array.from(detailOpeners.keys())
    );
    return false;
  }

  try {
    console.log(
      `[DetailHelper] Opening detail for ${componentName} with item:`,
      item
        ? {
            id: item.id,
            code: item.code,
            ticketnumber: item.ticketnumber,
            omschrijving: item.omschrijving,
            type: typeof item,
            keys: Object.keys(item || {}).slice(0, 5),
          }
        : "null/undefined"
    );

    // Call the opener with the item
    opener(item);

    console.log(
      `[DetailHelper] Successfully called opener for ${componentName}`
    );
    return true;
  } catch (e) {
    console.warn(
      `[DetailHelper] Failed to open detail for ${componentName}:`,
      e
    );
    return false;
  }
}

export async function scrollList(
  componentName: string,
  distance: number = 500
): Promise<boolean> {
  const ref = scrollableRefs.get(componentName);
  if (!ref) {
    console.warn(`[ScrollHelper] No scrollable ref found for ${componentName}`);
    return false;
  }

  try {
    if (ref.scrollTo) {
      ref.scrollTo({ y: distance, animated: true });
      return true;
    } else if (ref.scrollToOffset) {
      ref.scrollToOffset({ offset: distance, animated: true });
      return true;
    }
  } catch (e) {
    console.warn(`[ScrollHelper] Failed to scroll ${componentName}:`, e);
  }

  return false;
}

export async function scrollToEnd(componentName: string): Promise<boolean> {
  const ref = scrollableRefs.get(componentName);
  if (!ref) {
    return false;
  }

  try {
    if (ref.scrollToEnd) {
      ref.scrollToEnd({ animated: true });
      return true;
    }
  } catch (e) {
    console.warn(
      `[ScrollHelper] Failed to scroll to end for ${componentName}:`,
      e
    );
  }

  return false;
}
