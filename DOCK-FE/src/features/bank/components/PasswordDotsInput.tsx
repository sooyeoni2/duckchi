import React, { useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '../../../core/theme/colors';

const PASSWORD_LENGTH = 6;

interface Props {
  password: string;
  onChangeText: (text: string) => void;
}

export function PasswordDotsInput({ password, onChangeText }: Props) {
  const inputRef = useRef<TextInput>(null);

  return (
    <>
      <TouchableOpacity
        style={styles.dotsRow}
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: PASSWORD_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < password.length ? styles.dotFilled : styles.dotEmpty]}
          />
        ))}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={password}
        onChangeText={text => onChangeText(text.replace(/[^0-9]/g, '').slice(0, PASSWORD_LENGTH))}
        keyboardType="numeric"
        maxLength={PASSWORD_LENGTH}
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dotFilled: {
    backgroundColor: AppColorStyles.black,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: AppColorStyles.black,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
});
