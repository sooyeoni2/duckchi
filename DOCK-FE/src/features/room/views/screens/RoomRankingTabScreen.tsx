import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  type ViewStyle,
  View,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { useRoomRankingViewModel } from '@features/room/viewmodels/useRoomRankingViewModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;
const toWon = (value: number) => `${value.toLocaleString('ko-KR')}\uC6D0`;
const normalizeTag = (tag: string) => tag.replace(/^#+/, '');

interface RoomRankingTabScreenProps {
  roomId: number;
}

interface PodiumItem {
  userName: string;
  userTag: string;
  profileImageUrl: string | null;
  amount: number;
}

export function RoomRankingTabScreen({ roomId }: RoomRankingTabScreenProps) {
  const { state, snapshot, myRanking, isRefreshing, refresh, reload } =
    useRoomRankingViewModel(roomId);
  const [displayedItems, setDisplayedItems] = React.useState(snapshot.items);
  const [displayedTop3, setDisplayedTop3] = React.useState(snapshot.top3);
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const podiumAnim = React.useRef(new Animated.Value(0)).current;
  const listAnim = React.useRef(new Animated.Value(0)).current;
  const prevRevisionRef = React.useRef<number | null>(null);
  const prevRankByUserRef = React.useRef<Map<number, number> | null>(null);
  const rankDeltaByUserRef = React.useRef<Record<number, number>>({});
  const rowAnimMapRef = React.useRef<Record<number, Animated.Value>>({});

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  React.useEffect(() => {
    const buildMotion = (value: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(value, {
          toValue: 1,
          duration: 280,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    Animated.sequence([
      buildMotion(headerAnim, 0),
      buildMotion(podiumAnim, 0),
      buildMotion(listAnim, 0),
    ]).start();
  }, [headerAnim, podiumAnim, listAnim]);

  React.useEffect(() => {
    const currentRankByUser = new Map<number, number>(
      snapshot.items.map((item) => [item.userId, item.rank] as const),
    );

    // 최초 1회 동기화
    if (prevRevisionRef.current == null || prevRankByUserRef.current == null) {
      prevRevisionRef.current = snapshot.revision;
      prevRankByUserRef.current = currentRankByUser;
      setDisplayedItems(snapshot.items);
      setDisplayedTop3(snapshot.top3);
      return;
    }

    // revision 변동이 없으면 UI 데이터만 동기화
    if (snapshot.revision === prevRevisionRef.current) {
      setDisplayedItems(snapshot.items);
      setDisplayedTop3(snapshot.top3);
      return;
    }

    const changedUserIds: number[] = [];
    const rankDeltaByUser: Record<number, number> = {};

    currentRankByUser.forEach((newRank, userId) => {
      const oldRank = prevRankByUserRef.current?.get(userId);
      if (oldRank != null && oldRank !== newRank) {
        changedUserIds.push(userId);
        rankDeltaByUser[userId] = oldRank - newRank;
      }
    });

    prevRevisionRef.current = snapshot.revision;
    prevRankByUserRef.current = currentRankByUser;
    rankDeltaByUserRef.current = rankDeltaByUser;

    if (changedUserIds.length > 0) {
      // 핵심: 다음 렌더(=displayedItems 적용)에 애니메이션을 미리 걸어둔다.
      LayoutAnimation.configureNext({
        duration: 460,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.8,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }

    setDisplayedTop3(snapshot.top3);
    setDisplayedItems(snapshot.items);

    if (changedUserIds.length > 0) {
      changedUserIds.forEach((userId) => {
        if (!rowAnimMapRef.current[userId]) {
          rowAnimMapRef.current[userId] = new Animated.Value(1);
        }

        const anim = rowAnimMapRef.current[userId];
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          damping: 13,
          stiffness: 145,
          mass: 0.8,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [snapshot.revision, snapshot.items, snapshot.top3]);

  if (state.status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColorStyles.black} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void reload()}>
          <Text style={styles.retryButtonText}>{'\uB2E4\uC2DC \uC2DC\uB3C4'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const first = displayedTop3.find((item) => item.rank === 1) ?? displayedTop3[0] ?? null;
  const second = displayedTop3.find((item) => item.rank === 2) ?? displayedTop3[1] ?? null;
  const third = displayedTop3.find((item) => item.rank === 3) ?? displayedTop3[2] ?? null;

  const getRowAnimatedStyle = (userId: number) => {
    const delta = rankDeltaByUserRef.current[userId] ?? 0;
    const anim = rowAnimMapRef.current[userId];

    if (!anim || delta === 0) {
      return undefined;
    }

    const shift = Math.min(Math.max(Math.abs(delta) * 20 * s, 16 * s), 64 * s);
    const fromY = delta > 0 ? shift : -shift;

    return {
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [fromY, 0],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1.045, 1],
          }),
        },
      ],
      opacity: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.78, 1],
      }),
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.myCard,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14 * s, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.myLabel}>{'\uB098\uC758 \uC21C\uC704'}</Text>
        <View style={styles.myRow}>
          <View style={styles.myRankRow}>
            <Text style={styles.myRank}>{myRanking ? `${myRanking.rank}\uC704` : '-\uC704'}</Text>
            <MaterialCommunityIcons
              name="crown"
              size={16 * s}
              color="#F0DE00"
              style={styles.myRankCrown}
            />
          </View>
          <Text style={styles.myAmount}>{myRanking ? toWon(myRanking.amount) : '0\uC6D0'}</Text>
        </View>
        <Text style={styles.myName}>
          {myRanking ? `${myRanking.userName}#${normalizeTag(myRanking.userTag)}` : '\uC21C\uC704 \uC815\uBCF4 \uC5C6\uC74C'}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.podiumContainer,
          {
            opacity: podiumAnim,
            transform: [
              {
                translateY: podiumAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16 * s, 0],
                }),
              },
            ],
          },
        ]}
      >
        {renderPodiumItem(second, 2, styles.podiumSecond, AppColorStyles.gray2)}
        {renderPodiumItem(first, 1, styles.podiumFirst, '#F0DE00')}
        {renderPodiumItem(third, 3, styles.podiumThird, '#E29A00')}
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{'\uC804\uCCB4 \uC21C\uC704'}</Text>
        {isRefreshing ? (
          <ActivityIndicator size="small" color={AppColorStyles.gray1} />
        ) : (
          <TouchableOpacity onPress={() => void refresh()}>
            <MaterialCommunityIcons
              name="refresh"
              size={18 * s}
              color={AppColorStyles.gray1}
            />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[
          styles.listCard,
          {
            opacity: listAnim,
            transform: [
              {
                translateY: listAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18 * s, 0],
                }),
              },
            ],
          },
        ]}
      >
        {displayedItems.map((item) => {
          const isTop3 = item.rank <= 3;
          const rankToneColor =
            item.rank === 1 ? '#C8A600'
            : item.rank === 2 ? '#8D9199'
            : item.rank === 3 ? '#B5742A'
            : AppColorStyles.gray2;

          return (
          <Animated.View key={item.userId} style={getRowAnimatedStyle(item.userId)}>
          <View style={styles.listRow}>
            <View style={styles.leftBlock}>
              <Text style={[
                styles.rankText,
                isTop3 && styles.rankTextTop3,
                isTop3 && { color: rankToneColor },
              ]}>{item.rank}</Text>
              <View style={styles.avatar}>
                {item.profileImageUrl ? (
                  <Image source={{ uri: item.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={18 * s}
                    color={AppColorStyles.gray2}
                  />
                )}
              </View>
              <View>
                <Text style={[
                  styles.userName,
                  isTop3 && styles.userNameTop3,
                  isTop3 && { color: rankToneColor },
                ]}>{item.userName}</Text>
                <Text style={styles.userTag}>#{normalizeTag(item.userTag)}</Text>
              </View>
            </View>
            <Text style={[
              styles.amountText,
              isTop3 && styles.amountTextTop3,
              isTop3 && { color: rankToneColor },
            ]}>{toWon(item.amount)}</Text>
          </View>
          </Animated.View>
        )})}
      </Animated.View>
    </ScrollView>
  );
}

