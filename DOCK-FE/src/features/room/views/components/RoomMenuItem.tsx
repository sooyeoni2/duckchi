import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { Entypo } from '@expo/vector-icons';

interface RoomMenuItemProps {
  title: string;
  textColor?: string;
  onPress?: () => void;
  showBorder?: boolean;
}

export const RoomMenuItem: React.FC<RoomMenuItemProps> = ({
  title,
  textColor = AppColorStyles.textPrimary,
  onPress,
  showBorder = true
}) => {
  return (
    <View style={[styles.wrapper, showBorder && styles.wrapperBorder]}>
      <Pressable
        style={({ pressed }) => [
          styles.menuItem,
          pressed && styles.menuItemPressed,
        ]}
        onPress={onPress}
      >
        <Text style={[styles.menuText, { color: textColor }]}>{title}</Text>
        <Entypo name="chevron-right" size={20} color={textColor} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: AppColorStyles.surface,
  },
  wrapperBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: AppColorStyles.gray5,
  },
  menuText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 }),
  },
});
