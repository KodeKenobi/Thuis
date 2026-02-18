type TTenantAssets = {
  primary: {
    DEFAULT: string;
    [key: string]: string;
  };
  accent?: {
    DEFAULT: string;
    [key: string]: string;
  };
  fonts?: {
    display: string[];
    body: string[];
  };
  localFonts?: string[];
};

interface ITenant {
  name: string;
  displayName: string;
  logoAlt: string;
  logo: string;
  color: string;
  status: "ACTIVE";
  privacyPolicy?: string;
  onboardingScreens: {
    title: string;
    subTitle: string;
  }[];
  assets?: TTenantAssets;
}
