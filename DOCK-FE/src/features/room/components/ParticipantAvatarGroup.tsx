import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

interface ParticipantAvatarGroupProps {
  participants: string[];
  extraCount: number;
  style?: StyleProp<ViewStyle>;
}

export function ParticipantAvatarGroup({
  participants,
  extraCount,
  style,
}: ParticipantAvatarGroupProps) {
  return (
    <View style={[styles.row, style]}>
      {participants.slice(0, 4).map((participant, index) => (
        <View key={`${participant}-${index}`} style={styles.avatar}>
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color={AppColorStyles.gray2}
          />
        </View>
      ))}
      {extraCount > 0 ? (
        <View style={styles.extraWrap}>
          <Text style={styles.extraText}>+{extraCount}명</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#F9F9F9',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraWrap: {
    justifyContent: 'center',
    paddingLeft: 2,
  },
  extraText: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 10,
      color: AppColorStyles.gray2,
      lineHeight: 10,
    }),
  },
});
