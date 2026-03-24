import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

/**
 * 🎫 결제 등록 수단 선택 화면
 */
const PaymentEntryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { roomId, roomSessionId } = route.params;

  /**
   * 📸 영수증 스캔 (카메라/갤러리 선택)
   */
  const handleOcrEntry = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '영수증을 찍기 위해 카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('PaymentRegistration', {
        roomId,
        roomSessionId,
        inputType: 'OCR',
        initialData: { imageUri: result.assets[0].uri },
      });
    }
  }, [navigation, roomId, roomSessionId]);

  /**
   * 🏦 계좌 내역 선택으로 이동
   */
  const handleAccountEntry = useCallback(() => {
    navigation.navigate('AccountHistory', { roomId, roomSessionId });
  }, [navigation, roomId, roomSessionId]);

  /**
   * ✍️ 직접 입력으로 이동
   */
  const handleManualEntry = useCallback(() => {
    navigation.navigate('PaymentRegistration', {
      roomId,
      roomSessionId,
      inputType: 'MANUAL',
    });
  }, [navigation, roomId, roomSessionId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>어떤 방법으로{"\n"}정산할까요?</Text>
          <Text style={styles.subtitle}>편한 방법을 선택해 주세요.</Text>
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.entryButton} onPress={handleOcrEntry}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <Text style={styles.buttonTitle}>영수증 스캔</Text>
            <Text style={styles.buttonDesc}>사진 찍어 자동 입력</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.entryButton} onPress={handleAccountEntry}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.iconText}>🏦</Text>
            </View>
            <Text style={styles.buttonTitle}>계좌 내역</Text>
            <Text style={styles.buttonDesc}>내 거래 내역에서 선택</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.entryButton} onPress={handleManualEntry}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.iconText}>✍️</Text>
            </View>
            <Text style={styles.buttonTitle}>직접 입력</Text>
            <Text style={styles.buttonDesc}>내용을 직접 입력</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#333', lineHeight: 36 },
  subtitle: { fontSize: 16, color: '#888', marginTop: 12 },
  buttonGrid: { gap: 16 },
  entryButton: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 24 },
  buttonTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  buttonDesc: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default PaymentEntryScreen;
