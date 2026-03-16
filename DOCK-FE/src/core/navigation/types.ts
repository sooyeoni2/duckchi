export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  BankAccountSetup: { returnTo: 'App' | 'Settings' };
  BankAccountVerify: {
    accountId: number;
    bankName: string;
    maskedAccountNo: string;
    returnTo: 'App' | 'Settings';
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BadgeList: undefined;
  Settings: undefined;
  BankAccountRegister: undefined;
  TransferLimit: undefined;
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
