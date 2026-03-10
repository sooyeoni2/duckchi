import { TextStyle } from 'react-native';
import { AppColorStyles } from './colors';

/**
 * 덕치 앱 텍스트 스타일 — Pretendard 폰트 기반
 *
 * 사용 예시:
 * ```tsx
 * <Text style={PretendardTextStyle.bold({ fontSize: 18, color: AppColorStyles.textPrimary })}>
 *   모임방 이름
 * </Text>
 * ```
 */

// Android: fontFamily = 파일명(확장자 제외), fontWeight 무시
// → weight별로 별도 파일명 지정
const PRETENDARD = {
  thin: 'Pretendard-Thin',
  light: 'Pretendard-Light',
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
  black: 'Pretendard-Black',
} as const;

interface FontOptions {
  fontSize: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

function pretendardBase(fontFamily: string, options: FontOptions): TextStyle {
  return {
    fontFamily,
    fontSize: options.fontSize,
    color: options.color ?? AppColorStyles.textPrimary,
    ...(options.lineHeight !== undefined && { lineHeight: options.lineHeight }),
    ...(options.letterSpacing !== undefined && { letterSpacing: options.letterSpacing }),
  };
}

export const PretendardTextStyle = {
  thin: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.thin, options),
  light: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.light, options),
  regular: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.regular, options),
  medium: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.medium, options),
  semiBold: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.semiBold, options),
  bold: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.bold, options),
  extraBold: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.extraBold, options),
  black: (options: FontOptions): TextStyle => pretendardBase(PRETENDARD.black, options),
};

/**
 * KBO Dia Gothic 텍스트 스타일 (Android 전용)
 *
 * Android는 파일명(확장자 제외)이 fontFamily 이름
 * → KBO Dia Gothic Bold.otf → fontFamily: 'KBO Dia Gothic Bold'
 *
 * 사용 예시:
 * ```tsx
 * <Text style={KBODiaGothicTextStyle.bold({ fontSize: 24 })}>
 *   덕치
 * </Text>
 * ```
 */

interface KBOFontOptions {
  fontSize: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

function kboBase(fontFamily: string, options: KBOFontOptions): TextStyle {
  return {
    fontFamily,
    fontSize: options.fontSize,
    color: options.color ?? AppColorStyles.textPrimary,
    ...(options.lineHeight !== undefined && { lineHeight: options.lineHeight }),
    ...(options.letterSpacing !== undefined && { letterSpacing: options.letterSpacing }),
  };
}

export const KBODiaGothicTextStyle = {
  light: (options: KBOFontOptions): TextStyle => kboBase('KBO Dia Gothic Light', options),
  medium: (options: KBOFontOptions): TextStyle => kboBase('KBO Dia Gothic Medium', options),
  bold: (options: KBOFontOptions): TextStyle => kboBase('KBO Dia Gothic Bold', options),
};
