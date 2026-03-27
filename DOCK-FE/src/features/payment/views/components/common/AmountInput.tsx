import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';

interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  label?: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
  error?: string | null;
  style?: ViewStyle;
  editable?: boolean;
}

/**
 * 💰 금액 입력 전용 공통 컴포넌트
 * - 숫자 3자리마다 콤마(,) 표시
 * - 숫자 키보드 전용
 * - 우측 '원' 접미사 고정
 */
const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  label,
  userTag,
  profileImageUrl,
  error,
  style,
  editable = true,
}) => {
  // 숫자 포맷팅: 1000 -> "1,000"
  const formattedValue = value === 0 ? '' : value.toLocaleString('ko-KR');

  const handleChangeText = useCallback(
    (text: string) => {
      // 숫자 이외의 문자 제거
      const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
      onChange(isNaN(numericValue) ? 0 : numericValue);
    },
    [onChange],
  );

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
          ) : (
            userTag && (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{label[0]}</Text>
              </View>
            )
          )}
          <Text style={styles.label}>{label}</Text>
          {userTag && <Text style={styles.tagText}>#{userTag}</Text>}
        </View>
      )}
      <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
        <TextInput
          style={styles.input}
          value={formattedValue}
          onChangeText={handleChangeText}
          placeholder="0"
          keyboardType="numeric"
          textAlign="right"
          editable={editable}
          maxLength={10} // 약 10억 단위까지
        />
        <Text style={styles.suffix}>원</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tagText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    fontWeight: '400',
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarInitial: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#EEEEEE',
    borderColor: '#DDDDDD',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    paddingVertical: 0,
  },
  suffix: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default AmountInput;
