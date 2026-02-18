import * as Font from "expo-font";
import * as FileSystem from "expo-file-system/legacy";
import { API_URL } from "@/constants";

const APIURL = API_URL?.replace("/api/v1", "");
// @ts-ignore - cacheDirectory exists at runtime
const FONT_CACHE_DIR = `${FileSystem.cacheDirectory || ""}fonts/`;

// Font weight mapping: text weight -> numeric fontWeight -> fallback chain
const WEIGHT_MAP = {
  regular: { fontWeight: 400, fallbacks: [400, 500, 600, 700] },
  medium: { fontWeight: 500, fallbacks: [500, 400, 600, 700] },
  semiBold: { fontWeight: 600, fallbacks: [600, 700, 500, 400] },
  bold: { fontWeight: 700, fallbacks: [700, 600, 500, 400] },
} as const;

// Global cache for loaded fonts
let fontCache: {
  bodyFontName: string | null;
  displayFontName: string | null;
  loading: boolean;
  loaded: boolean;
  error: boolean;
  currentCorporation: string | null;
} = {
  bodyFontName: null,
  displayFontName: null,
  loading: false,
  loaded: false,
  error: false,
  currentCorporation: null,
};

// Callback for loading state changes
let loadingStateCallback: ((loading: boolean, error: boolean) => void) | null =
  null;

/**
 * Set callback to be notified of loading state changes
 */
export const setFontLoadingCallback = (
  callback: (loading: boolean, error: boolean) => void
) => {
  loadingStateCallback = callback;
};

/**
 * Get current loading state
 */
export const getFontLoadingState = () => ({
  loading: fontCache.loading,
  loaded: fontCache.loaded,
  error: fontCache.error,
});

/**
 * Download and cache font file locally
 */
const downloadAndCacheFont = async (
  url: string,
  filename: string
): Promise<string> => {
  // Ensure cache directory exists
  const dirInfo = await FileSystem.getInfoAsync(FONT_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(FONT_CACHE_DIR, {
      intermediates: true,
    });
  }

  const localPath = `${FONT_CACHE_DIR}${filename}`;

  // Check if already cached
  const fileInfo = await FileSystem.getInfoAsync(localPath);
  if (fileInfo.exists) {
    return localPath;
  }

  // Download font file
  const downloadResult = await FileSystem.downloadAsync(url, localPath);
  if (!downloadResult.uri) {
    throw new Error(`Failed to download font: ${url}`);
  }

  return downloadResult.uri;
};

/**
 * Get cached font path or download if not cached
 */
