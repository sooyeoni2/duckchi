import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { MeetingRoom } from '../models/roomMockData';
import { ParticipantAvatarGroup } from './ParticipantAvatarGroup';
import { ProgressBar } from './ProgressBar';

const currency = new Intl.NumberFormat('ko-KR');

interface MeetingCardProps {
  meeting?: MeetingRoom;
  onPress?: (meeting: MeetingRoom) => void;
  onActionPress: (meeting: MeetingRoom) => void;
}

export function MeetingCard({ meeting, onPress, onActionPress }: MeetingCardProps) {
  if (meeting == null) {
    return null;
  }

  const highlightedButton = meeting.status === 'ENDED';

  return (
    <Pressable style={styles.cardShell} onPress={() => onPress?.(meeting)}>
      <Text style={styles.shellCategory}>{meeting.category}</Text>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{meeting.roomName}</Text>
            <Text style={styles.subtitle}>{meeting.description}</Text>
          </View>

          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{meeting.category}</Text>
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    width: '100%',
    height: 265,
    borderRadius: 10,
    backgroundColor: AppColorStyles.surface,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    paddingTop: 15,
  },
  shellCategory: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray2,
      lineHeight: 16,
    }),
    marginLeft: 14,
  },
  card: {
    width: 339,
    height: 181,
    marginTop: 22,
    marginLeft: 14,
    position: 'relative',
    borderRadius: 10,
    backgroundColor: AppColorStyles.surface,
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
    width: 130,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonHighlighted: {
    backgroundColor: AppColorStyles.yellow,
  },
  actionButtonMuted: {
    backgroundColor: '#D9D9D9',
  },
  actionButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.black,
      lineHeight: 21,
    }),
  },
});
