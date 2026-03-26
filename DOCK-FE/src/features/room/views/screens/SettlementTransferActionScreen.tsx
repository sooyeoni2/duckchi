import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { transferSettlements } from '../../models/settlementService';

type Nav = NativeStackNavigationProp<RoomStackParamList, 'SettlementTransferAction'>;
type Route = RouteProp<RoomStackParamList, 'SettlementTransferAction'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

type TransferState =
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const FIREWORK_PARTICLES = [
  { x: -90, y: -20, color: '#FFC93C' },
  { x: -70, y: -70, color: '#FF9F1C' },
  { x: -25, y: -95, color: '#FF6B6B' },
  { x: 20, y: -92, color: '#FFD166' },
  { x: 62, y: -68, color: '#6BCB77' },
  { x: 88, y: -18, color: '#4D96FF' },
  { x: 76, y: 36, color: '#00C2A8' },
  { x: 34, y: 82, color: '#9D4EDD' },
  { x: -14, y: 96, color: '#F15BB5' },
  { x: -58, y: 74, color: '#A0C4FF' },
  { x: -86, y: 30, color: '#FFD166' },
  { x: 0, y: -108, color: '#FFE066' },
] as const;

const toErrorMessage = (error: unknown): string => {
  const maybeError = error as {
    response?: { data?: { msg?: string; message?: string } };
    message?: string;
  };

  return (
    maybeError?.response?.data?.msg ??
    maybeError?.response?.data?.message ??
    maybeError?.message ??
    '정산 처리 중 오류가 발생했습니다.'
  );
};

export default function SettlementTransferActionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [state, setState] = React.useState<TransferState>({ status: 'loading' });

  const roomId = route.params.roomId;
  const settlementIds = route.params.settlementIds;
  const particleAnims = React.useRef(
    FIREWORK_PARTICLES.map(() => new Animated.Value(0)),
  ).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  const moveToTransferDetail = React.useCallback(() => {
    navigation.replace('RoomDetail', {
      roomId,
      showTransfer: true,
    });
  }, [navigation, roomId]);

  const moveToHome = React.useCallback(() => {
    const tabNavigation = navigation.getParent();
    tabNavigation?.navigate('Home' as never);
  }, [navigation]);

  const runTransfer = React.useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const message = await transferSettlements(settlementIds);
      setState({
        status: 'success',
        message: message ?? '성공적으로 정산이 완료되었습니다.',
      });
    } catch (error) {
      setState({
        status: 'error',
        message: toErrorMessage(error),
      });
    }
  }, [settlementIds]);

  React.useEffect(() => {
    void runTransfer();
  }, [runTransfer]);

  React.useEffect(() => {
    if (state.status !== 'success') {
      return;
    }

    glowAnim.setValue(0);
    particleAnims.forEach((anim) => anim.setValue(0));

    Animated.parallel([
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 620,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      ...particleAnims.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 24),
          Animated.timing(anim, {
            toValue: 1,
            duration: 760,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [glowAnim, particleAnims, state.status]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.card}>
          {state.status === 'loading' ? (
            <>
              <ActivityIndicator size={96 * s} color={AppColorStyles.yellow} />
              <Text style={styles.title}>정산 처리 중</Text>
              <Text style={styles.message}>잠시만 기다려주세요.</Text>
            </>
          ) : state.status === 'success' ? (
            <>
              <Text style={styles.title}>정산 완료</Text>
              <View style={styles.successVisualWrap}>
                <Animated.View
                  style={[
                    styles.successGlow,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.55],
                      }),
                      transform: [
                        {
                          scale: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.55, 1.15],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                {FIREWORK_PARTICLES.map((particle, index) => {
                  const progress = particleAnims[index];
                  return (
                    <Animated.View
                      key={`${particle.color}-${index}`}
                      style={[
                        styles.particle,
                        {
                          backgroundColor: particle.color,
                          opacity: progress.interpolate({
                            inputRange: [0, 0.15, 1],
                            outputRange: [0, 1, 0],
                          }),
                          transform: [
                            {
                              translateX: progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, particle.x * s],
                              }),
                            },
                            {
                              translateY: progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, particle.y * s],
                              }),
                            },
                            {
                              scale: progress.interpolate({
                                inputRange: [0, 0.25, 1],
                                outputRange: [0.2, 1.1, 0.65],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  );
                })}
                <Image
                  source={require('../../../../assets/images/duckchi_character_happy.png')}
                  style={styles.successImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.buttonGroup}>
                <FilledButton
                  text="내역 보기"
                  onPress={moveToTransferDetail}
                  height={52 * s}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                  onPress={moveToHome}
                >
                  <Text style={styles.secondaryButtonText}>홈으로</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>정산 실패</Text>
              <Image
                source={require('../../../../assets/images/duckchi_character_crying.png')}
                style={styles.errorImage}
                resizeMode="contain"
              />
              <Text style={styles.message}>{state.message}</Text>
              <View style={styles.buttonGroup}>
                <FilledButton
                  text="다시 시도"
                  onPress={() => void runTransfer()}
                  height={52 * s}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                  onPress={moveToTransferDetail}
                >
                  <Text style={styles.secondaryButtonText}>내역 보기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.white,
  },
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.white,
    justifyContent: 'center',
    paddingHorizontal: 24 * s,
  },
  card: {
    borderRadius: 18 * s,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 20 * s,
    paddingVertical: 24 * s,
    alignItems: 'center',
    gap: 12 * s,
    overflow: 'hidden',
  },
  title: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22 * s,
      lineHeight: 28 * s,
      color: AppColorStyles.black,
    }),
    marginTop: 6 * s,
  },
  message: {
    ...PretendardTextStyle.medium({
      fontSize: 15 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.gray1,
    }),
    textAlign: 'center',
    marginBottom: 4 * s,
  },
  successVisualWrap: {
    width: 250 * s,
    height: 250 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 180 * s,
    height: 180 * s,
    borderRadius: 999,
    backgroundColor: AppColorStyles.yellow,
  },
  particle: {
    position: 'absolute',
    width: 10 * s,
    height: 10 * s,
    borderRadius: 999,
  },
  successImage: {
    width: 250 * s,
    height: 250 * s,
    alignSelf: 'center',
  },
  errorImage: {
    width: 250 * s,
    height: 250 * s,
    alignSelf: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: 10 * s,
  },
  secondaryButton: {
    width: '100%',
    height: 52 * s,
    borderRadius: 12 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...PretendardTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.gray1,
    }),
  },
});
