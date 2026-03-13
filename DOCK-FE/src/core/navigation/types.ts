export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BadgeList: undefined;
  Settings: undefined;
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
