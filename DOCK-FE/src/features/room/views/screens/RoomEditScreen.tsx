import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
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
        {/* 공용 AppBar */}
        <CustomAppBar
          title="모임방 수정"
          centerTitle={true}
          showDivider
          backgroundColor={AppColorStyles.background}
          onBackPress={() => navigation.goBack()}
        />

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

        {/* 하단 버튼 — 공용 FilledButton 사용 */}
        <View style={styles.bottomContainer}>
          <FilledButton
            text="저장하기"
            onPress={state.isSaving || !state.name.trim() ? undefined : handleSave}
            isLoading={state.isSaving}
          />
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
});

export default RoomEditScreen;
