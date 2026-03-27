import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';

import type { RoomStackParamList } from '@core/navigation/types';

import { useSettlementRequestListViewModel } from '../../viewmodels/useSettlementRequestListViewModel';
import { SettlementRequestListMemberScreen } from './SettlementRequestListMemberScreen';
import { SettlementRequestListTreasurerScreen } from './SettlementRequestListTreasurerScreen';

type Nav = NativeStackNavigationProp<RoomStackParamList, 'SettlementRequestList'>;
type ScreenRoute = RouteProp<RoomStackParamList, 'SettlementRequestList'>;

export function SettlementRequestListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();

  const viewModel = useSettlementRequestListViewModel({
    roomId: route.params.roomId,
    expenseId: route.params.expenseId,
    expenseTitle: route.params.expenseTitle,
  });

  if (viewModel.isTreasurer) {
    return (
      <SettlementRequestListTreasurerScreen
        viewModel={viewModel}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <SettlementRequestListMemberScreen
      viewModel={viewModel}
      onBackPress={() => navigation.goBack()}
    />
  );
}
