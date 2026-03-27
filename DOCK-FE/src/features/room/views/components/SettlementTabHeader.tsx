import React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { SettlementTab } from '../../models/settlementTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

interface SettlementTabHeaderProps {
  selectedTab: SettlementTab;
  inProgressCount: number;
  onChangeTab: (tab: SettlementTab) => void;
}

export function SettlementTabHeader({
  selectedTab,
  inProgressCount,
  onChangeTab,
}: SettlementTabHeaderProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const indicatorX = React.useRef(new Animated.Value(0)).current;
  const isIndicatorInitialized = React.useRef(false);
  const selectedIndex = selectedTab === 'IN_PROGRESS' ? 0 : 1;
  const indicatorWidth = containerWidth > 0 ? containerWidth / 2 : 0;

  React.useEffect(() => {
    if (indicatorWidth <= 0) {
      return;
    }

    const targetX = selectedIndex * indicatorWidth;

    if (!isIndicatorInitialized.current) {
      indicatorX.setValue(targetX);
      isIndicatorInitialized.current = true;
      return;
    }

    Animated.timing(indicatorX, {
      toValue: targetX,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [indicatorWidth, indicatorX, selectedIndex]);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        if (width !== containerWidth) {
          setContainerWidth(width);
        }
      }}
    >
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.8}
        onPress={() => onChangeTab('IN_PROGRESS')}
      >
        <Text style={selectedTab === 'IN_PROGRESS' ? styles.activeLabel : styles.inactiveLabel}>
          진행중 ({inProgressCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.8}
        onPress={() => onChangeTab('COMPLETED')}
      >
        <Text style={selectedTab === 'COMPLETED' ? styles.activeLabel : styles.inactiveLabel}>
          완료
        </Text>
      </TouchableOpacity>

      <View style={styles.lineTrack} />

      <Animated.View
        style={[
          styles.indicator,
          {
            width: indicatorWidth,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: AppColorStyles.background,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10 * s,
  },
  activeLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, lineHeight: 25 * s, color: '#151414', letterSpacing: -0.32 * s }),
  },
  inactiveLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, lineHeight: 25 * s, color: AppColorStyles.gray2, letterSpacing: -0.32 * s }),
  },
  lineTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5 * s,
    backgroundColor: '#CECECE',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 5 * s,
    backgroundColor: AppColorStyles.black,
  },
});
