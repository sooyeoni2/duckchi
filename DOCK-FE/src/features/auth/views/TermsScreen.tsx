import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const handleConfirm = () => {
    navigation.getParent()?.navigate('App');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>이용 약관</Text>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
        <Text style={styles.confirmText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  title: {
    position: 'absolute',
    width: '53.2%',
    left: '23.5%',
    top: '14.6%',
    textAlign: 'center',
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: AppColorStyles.black }),
  },
  confirmButton: {
    position: 'absolute',
    width: '79.6%',
    height: 60,
    left: '10.2%',
    top: '83.5%',
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 20 * s,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
});

export default TermsScreen;
