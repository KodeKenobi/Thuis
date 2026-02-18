type TSignInPayload = {
  loginName: string;
  password: string;
  corporationName?: string;
};

type TEnableBiometricPayload = {
  publicKey: string;
  deviceId: string;
};

type TSignInBiometricPayload = {
  signature: string;
  deviceId: string;
  payload: {
    exp: number;
  };
};

type TVerifyOTPPayload = {
  loginId: string;
  passCode: string;
  corporationName?: string;
};

type TUserResponse = {
  loginId: string;
  loginName: string;
  fullName: string;
  custId: string;
  businessUnitId: string;
  corporationName: string;
};

type TUser = {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  custId: string;
  passCode: string;
  access_token?: string;
  refresh_token?: string;
  color?: string;
  corporationName?: string;
  corporationKey?: string;
  corporation: {
    displayName?: string;
    logo?: string;
    logoAlt?: string;
    assets?: TTenantAssets;
    privacyPolicy?: string;
  };
};

type TSignInResultSuccess =
  | ISigninRequirePasscodeResponse
  | ISigninWithoutPasscodeResponse;

interface ISigninRequirePasscodeResponse {
  corporationName: string;
  loginId: string;
  passCodeRequired: true;
  passCode: string;
}

interface ISigninWithoutPasscodeResponse extends ISuccessSigninData {}

interface ISuccessSigninData {
  passCodeRequired: false;
  user: TUserResponse;
  access_token: string;
  refresh_token: string;
}

// {
//   data: {
//     corporationName: string;
//     loginId: string;
//     passCodeRequired: string;
//     passCode: string;
//   };
//   access_token: string;
//   refresh_token: string;
// }

interface TSignInResultFailure {
  success: false;
  message: string;
}

interface IAuthContextType {
  user: TUser | null;
  userData: TUserDataResponse | undefined;
  loading: boolean;
  signIn: (user: TUser) => Promise<void>;
  signOut: () => Promise<void>;
  environment: "production" | "develop" | "sandbox";
  biometric?: string;
  updateBiometrics: (privateKey?: string) => Promise<void>;
  updateEnvironment: (
    env: "production" | "develop" | "sandbox",
  ) => Promise<void>;
  corporationOnboarded: {
    id: string;
    corporationName: string;
  };
  updateCorporationOnboarded: (onboarding: {
    id: string;
    corporationName: string;
  }) => Promise<void>;
}

type TUserDataResponse = {
  name: string;
  emailaddress1: string;
  telephone1: string;
  telephone1Role: string | null;
  telephone2: string;
  telephone2Role: string | null;
  preferreccontactmethod: {
    code: number;
    name: string;
  };
};
