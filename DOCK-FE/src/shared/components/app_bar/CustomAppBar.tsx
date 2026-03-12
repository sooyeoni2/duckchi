import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';

/**
 * 덕치 앱 전체에서 사용하는 커스텀 AppBar
 *
 * React Navigation과 함께 사용 시:
 * ```tsx
 * options={{
 *   header: ({ navigation, options }) => (
 *     <CustomAppBar
 *       title={options.title}
 *       onBackPress={() => navigation.goBack()}
 *     />
 *   ),
 * }}
 * ```
 */

interface CustomAppBarProps {
  title?: string;
  titleWidget?: React.ReactNode;
  centerTitle?: boolean;
  actions?: React.ReactNode[];
  leading?: React.ReactNode;
  showBackButton?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  onBackPress?: () => void;
  style?: ViewStyle;
}

export const CustomAppBar: React.FC<CustomAppBarProps> = ({
  title,
  titleWidget,
  centerTitle = true,
  actions,
  leading,
  showBackButton = true,
  backgroundColor,
  foregroundColor,
  onBackPress,
  style,
}) => {
  const effectiveBg = backgroundColor ?? AppColorStyles.white;
  const effectiveFg = foregroundColor ?? AppColorStyles.black;

  const renderLeading = () => {
    if (leading != null) return leading;
    if (!showBackButton) return <View style={styles.leadingPlaceholder} />;
    return (
      <TouchableOpacity
        onPress={onBackPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.backButton}
      >
        <MaterialDesignIcons name="chevron-left" size={28} color={effectiveFg} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.container, { backgroundColor: effectiveBg }, style]}>
        <View style={styles.leadingArea}>{renderLeading()}</View>

        <View style={[styles.titleArea, centerTitle && styles.titleCenter]}>
          {titleWidget ?? (
            <Text
              style={KBODiaGothicTextStyle.medium({ fontSize: 18, color: effectiveFg })}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>

        <View style={styles.actionsArea}>
          {actions?.map((action, index) => <View key={index}>{action}</View>)}
        </View>
      </View>
    </>
  );
};

/**
 * 탭이 있는 AppBar (예: 결제 추가 - 카드알림/OCR/직접입력)
 *
 * 사용 예시:
 * ```tsx
 * <TabbedAppBar
 *   title="결제 추가"
 *   tabs={['카드알림', 'OCR', '직접입력']}
 *   selectedIndex={tabIndex}
 *   onTabPress={(index) => setTabIndex(index)}
 * />
 * ```
 */

interface TabbedAppBarProps {
  title?: string;
  tabs: string[];
  selectedIndex: number;
  onTabPress: (index: number) => void;
  actions?: React.ReactNode[];
  backgroundColor?: string;
  indicatorColor?: string;
  labelColor?: string;
  unselectedLabelColor?: string;
  style?: ViewStyle;
}

export const TabbedAppBar: React.FC<TabbedAppBarProps> = ({
  title,
  tabs,
  selectedIndex,
  onTabPress,
  actions,
  backgroundColor,
  indicatorColor,
  labelColor,
  unselectedLabelColor,
  style,
}) => {
  const effectiveBg = backgroundColor ?? AppColorStyles.white;
  const effectiveIndicator = indicatorColor ?? AppColorStyles.black;
  const effectiveLabel = labelColor ?? AppColorStyles.black;
  const effectiveUnselected = unselectedLabelColor ?? AppColorStyles.textHint;

  return (
    <View style={[styles.tabbedContainer, { backgroundColor: effectiveBg }, style]}>
      <View style={styles.tabbedTitleRow}>
        {title != null && (
          <Text
            style={KBODiaGothicTextStyle.medium({ fontSize: 18, color: AppColorStyles.black })}
          >
            {title}
          </Text>
        )}
        {actions?.map((action, index) => <View key={index}>{action}</View>)}
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab, index) => {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity key={tab} onPress={() => onTabPress(index)} style={styles.tab}>
              <Text
                style={
                  isSelected
                    ? KBODiaGothicTextStyle.medium({ fontSize: 14, color: effectiveLabel })
                    : KBODiaGothicTextStyle.light({ fontSize: 14, color: effectiveUnselected })
                }
              >
                {tab}
              </Text>
              {isSelected && (
                <View style={[styles.tabIndicator, { backgroundColor: effectiveIndicator }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const APP_BAR_HEIGHT = 56;

const styles = StyleSheet.create({
  container: {
    height: APP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  leadingArea: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingPlaceholder: {
    width: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  titleCenter: {
    alignItems: 'center',
  },
  actionsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  tabbedContainer: {},
  tabbedTitleRow: {
    height: APP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});
