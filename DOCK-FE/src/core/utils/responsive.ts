import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

/**
 * 프로젝트 표준 기준 너비 (iPhone 13/14, 최신 Android 기준 약 412)
 */
const BASE_WIDTH = 412;

/**
 * 웹 환경에서 UI가 무한정 커지는 것을 방지하기 위한 최대 폭 제한
 */
const MAX_APP_WIDTH = 480;

/**
 * 실제 스케일링에 사용할 유효 너비
 * 웹 브라우저가 아무리 넓어도 MAX_APP_WIDTH를 넘지 않도록 제한함
 */
const EFFECTIVE_WIDTH = Platform.OS === 'web' 
  ? Math.min(WINDOW_WIDTH, MAX_APP_WIDTH) 
  : WINDOW_WIDTH;

/**
 * 반응형 스케일 팩터
 */
export const s = EFFECTIVE_WIDTH / BASE_WIDTH;

/**
 * 수치 데이터를 반응형으로 변환하는 기본 함수
 */
export const rs = (size: number): number => {
  const newSize = size * s;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 텍스트 크기 전용 반응형 함수
 */
export const rfs = (size: number): number => rs(size);

/**
 * 스타일 객체를 통째로 반응형으로 변환해주는 헬퍼
 */
export function makeStyles<T extends Record<string, any>>(styles: T): T {
  const scaledStyles: any = {};

  for (const key in styles) {
    const style = styles[key];
    scaledStyles[key] = {};

    for (const prop in style) {
      const value = style[prop];
      
      // 숫자 타입이면서 스케일링이 필요한 속성들만 자동 변환
      if (
        typeof value === 'number' &&
        !['flex', 'opacity', 'elevation', 'zIndex', 'shadowOpacity', 'fontWeight'].includes(prop)
      ) {
        scaledStyles[key][prop] = value * s;
      } else {
        scaledStyles[key][prop] = value;
      }
    }
  }

  return scaledStyles as T;
}
