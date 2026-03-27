import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { FilledButton } from '@shared/components/buttons/FilledButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

interface RoomSessionPlaceholderProps {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  isLoading?: boolean;
}

export const RoomSessionPlaceholder: React.FC<RoomSessionPlaceholderProps> = ({
  title,
  description,
  buttonLabel,
  onPress,
  isLoading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* 모임 시작 전을 상징하는 아이콘이나 이미지를 배치합니다. */}
          <View style={styles.iconCircle}>
            <Image 
              source={require('../../../../assets/images/duckchi_character.png')} 
              style={styles.placeholderImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <FilledButton
          text={buttonLabel}
          onPress={onPress}
          isLoading={isLoading}
          style={styles.button}
          height={54 * s}
          borderRadius={14 * s}
          textStyle={KBODiaGothicTextStyle.bold({ 
            fontSize: 17 * s, 
            color: AppColorStyles.black 
          })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40 * s,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    marginBottom: 32 * s,
  },
  iconCircle: {
    width: 120 * s,
    height: 120 * s,
    borderRadius: 60 * s,
    backgroundColor: AppColorStyles.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  placeholderImage: {
    width: 80 * s,
    height: 80 * s,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 22 * s,
      color: AppColorStyles.black,
    }),
    textAlign: 'center',
    marginBottom: 12 * s,
  },
  description: {
    ...PretendardTextStyle.medium({
      fontSize: 15 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.textSecondary,
    }),
    textAlign: 'center',
    marginBottom: 40 * s,
  },
  button: {
    width: '100%',
  },
});
