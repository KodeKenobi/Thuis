type TAppConfig = {
  appSettings: {
    id: string;
    tenantId: string;
    code: "website";
    label: string;
    url: string;
    appToken: string;
    config: {
      liveChatOrgID: string;
      liveChatOrgURL: string;
      liveChatAppID: string;
      cookieBotID: string;
      analyticsProvider: string;
      analyticsID: string;
      cookiesEnabled: boolean;
      showDocuments: boolean;
      showHomeValuation: boolean;
      showAffairs: boolean;
      analyticsEnabled: boolean;
      showBerichten: boolean;
      liveChatEnabled: boolean;
      use2FA: boolean;
      analytics: {
        enabled: boolean;
        services: [];
      };
      maintenanceMode: {
        enabled: boolean;
        message: string;
        title: string;
      };
      reCaptcha: {
        enabled: boolean;
        key: string;
      };
      dynamic: [];
    };
    createdAt: string;
    updatedAt: string;
  };
};
