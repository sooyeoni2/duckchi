import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';
import { useAuthStore } from '../models/authStore';
import { useProfileSetupViewModel } from '../viewmodels/useProfileSetupViewModel';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

const { width: W, height: H } = Dimensions.get('window');
const s = W / 412;

const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const { submitting, submit } = useProfileSetupViewModel(navigation);
  const name = user?.name ?? '';
  const canConfirm = !!name && !submitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    submit('profiles/default/default-profile.jpg');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 제목 */}
        <View style={styles.topSection}>
          <Text style={styles.title}>프로필 설정</Text>
        </View>

        {/* 프로필 이미지 */}
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={60 * s} color="#CCCCCC" />
          </View>
          <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={16 * s} color="#727272" />
          </TouchableOpacity>
        </View>

        {/* 입력 영역 */}
        <View style={styles.inputSection}>
          <View style={styles.inputField}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={name}
              editable={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm && { opacity: 0.4 }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  topSection: {
    height: H * 0.22,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: H * 0.04,
  },
  title: {
    width: '100%',
    textAlign: 'center',
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: '#000000' }),
  },
  profileSection: {
    alignItems: 'center',
    marginTop: H * 0.06,
  },
  profileCircle: {
    width: 126 * s,
    height: 121 * s,
    borderRadius: 63 * s,
    backgroundColor: '#F9F9F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    width: 32.81 * s,
    height: 32.81 * s,
    right: W / 2 - 63 * s - 16 * s,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16.4 * s,
    borderWidth: 0.2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSection: {
    marginTop: H * 0.05,
    paddingHorizontal: 42 * s,
    gap: 16,
  },
  inputField: {
    gap: 6,
  },
  label: {
    fontSize: 16 * s,
    fontWeight: '500',
    color: '#121212',
    lineHeight: 22 * s,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    height: 55 * s,
    paddingHorizontal: 16 * s,
    fontSize: 16 * s,
    color: '#121212',
  },
  inputReadOnly: {
    backgroundColor: '#F5F5F5',
    color: '#888888',
  },
  confirmBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#FEEC7E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20 * s, color: '#000000' }),
  },
});

export default ProfileSetupScreen;
