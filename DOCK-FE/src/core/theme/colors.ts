/**
 * 덕치 앱 컬러 시스템
 *
 * Yellow: #FEEC7E — 텍스트는 반드시 검정(#000000) 사용
 * Background: #F2F3F5
 */
export const AppColorStyles = {
  // ─────────────────────────────────────────
  // Yellow (주요 액션 컬러)
  // ─────────────────────────────────────────

  /** 주요 액션 버튼, 강조 요소 — 텍스트는 반드시 black 사용 */
  yellow: '#FEEC7E',
  /** 연한 yellow (배경, 칩 비활성 등) */
  yellowLight: '#FFFBEA',

  // ─────────────────────────────────────────
  // Semantic
  // ─────────────────────────────────────────

  success: '#3FFF65',
  warning: '#FF3F3F',
  caution: '#FF9F3F',
  danger: '#FF6868',

  // ─────────────────────────────────────────
  // Grayscale
  // ─────────────────────────────────────────

  black: '#000000',
  gray1: '#333333',
  gray2: '#C2C2C2',
  gray3: '#DADADA',
  gray4: '#ECECEC',
  gray5: '#F2F3F5',
  white: '#FFFFFF',

  // ─────────────────────────────────────────
  // Background
  // ─────────────────────────────────────────

  /** 앱 기본 배경색 */
  background: '#F2F3F5',
  /** 카드 / 컨테이너 배경 */
  surface: '#FFFFFF',

  // ─────────────────────────────────────────
  // Text
  // ─────────────────────────────────────────

  textPrimary: '#000000',
  textSecondary: '#333333',
  textHint: '#C2C2C2',
  textDisabled: '#DADADA',

  // ─────────────────────────────────────────
  // Divider / Border
  // ─────────────────────────────────────────

  divider: '#ECECEC',
  border: '#DADADA',
} as const;

export type AppColor = (typeof AppColorStyles)[keyof typeof AppColorStyles];
