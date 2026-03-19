import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { MeetingRoom } from '../models/roomMockData';
import { ParticipantAvatarGroup } from './ParticipantAvatarGroup';
import { ProgressBar } from './ProgressBar';

const currency = new Intl.NumberFormat('ko-KR');

interface MeetingCardGroupProps {
  category: string;
  rooms: MeetingRoom[];
  onPress?: (meeting: MeetingRoom) => void;
  onActionPress: (meeting: MeetingRoom) => void;
}

interface RoomCardProps {
  meeting: MeetingRoom;
  onPress?: (meeting: MeetingRoom) => void;
  onActionPress: (meeting: MeetingRoom) => void;
}

function RoomCard({ meeting, onPress, onActionPress }: RoomCardProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const highlightedButton = meeting.status === 'ENDED';

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={styles.card}
        onPress={() => onPress?.(meeting)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{meeting.roomName}</Text>
            <Text style={styles.subtitle}>{meeting.description}</Text>
          </View>
        </View>

        <Text style={styles.metaText}>
          {meeting.memberCount}명 · {currency.format(meeting.totalPay)}원 · 결제 {meeting.payCount}건
        </Text>

        <View style={styles.progressSection}>
          <ProgressBar value={meeting.percent} />
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>
              {meeting.completedCount}/{meeting.totalCount}명 완료
            </Text>
            <Text style={styles.progressText}>{meeting.percent}%</Text>
          </View>
        </View>

        <ParticipantAvatarGroup
          participants={meeting.participants}
          extraCount={meeting.extraMemberCount}
          style={styles.avatarGroup}
        />

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onActionPress(meeting);
          }}
          style={[
            styles.actionButton,
            highlightedButton ? styles.actionButtonHighlighted : styles.actionButtonMuted,
          ]}
        >
          <Text style={styles.actionButtonText}>{meeting.actionLabel}</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export function MeetingCard({ category, rooms, onPress, onActionPress }: MeetingCardGroupProps) {
  return (
    <View style={styles.cardShell}>
      <Text style={styles.shellCategory}>{category}</Text>

      {rooms.map((meeting) => (
        <RoomCard
          key={meeting.roomId}
          meeting={meeting}
          onPress={onPress}
          onActionPress={onActionPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingTop: 15,
    paddingBottom: 18,
    gap: 12,
  },
  shellCategory: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.textHint,
      lineHeight: 16,
    }),
    marginLeft: 16,
  },
  card: {
    height: 181,
    marginHorizontal: 16,
    position: 'relative',
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 4,
  },
  title: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24,
      color: AppColorStyles.black,
      lineHeight: 24,
    }),
  },
  subtitle: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 10,
      color: '#C2C2C2',
      lineHeight: 10,
    }),
    paddingBottom: 4,
  },
  categoryChip: {
    width: 48,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    backgroundColor: AppColorStyles.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.black,
      lineHeight: 16,
      letterSpacing: 0.5,
    }),
  },
  metaText: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 10,
      color: AppColorStyles.gray2,
      lineHeight: 10,
    }),
  },
  progressSection: {
    gap: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 10,
      color: AppColorStyles.gray2,
      lineHeight: 10,
    }),
  },
  avatarGroup: {
    position: 'absolute',
    left: 14,
    bottom: 16,
  },
  actionButton: {
    position: 'absolute',
    right: 6,
    bottom: 10,
    width: 110,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonHighlighted: {
    backgroundColor: AppColorStyles.yellow,
  },
  actionButtonMuted: {
    backgroundColor: AppColorStyles.divider,
  },
  actionButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.black,
      lineHeight: 21,
    }),
  },
});
