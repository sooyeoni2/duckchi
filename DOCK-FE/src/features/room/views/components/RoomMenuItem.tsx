import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
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
    <TouchableOpacity 
      style={[styles.menuItem, showBorder && styles.menuItemBorder]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.menuText, { color: textColor }]}>{title}</Text>
      <Entypo name="chevron-right" size={20} color={textColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: AppColorStyles.surface,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