function renderPodiumItem(
  item: PodiumItem | null,
  rank: number,
  containerStyle: StyleProp<ViewStyle>,
  barColor: string,
) {
  const toneColor =
    rank === 1 ? '#C8A600'
    : rank === 2 ? '#8D9199'
    : '#B5742A';

  return (
    <View style={styles.podiumItem}>
      {rank === 1 ? (
        <MaterialCommunityIcons
          name="crown"
          size={14 * s}
          color="#D6A000"
          style={styles.crown}
        />
      ) : null}
      <View style={styles.avatarLarge}>
        {item?.profileImageUrl ? (
          <Image source={{ uri: item.profileImageUrl }} style={styles.avatarLargeImage} />
        ) : (
          <MaterialCommunityIcons
            name="account-outline"
            size={22 * s}
            color={AppColorStyles.gray2}
          />
        )}
      </View>
      <Text style={[styles.podiumName, { color: toneColor }]} numberOfLines={1}>
        {item?.userName ?? '-'}
      </Text>
      <Text style={[styles.podiumAmount, { color: toneColor }]}>
        {item ? toWon(item.amount) : '0\uC6D0'}
      </Text>
      <View style={[styles.podiumBar, containerStyle, { backgroundColor: barColor }]}>
        <Text style={styles.podiumRank}>{rank}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 21 * s,
    paddingTop: 16 * s,
    paddingBottom: 24 * s,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24 * s,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 10 * s,
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 19 * s,
      color: AppColorStyles.gray1,
    }),
  },
  retryButton: {
    borderRadius: 12 * s,
    backgroundColor: AppColorStyles.black,
    paddingHorizontal: 14 * s,
    paddingVertical: 8 * s,
  },
  retryButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.white,
    }),
  },
  myCard: {
    borderRadius: 10 * s,
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 14 * s,
    paddingVertical: 12 * s,
    marginBottom: 18 * s,
  },
  myLabel: {
    marginBottom: 6 * s,
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.white,
    }),
  },
  myRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myRank: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 26 * s,
      lineHeight: 28 * s,
      color: '#F0DE00',
    }),
  },
  myRankCrown: {
    marginLeft: 4 * s,
  },
  myAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 26 * s,
      lineHeight: 29 * s,
      color: AppColorStyles.white,
    }),
  },
  myName: {
    marginTop: 5 * s,
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.white,
    }),
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24 * s,
    marginBottom: 18 * s,
  },
  podiumItem: {
    width: '29%',
    alignItems: 'center',
  },
  crown: {
    marginBottom: 3 * s,
  },
  avatarLarge: {
    width: 42 * s,
    height: 42 * s,
    borderRadius: 21 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.gray3,
    backgroundColor: AppColorStyles.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6 * s,
  },
  avatarLargeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21 * s,
  },
  podiumName: {
    marginBottom: 2 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 11 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.gray1,
    }),
  },
  podiumAmount: {
    marginBottom: 4 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 10 * s,
      lineHeight: 12 * s,
      color: AppColorStyles.gray1,
    }),
  },
  podiumBar: {
    width: '84%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 6 * s,
    borderTopRightRadius: 6 * s,
  },
  podiumSecond: {
    height: 44 * s,
  },
  podiumFirst: {
    height: 60 * s,
  },
  podiumThird: {
    height: 38 * s,
  },
  podiumRank: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.white,
    }),
  },
  sectionHeader: {
    marginBottom: 8 * s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.black,
    }),
  },
  refreshText: {
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.gray1,
    }),
  },
  listCard: {
    borderRadius: 12 * s,
    backgroundColor: AppColorStyles.surface,
    paddingVertical: 8 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12 * s,
    paddingVertical: 8 * s,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    width: 17 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 19 * s,
      lineHeight: 21 * s,
      color: AppColorStyles.gray2,
    }),
  },
  rankTextTop3: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.black,
    }),
  },
  avatar: {
    width: 30 * s,
    height: 30 * s,
    borderRadius: 15 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 7 * s,
    backgroundColor: AppColorStyles.white,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15 * s,
  },
  userName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 15 * s,
      color: AppColorStyles.black,
    }),
  },
  userNameTop3: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 13 * s,
      lineHeight: 15 * s,
      color: AppColorStyles.black,
    }),
  },
  userTag: {
    marginTop: 2 * s,
    ...PretendardTextStyle.medium({
      fontSize: 9 * s,
      lineHeight: 11 * s,
      color: AppColorStyles.gray2,
    }),
  },
  amountText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.black,
    }),
  },
  amountTextTop3: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 21 * s,
      lineHeight: 23 * s,
      color: AppColorStyles.black,
    }),
  },
});
