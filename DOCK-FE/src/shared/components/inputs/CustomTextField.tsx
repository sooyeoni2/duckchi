import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { AppColorStyles } from '../../../core/theme/colors';
import { PretendardTextStyle } from '../../../core/theme/typography';

/**
 * 덕치 앱 전체에서 사용하는 커스텀 TextField
 *
 * 사용 예시:
 * ```tsx
 * <CustomTextField
 *   label="모임방 이름"
 *   hint="모임방 이름을 입력하세요"
 *   value={name}
 *   onChangeText={(value) => setName(value)}
 * />
 * ```
 */

interface CustomTextFieldProps {
  label?: string;
  hint?: string;
  errorText?: string;
  helperText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onSubmitEditing?: (text: string) => void;
  readOnly?: boolean;
  secureTextEntry?: boolean;
  enabled?: boolean;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  maxLines?: number;
  maxLength?: number;
  suffixIcon?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  borderRadius?: number;
  style?: ViewStyle;
  inputRef?: React.RefObject<TextInput>;
  onFocus?: () => void;
}

export const CustomTextField: React.FC<CustomTextFieldProps> = ({
  label,
  hint,
  errorText,
  helperText,
  value,
  onChangeText,
  onPress,
  onSubmitEditing,
  readOnly = false,
  secureTextEntry = false,
  enabled = true,
  autoFocus = false,
  keyboardType,
  returnKeyType,
  maxLines = 1,
  maxLength,
  suffixIcon,
  prefixIcon,
  borderRadius = 12,
  style,
  inputRef,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = errorText != null && errorText.length > 0;

  const borderColor = (() => {
    if (!enabled) return AppColorStyles.gray4;
    if (hasError) return AppColorStyles.warning;
    if (isFocused) return AppColorStyles.gray1;
    return AppColorStyles.border;
  })();

  const borderWidth = isFocused && !hasError ? 1.5 : 1;

  return (
    <View style={style}>
      {label != null && (
        <Text
          style={[
            PretendardTextStyle.semiBold({ fontSize: 14, color: AppColorStyles.textSecondary }),
            styles.label,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderRadius,
            borderColor,
            borderWidth,
            backgroundColor: enabled ? AppColorStyles.white : AppColorStyles.gray5,
          },
        ]}
      >
        {prefixIcon != null && <View style={styles.prefixIcon}>{prefixIcon}</View>}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onPress={onPress}
          onSubmitEditing={
            onSubmitEditing ? (e) => onSubmitEditing(e.nativeEvent.text) : undefined
          }
          editable={enabled && !readOnly}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          numberOfLines={maxLines}
          maxLength={maxLength}
          multiline={maxLines != null && maxLines > 1}
          placeholder={hint}
          placeholderTextColor={AppColorStyles.textHint}
          onFocus={() => { setIsFocused(true); onFocus?.(); }}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            PretendardTextStyle.regular({
              fontSize: 16,
              color: enabled ? AppColorStyles.textPrimary : AppColorStyles.textDisabled,
            }) as TextStyle,
          ]}
        />

        {suffixIcon != null && <View style={styles.suffixIcon}>{suffixIcon}</View>}
      </View>

      {helperText != null && !hasError && (
        <Text
          style={[
            PretendardTextStyle.regular({ fontSize: 12, color: AppColorStyles.textHint }),
            styles.helperText,
          ]}
        >
          {helperText}
        </Text>
      )}

      {hasError && (
        <Text
          style={[
            PretendardTextStyle.regular({ fontSize: 12, color: AppColorStyles.warning }),
            styles.helperText,
          ]}
        >
          {errorText}
        </Text>
      )}
    </View>
  );
};

/**
 * 금액 입력 전용 TextField (숫자 + 원 단위)
 *
 * 사용 예시:
 * ```tsx
 * <AmountTextField label="총금액" value={amount} onChangeText={setAmount} />
 * ```
 */
interface AmountTextFieldProps {
  label?: string;
  errorText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  enabled?: boolean;
  style?: ViewStyle;
}

export const AmountTextField: React.FC<AmountTextFieldProps> = ({
  label,
  errorText,
  value,
  onChangeText,
  enabled = true,
  style,
}) => (
  <CustomTextField
    label={label}
    hint="0"
    errorText={errorText}
    value={value}
    onChangeText={(text) => onChangeText?.(text.replace(/[^0-9]/g, ''))}
    enabled={enabled}
    keyboardType="numeric"
    returnKeyType="done"
    style={style}
    suffixIcon={
      <Text
        style={PretendardTextStyle.semiBold({ fontSize: 16, color: AppColorStyles.textSecondary })}
      >
        원
      </Text>
    }
  />
);

/**
 * 여러 줄 입력용 TextArea (예: 메모)
 */
interface TextAreaProps {
  label?: string;
  hint?: string;
  errorText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  maxLines?: number;
  maxLength?: number;
  enabled?: boolean;
  showCounter?: boolean;
  style?: ViewStyle;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  hint,
  errorText,
  value,
  onChangeText,
  maxLines = 5,
  maxLength,
  enabled = true,
  showCounter = true,
  style,
}) => (
  <View style={style}>
    {label != null && (
      <View style={styles.textAreaHeader}>
        <Text
          style={PretendardTextStyle.semiBold({
            fontSize: 14,
            color: AppColorStyles.textSecondary,
          })}
        >
          {label}
        </Text>
        {showCounter && maxLength != null && (
          <Text
            style={PretendardTextStyle.regular({ fontSize: 12, color: AppColorStyles.textHint })}
          >
            {(value?.length ?? 0)}/{maxLength}
          </Text>
        )}
      </View>
    )}
    <CustomTextField
      hint={hint}
      errorText={errorText}
      value={value}
      onChangeText={onChangeText}
      maxLines={maxLines}
      maxLength={maxLength}
      enabled={enabled}
      keyboardType="default"
      returnKeyType="default"
    />
  </View>
);

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  prefixIcon: {
    marginRight: 8,
  },
  suffixIcon: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 6,
  },
  textAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
