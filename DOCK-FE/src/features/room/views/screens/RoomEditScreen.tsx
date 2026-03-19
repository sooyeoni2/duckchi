import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRoomEditViewModel } from '../../viewmodels/useRoomEditViewModel';

const CATEGORIES = ['회식', '여행', '데이트', '동아리', '기타'];

const RoomEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, setName, setCategory, saveRoomInfo } = useRoomEditViewModel();

  const handleSave = async () => {
    const success = await saveRoomInfo();
    if (success) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <AntDesign name="left" size={24} color={AppColorStyles.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>모임방 수정</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* 모임명 입력 */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>모임명</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={state.name}
                onChangeText={setName}
                placeholder="모임명을 입력해주세요"
                maxLength={20}
              />
              <Text style={styles.charCount}>{state.name.length}/20</Text>
            </View>
          </View>

          {/* 카테고리 선택 */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    state.category === cat && styles.categoryItemActive
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryText,
                    state.category === cat && styles.categoryTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <Feather name="info" size={16} color={AppColorStyles.textHint} />
            <Text style={styles.infoText}>정산이 진행 중인 경우 수정이 제한될 수 있어요</Text>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, state.isSaving && styles.disabledButton]} 
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={state.isSaving || !state.name.trim()}
          >
            {state.isSaving ? (
              <ActivityIndicator color={AppColorStyles.black} />
            ) : (
              <Text style={styles.buttonText}>저장하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: AppColorStyles.background,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColorStyles.textPrimary,
  },
  scrollContent: {
    padding: 20,
    gap: 32,
  },
  inputSection: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColorStyles.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: AppColorStyles.black,
    paddingVertical: 4,
  },
  charCount: {
    fontSize: 14,
    color: AppColorStyles.textHint,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  categoryItemActive: {
    backgroundColor: AppColorStyles.yellow,
    borderColor: AppColorStyles.yellow,
  },
  categoryText: {
    fontSize: 15,
    color: AppColorStyles.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: AppColorStyles.black,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FB',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: AppColorStyles.textHint,
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: AppColorStyles.yellow,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
});

export default RoomEditScreen;
