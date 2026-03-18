import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

/**
 * 탭 전환 시 현재 스택 화면을 자동으로 pop하는 훅.
 * 탭 네비게이터 안의 스택 화면에서 사용.
 */
export function usePopOnTabBlur() {
  const navigation = useNavigation();

  useEffect(() => {
    const tabNavigation = navigation.getParent();
    if (!tabNavigation) return;
    const unsubscribe = tabNavigation.addListener('blur' as any, () => {
      navigation.goBack();
    });
    return unsubscribe;
  }, [navigation]);
}
