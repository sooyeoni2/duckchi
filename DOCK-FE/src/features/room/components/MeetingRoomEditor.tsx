import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { CustomTextField } from '../../../shared/components/inputs/CustomTextField';
import type { MeetingRoomTag } from '../models/roomMockData';

interface TagOption {
  label: MeetingRoomTag;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const TAG_OPTIONS: TagOption[] = [
  { label: '회식', icon: 'silverware-fork-knife' },
  { label: '여행', icon: 'airplane' },
  { label: '데이트', icon: 'heart-outline' },
  { label: '취미', icon: 'palette-outline' },
  { label: '일회성 만남', icon: 'account-group-outline' },
  { label: '기타', icon: 'dots-horizontal' },
];

interface MeetingRoomEditorProps {
  roomName: string;
  detail: string;
  selectedTag: MeetingRoomTag;
  onRoomNameChange: (text: string) => void;
  onDetailChange: (text: string) => void;
  onTagChange: (tag: MeetingRoomTag) => void;
  submitLabel: string;
  onSubmit: () => void;
  showInviteGuide?: boolean;
}

export function MeetingRoomEditor({
  roomName,
  detail,
  selectedTag,
  onRoomNameChange,
  onDetailChange,
  onTagChange,
  submitLabel,
  onSubmit,
  showInviteGuide = false,
}: MeetingRoomEditorProps) {
  const canSubmit = roomName.trim().length > 0;

  return (
    <View style={styles.body}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>모임 이름 (최대 20자)</Text>
          <CustomTextField
            value={roomName}
            hint="모임 이름"
            onChangeText={(text) => onRoomNameChange(text.slice(0, 20))}
            borderRadius={12}
            style={styles.input}
          />
          <Text style={styles.counterText}>{roomName.length}/20</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>모임 태그</Text>
          <View style={styles.tagGrid}>
            {TAG_OPTIONS.map((option) => {
              const isSelected = option.label === selectedTag;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => onTagChange(option.label)}
                  style={[styles.tagCard, isSelected && styles.tagCardSelected]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={28}
                    color={isSelected ? AppColorStyles.white : AppColorStyles.gray1}
                    style={styles.tagIcon}
                  />
                  <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>세부 내용</Text>
          <CustomTextField
            value={detail}
            hint="세부 내용"
            onChangeText={onDetailChange}
            borderRadius={12}
            style={styles.input}
          />
        </View>

        {showInviteGuide ? (
          <View style={styles.inviteCard}>
            <View style={styles.inviteIconWrap}>
              <MaterialCommunityIcons name="link-variant" size={34} color={AppColorStyles.black} />
            </View>
            <View style={styles.inviteTextWrap}>
              <Text style={styles.inviteTitle}>방 만들면 초대링크 자동 생성</Text>
              <Text style={styles.inviteDescription}>링크 공유만으로 참여자 초대</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <FilledButton
          text={submitLabel}
          onPress={onSubmit}
          isFullWidth={false}
          width={370}
          height={62}
          borderRadius={12}
          textStyle={styles.submitButtonText}
          style={!canSubmit ? styles.submitButtonDisabled : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  content: {
    paddingHorizontal: 48,
    paddingTop: 24,
    paddingBottom: 100,
    gap: 28,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.gray1,
      lineHeight: 21,
    }),
  },
  input: {
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  counterText: {
    alignSelf: 'flex-end',
    ...KBODiaGothicTextStyle.light({
      fontSize: 10,
      color: '#818181',
      lineHeight: 10,
    }),
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 21,
  },
  tagCard: {
    width: 85,
    height: 85,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CECECE',
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tagCardSelected: {
    borderColor: '#333333',
    backgroundColor: '#333333',
  },
  tagIcon: {
    marginBottom: 6,
  },
  tagLabel: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({
      fontSize: 12,
      color: AppColorStyles.gray1,
      lineHeight: 16,
      letterSpacing: 0.5,
    }),
  },
  tagLabelSelected: {
    color: AppColorStyles.white,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  inviteIconWrap: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTextWrap: {
    flex: 1,
    gap: 4,
  },
  inviteTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.black,
      lineHeight: 20,
    }),
  },
  inviteDescription: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 13,
      color: AppColorStyles.gray1,
      lineHeight: 18,
    }),
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: AppColorStyles.background,
  },
  submitButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
      lineHeight: 28,
    }),
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
});
