import { StyleSheet } from 'react-native';
import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';

export const profileCardStyle = StyleSheet.create({
  card: {
    marginHorizontal: 21,
    marginBottom: 12,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textHint }),
    marginBottom: 10,
  },
});
