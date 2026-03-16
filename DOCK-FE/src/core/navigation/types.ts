export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BadgeList: undefined;
  Settings: undefined;
  BankAccountRegister: undefined;
  BankAccountSetup: undefined;
  BankAccountVerify: {
    accountId: number;
    bankName: string;
    maskedAccountNo: string;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Registration: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Room: undefined;
  Report: undefined;
  Profile: { screen: keyof ProfileStackParamList } | undefined;
};
