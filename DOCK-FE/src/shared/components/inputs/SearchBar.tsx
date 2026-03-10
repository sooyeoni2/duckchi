import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AppColorStyles } from '../../../core/theme/colors';
import { PretendardTextStyle } from '../../../core/theme/typography';

/**
 * 덕치 앱 검색 바 (모임 목록 검색 등)
 *
 * 사용 예시:
 * ```tsx
 * <SearchBar
 *   hintText="모임방 이름 검색"
 *   onChangeText={(value) => search(value)}
 * />
 * ```
 */

interface SearchBarProps {
  hintText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onClear?: () => void;
  onPress?: () => void;
  autoFocus?: boolean;
  readOnly?: boolean;
  enabled?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  hintText = '검색',
  value,
  onChangeText,
  onSubmit,
  onClear,
  onPress,
  autoFocus = false,
  readOnly = false,
  enabled = true,
  backgroundColor,
  borderRadius = 12,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [internalValue, setInternalValue] = useState(value ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const showClear = currentValue.length > 0;

  useEffect(() => {
    if (isControlled) setInternalValue(value);
  }, [value, isControlled]);

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) setInternalValue(text);
      onChangeText?.(text);
    },
    [isControlled, onChangeText],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('');
    onChangeText?.('');
    onClear?.();
    inputRef.current?.focus();
  }, [isControlled, onChangeText, onClear]);

  return (
    <TouchableOpacity
      activeOpacity={readOnly ? 0.7 : 1}
      onPress={readOnly ? onPress : undefined}
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: backgroundColor ?? AppColorStyles.white,
        },
        style,
      ]}
    >
      <Text style={styles.searchIcon}>🔍</Text>

      <TextInput
        ref={inputRef}
        value={currentValue}
        onChangeText={handleChangeText}
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
        onPress={onPress}
        autoFocus={autoFocus}
        editable={enabled && !readOnly}
        returnKeyType="search"
        placeholder={hintText}
        placeholderTextColor={AppColorStyles.textHint}
        style={[
          styles.input,
          PretendardTextStyle.regular({ fontSize: 15, color: AppColorStyles.textPrimary }),
        ]}
      />

      {showClear && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColorStyles.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  clearIcon: {
    color: AppColorStyles.gray2,
    fontSize: 16,
  },
});
