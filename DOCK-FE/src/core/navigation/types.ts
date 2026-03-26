import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: NavigatorScreenParams<AppTabParamList> | undefined;
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
  TermsView: { type: 'terms' | 'privacy' };
  PrivacyView: undefined;
};

export type RoomStackParamList = {
  RoomList: undefined;
  RoomDetail: { roomId: number; showTransfer?: boolean; initialTab?: 'PAYMENT' | 'SETTLEMENT' | 'RANKING' };
  SettlementTransferAction: { roomId: number; settlementIds: number[] };
  PaymentList: { roomId: number; roomSessionId?: number };
  RoomCreate: undefined;
  RoomRestart: { roomId: number };
  RoomMoreOptions: { roomId: number };
  AutoTransferAgree: { roomId: number };
  AutoTransferJoin: { roomId: number; roomName?: string; inviteToken?: string };
  AdminDelegation: { roomId: number };
  RoomEdit: { roomId: number };
  SettlementRequestList: { roomId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  KakaoLogin: undefined;
  Terms: undefined;
  TermsDetail: { type: 'terms' | 'privacy'; onAgree?: () => void };
  PrivacyDetail: { onAgree?: () => void };
  ProfileSetup: undefined;
  Registration: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Room: NavigatorScreenParams<RoomStackParamList> | undefined;
  Report: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};