const getCachedFontPath = async (filePath: string): Promise<string> => {
  const url = APIURL + filePath;
  const filename = filePath.split("/").pop() || filePath.replace(/\//g, "_");

  try {
    return await downloadAndCacheFont(url, filename);
  } catch (error) {
    // If download fails, try direct URL (might be offline, but cached version exists)
    const cachedPath = `${FONT_CACHE_DIR}${filename}`;
    const cachedInfo = await FileSystem.getInfoAsync(cachedPath);
    if (cachedInfo.exists) {
      return cachedPath;
    }
    // Fallback to direct URL if no cache available
    return url;
  }
};

/**
 * Extract weight from filename (300, 400, 500, 600, 700, 900)
 */
const getWeightFromFilename = (filename: string): number => {
  const lower = filename.toLowerCase();
  if (
    lower.includes("900") ||
    lower.includes("black") ||
    lower.includes("heavy")
  )
    return 900;
  if (lower.includes("700") || lower.includes("bold")) return 700;
  if (lower.includes("600") || lower.includes("semibold")) return 600;
  if (lower.includes("500") || lower.includes("medium")) return 500;
  if (
    lower.includes("300") ||
    lower.includes("light") ||
    lower.includes("thin")
  )
    return 300;
  if (
    lower.includes("400") ||
    lower.includes("regular") ||
    lower.includes("normal")
  )
    return 400;
  return 400; // Default
};

/**
 * Preload corporation fonts - loads ALL weights for body and display fonts
 * Registers fonts with their actual family name so React Native can use fontWeight
 */
export const preloadCorpFonts = async (
  assets: TTenantAssets | undefined
): Promise<{ body: string | null; display: string | null }> => {
  // Extract font names
  const bodyFontName = assets?.fonts?.body?.[0]
    ?.replace(/['"]/g, "")
    .split(",")[0]
    .trim();
  const displayFontName = assets?.fonts?.display?.[0]
    ?.replace(/['"]/g, "")
    .split(",")[0]
    .trim();

  // Create corporation key for cache invalidation
  const corporationKey = `${bodyFontName || ""}_${displayFontName || ""}`;

  // If already loaded for this corporation, return immediately
  if (fontCache.loaded && fontCache.currentCorporation === corporationKey) {
    return {
      body: fontCache.bodyFontName,
      display: fontCache.displayFontName,
    };
  }

  // If corporation changed, clear cache
  if (
    fontCache.currentCorporation &&
    fontCache.currentCorporation !== corporationKey
  ) {
    fontCache = {
      bodyFontName: null,
      displayFontName: null,
      loading: false,
      loaded: false,
      error: false,
      currentCorporation: null,
    };
  }

  // If already loading, wait for it
  if (fontCache.loading) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 200; // 10 seconds max wait
      const checkInterval = setInterval(() => {
        attempts++;
        if (!fontCache.loading || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (attempts >= maxAttempts) {
            fontCache.loading = false;
            fontCache.error = true;
            loadingStateCallback?.(false, true);
          }
          resolve({
            body: fontCache.bodyFontName,
            display: fontCache.displayFontName,
          });
        }
      }, 50);
    });
  }

  // If no assets or no fonts, cache and return
  if (!bodyFontName || !assets?.localFonts || assets.localFonts.length === 0) {
    fontCache = {
      bodyFontName: bodyFontName || null,
      displayFontName: displayFontName || null,
      loading: false,
      loaded: true,
      error: false,
      currentCorporation: corporationKey,
    };
    loadingStateCallback?.(false, false);
    return {
      body: bodyFontName || null,
      display: displayFontName || null,
    };
  }

  fontCache.loading = true;
  loadingStateCallback?.(true, false);

  try {
    // Find matching font files
    const normalizeFontName = (name: string) =>
      name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

    const extractBaseFontName = (filename: string) => {
      const base = filename.toLowerCase().split(/[._-]/)[0];
      return base.replace(
        /(bold|regular|light|medium|semibold|thin|ultrabold|black|heavy|extrabold|pro|display)$/i,
        ""
      );
    };

    const findMatchingFonts = (fontName: string) => {
      if (!assets.localFonts || assets.localFonts.length === 0) return [];
      const normalized = normalizeFontName(fontName);
      return assets.localFonts.filter((f: string) => {
        const fileName = f.toLowerCase();
        const baseFileName = extractBaseFontName(fileName);

        const hasSignificantMatch = (str1: string, str2: string) => {
          for (let i = 0; i <= str1.length - 4; i++) {
            const substr = str1.substring(i, i + 4);
            if (str2.includes(substr)) return true;
          }
          return false;
        };

        return (
          fileName.includes(normalized) ||
          normalized.includes(baseFileName) ||
          baseFileName.includes(normalized) ||
          hasSignificantMatch(normalized, baseFileName) ||
          hasSignificantMatch(baseFileName, normalized)
        );
      });
    };

    const bodyFontFiles = bodyFontName ? findMatchingFonts(bodyFontName) : [];
    const displayFontFiles = displayFontName
      ? findMatchingFonts(displayFontName)
      : [];

    const allFontFiles = Array.from(
      new Set([...bodyFontFiles, ...displayFontFiles])
    );

    if (allFontFiles.length === 0) {
      fontCache = {
        bodyFontName: bodyFontName || null,
        displayFontName: displayFontName || null,
        loading: false,
        loaded: true,
        error: false,
        currentCorporation: corporationKey,
      };
      loadingStateCallback?.(false, false);
      return {
        body: bodyFontName || null,
        display: displayFontName || null,
      };
    }

    // Download and cache all fonts
    const fontMap: Record<string, { uri: string }> = {};
    const uniqueSources = new Set<string>();

    // Group fonts by family and weight
    const fontGroups: Record<string, Record<number, string[]>> = {};

    const fontPromises = allFontFiles.map(async (file: string) => {
      const source = APIURL + file;
      if (!uniqueSources.has(source)) {
        uniqueSources.add(source);
        try {
          const cachedPath = await getCachedFontPath(file);
          const weight = getWeightFromFilename(file);

          // Determine font family
          const isBodyFont = bodyFontFiles.includes(file);
          const isDisplayFont = displayFontFiles.includes(file);
          const familyName = isBodyFont
            ? bodyFontName!
            : isDisplayFont
            ? displayFontName!
            : bodyFontName || "CustomFont";

          // Group by family and weight
          if (!fontGroups[familyName]) {
            fontGroups[familyName] = {};
          }
          if (!fontGroups[familyName][weight]) {
            fontGroups[familyName][weight] = [];
          }
          fontGroups[familyName][weight].push(cachedPath);
        } catch (error) {
          const weight = getWeightFromFilename(file);
          const isBodyFont = bodyFontFiles.includes(file);
          const isDisplayFont = displayFontFiles.includes(file);
          const familyName = isBodyFont
            ? bodyFontName!
            : isDisplayFont
            ? displayFontName!
            : bodyFontName || "CustomFont";

          if (!fontGroups[familyName]) {
            fontGroups[familyName] = {};
          }
          if (!fontGroups[familyName][weight]) {
            fontGroups[familyName][weight] = [];
          }
          fontGroups[familyName][weight].push(source);
        }
      }
    });

    await Promise.all(fontPromises);

    // Register fonts - React Native needs unique keys but recognizes fonts by their internal family name
    // We'll register with unique keys but return the actual family name
    // React Native's Text component reads the font's internal family name from the font file metadata
    for (const [familyName, weights] of Object.entries(fontGroups)) {
      const cleanFamilyName = familyName.replace(/\s+/g, "");
      const isPoppins = cleanFamilyName.toLowerCase() === "poppins";

      // Register each weight with a unique key
      // React Native will read the font's internal family name from the font file
      for (const [weightStr, uris] of Object.entries(weights)) {
        const weight = parseInt(weightStr, 10);

        // For Poppins, filter out devanagari fonts and use only latin fonts
        let filteredUris = uris;
        if (isPoppins && Array.isArray(uris)) {
          filteredUris = uris.filter((uri: string) => {
            const uriLower = uri.toLowerCase();
            // Exclude devanagari fonts, keep latin and latin-ext
            return !uriLower.includes("devanagari");
          });
          // If filtering removed all fonts, fallback to original list
          if (filteredUris.length === 0) {
            filteredUris = uris;
          }
        }

        // Use unique key per weight to avoid conflicts
        const fontKey = `${cleanFamilyName}-${weight}`;
        fontMap[fontKey] = { uri: filteredUris[0] };
      }
    }

    await Font.loadAsync(fontMap);

    // Detect font name - try multiple approaches
    const detectFontName = (
      fontName: string | null,
      fontFiles: string[]
    ): string | null => {
      if (!fontName) return null;

      const baseName = fontName.replace(/\s+/g, "");
      const matchingKeys = Object.keys(fontMap).filter((key) =>
        key.startsWith(baseName)
      );

      const loadedMatchingKeys = matchingKeys.filter((key) =>
        Font.isLoaded(key)
      );

      if (loadedMatchingKeys.length === 0) {
        return null;
      }

      // Try the original font name first - React Native might recognize it from font file metadata
      if (Font.isLoaded(fontName)) {
        return fontName;
      }

      // Try variations of the font name
      const variations = [
        fontName,
        fontName.replace(/\s+/g, ""),
        fontName.replace(/\s+/g, "-"),
        fontName.replace(/\s+/g, "_"),
      ];

      for (const variation of variations) {
        if (Font.isLoaded(variation)) {
          return variation;
        }
      }

      // React Native doesn't recognize the font name by Font.isLoaded(), but fonts are loaded
      // On Android, React Native needs registration keys (e.g., "Poppins-400") to work properly
      // Return the registration key for weight 400 (regular) as the base
      // themed-text will select the correct weight-specific key
      if (loadedMatchingKeys.length > 0) {
        // Prefer weight 400 (regular) if available
        const regularKey = loadedMatchingKeys.find(
          (key) => key.includes("-400") || key.endsWith("-400")
        );
        const keyToUse = regularKey || loadedMatchingKeys[0];
        return keyToUse;
      }

      return fontName;
    };

    const detectedBodyFont = detectFontName(bodyFontName, bodyFontFiles);
    const detectedDisplayFont = displayFontName
      ? detectFontName(displayFontName, displayFontFiles)
      : null;

    fontCache = {
      bodyFontName: detectedBodyFont,
      displayFontName: detectedDisplayFont,
      loading: false,
      loaded: true,
      error: false,
      currentCorporation: corporationKey,
    };
    loadingStateCallback?.(false, false);

    return {
      body: detectedBodyFont,
      display: detectedDisplayFont,
    };
  } catch (error: any) {
    const fallbackBodyFontName = assets?.fonts?.body?.[0]
      ?.replace(/['"]/g, "")
      .split(",")[0]
      .trim();
    const fallbackDisplayFontName = assets?.fonts?.display?.[0]
      ?.replace(/['"]/g, "")
      .split(",")[0]
      .trim();
    fontCache = {
      bodyFontName: fallbackBodyFontName || null,
      displayFontName: fallbackDisplayFontName || null,
      loading: false,
      loaded: true,
      error: true,
      currentCorporation: corporationKey,
    };
    loadingStateCallback?.(false, true);
    return {
      body: fallbackBodyFontName || null,
      display: fallbackDisplayFontName || null,
    };
  }
};

/**
 * Get cached font name (synchronous)
 */
export const getCachedFontName = (
  fontType: "body" | "display" = "body"
): string | null => {
  return fontType === "display"
    ? fontCache.displayFontName
    : fontCache.bodyFontName;
};

/**
 * Get font family with weight fallback
 * Returns the font family name that should be used with fontWeight
 */
export const getFontFamily = (
  fontType: "body" | "display" = "body",
  textWeight: "regular" | "medium" | "semiBold" | "bold" = "regular"
): string | null => {
  const fontName = getCachedFontName(fontType);
  if (!fontName) return null;

  // Return the font family name - React Native will use fontWeight to select weight
  // The fontWeight will be set in the style based on textWeight prop
  return fontName;
};

/**
 * Get fontWeight for text weight with fallbacks
 */
export const getFontWeight = (
  textWeight: "regular" | "medium" | "semiBold" | "bold"
): number => {
  return WEIGHT_MAP[textWeight].fontWeight;
};

/**
 * Clear font cache (useful on logout)
 * Optionally clears FileSystem cache as well
 */
export const clearFontCache = async (clearFileSystemCache = false) => {
  fontCache = {
    bodyFontName: null,
    displayFontName: null,
    loading: false,
    loaded: false,
    error: false,
    currentCorporation: null,
  };
  loadingStateCallback?.(false, false);

  // Optionally clear FileSystem cache (font files)
  if (clearFileSystemCache) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(FONT_CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(FONT_CACHE_DIR, { idempotent: true });
      }
    } catch (error) {}
  }
};
