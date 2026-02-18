import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { Platform } from "react-native";
import { useAuth } from "./auth-context";
import { useGetTenants } from "@/service/tenants";
import { getCachedFontName } from "@/utils/font-preloader";
import { useColors } from "@/hooks/use-colors";

interface CorporateBrandingContextValue {
  corpColors: {
    primary: string | undefined;
  };

  assets: TTenantAssets | undefined;
  assetsLoading: boolean;

  colors: ReturnType<typeof useColors>;

  getCorpFont: (fontType: "body" | "display") => string | null;

  corporateInfo: {
    privacyPolicy: string | undefined;
    displayName: string | undefined;
    logo: string | undefined;
    logoAlt: string | undefined;
  };
}

const CorporateBrandingContext = createContext<
  CorporateBrandingContextValue | undefined
>(undefined);

export const CorporateBrandingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const baseColors = useColors();

  /**
   * User-level values (preferred)
   */
  const userAssets = user?.corporation?.assets;

  const userCorporateInfo = useMemo(
    () => ({
      privacyPolicy: user?.corporation?.privacyPolicy,
      displayName: user?.corporation?.displayName,
      logo: user?.corporation?.logo,
      logoAlt: user?.corporation?.logoAlt,
    }),
    [user],
  );

  /**
   * Tenants fallback
   */
  const { tenants, tenantsLoading } = useGetTenants({
    querykeySuffix: "corporate-branding-context",
    options: {
      enabled: !!(user && !userAssets),
    },
  });

  const tenant = useMemo(() => {
    if (!user || !tenants) return undefined;

    return tenants.find(
      (t) => t.name === user.corporationName,
    );
  }, [tenants, user]);

  /**
   * Resolved assets (user → tenant)
   */
  const assets = useMemo(() => {
    return userAssets ?? tenant?.assets;
  }, [userAssets, tenant]);

  /**
   * Resolved corporate info (user → tenant)
   */
  const corporateInfo = useMemo(() => {
    if (userCorporateInfo?.privacyPolicy) {
      return userCorporateInfo;
    }

    return {
      privacyPolicy: tenant?.privacyPolicy,
      displayName: tenant?.displayName,
      logo: tenant?.logo,
      logoAlt: tenant?.logoAlt,
    };
  }, [userCorporateInfo, tenant]);

  /**
   * Corporate colors
   */
  const corpColors = useMemo(
    () => ({
      primary: assets?.primary?.DEFAULT,
    }),
    [assets],
  );

  /**
   * Merge corporate colors with base colors (NO mutation)
   */
  const colors = useMemo(() => {
    return {
      ...baseColors,
      primary: corpColors.primary || baseColors.primary,
    };
  }, [baseColors, corpColors.primary]);

  /**
   * Corporate font resolver
   */
  const getCorpFont = useCallback(
    (fontType: "body" | "display"): string | null => {
      if (!user || Platform.OS === "web") {
        return null;
      }

      const cached = getCachedFontName(fontType);
      if (cached) return cached;

      if (fontType === "display") {
        return getCachedFontName("body");
      }

      return null;
    },
    [user],
  );

  return (
    <CorporateBrandingContext.Provider
      value={{
        corpColors,
        assets,
        assetsLoading: tenantsLoading,
        colors,
        getCorpFont,
        corporateInfo,
      }}
    >
      {children}
    </CorporateBrandingContext.Provider>
  );
};

export const useCorporateBranding = (): CorporateBrandingContextValue => {
  const context = useContext(CorporateBrandingContext);

  if (!context) {
    throw new Error(
      "useCorporateBranding must be used within a CorporateBrandingProvider",
    );
  }

  return context;
};
