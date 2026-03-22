import { StyleSheet } from 'react-native';

import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';

export const profileCardStyle = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textHint }),
    marginBottom: 10,
  },
});
