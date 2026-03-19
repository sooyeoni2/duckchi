export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  BankAccountSetup: { returnTo: 'App' | 'Settings' | 'NewUser'; lockedBankCode?: string };
  BankAccountVerify: {
    accountId: number;
    bankCode: string;
    bankName: string;
    maskedAccountNo: string;
    returnTo: 'App' | 'Settings' | 'NewUser';
  };
  BankAccountComplete: {
    bankName: string;
    maskedAccountNo: string;
    returnTo: 'App' | 'Settings' | 'NewUser';
  };
  PayPasswordSetup: { bankName?: string; maskedAccountNo?: string; returnTo?: 'App' | 'Settings' | 'NewUser' } | undefined;
  PayPasswordConfirm: { firstPassword: string; bankName?: string; maskedAccountNo?: string; returnTo?: 'App' | 'Settings' | 'NewUser' };
  PayPasswordInput: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BadgeList: undefined;
  Settings: undefined;
  BankAccountRegister: undefined;
  TransferLimit: undefined;
};

export type RoomStackParamList = {
  RoomList: undefined;
  RoomDetail: { roomId: number };
  RoomCreate: undefined;
  RoomRestart: { roomId: number };
  RoomMoreOptions: { roomId: number };
  AutoTransferAgree: { roomId: number };
  AdminDelegation: { roomId: number };
  RoomEdit: { roomId: number };
  SettlementRequestList: { roomId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  KakaoLogin: undefined;
  Terms: undefined;
  ProfileSetup: undefined;
  Registration: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Room: { screen: keyof RoomStackParamList } | undefined;
  Report: undefined;
  Profile: { screen: keyof ProfileStackParamList } | undefined;
};
