const BANK_COLORS: Record<string, { bg: string; text: string }> = {
  '004': { bg: '#FFBC00', text: '#000000' }, // KB국민
  '020': { bg: '#0066B3', text: '#FFFFFF' }, // 우리
  '081': { bg: '#009900', text: '#FFFFFF' }, // 하나
  '088': { bg: '#0046FF', text: '#FFFFFF' }, // 신한
  '089': { bg: '#7B2DFB', text: '#FFFFFF' }, // 케이뱅크
  '090': { bg: '#FFCD00', text: '#000000' }, // 카카오뱅크
  '092': { bg: '#4DAAFF', text: '#FFFFFF' }, // 토스뱅크
  '003': { bg: '#AA1B26', text: '#FFFFFF' }, // 기업(IBK)
  '023': { bg: '#003894', text: '#FFFFFF' }, // SC제일
  '011': { bg: '#004A97', text: '#FFFFFF' }, // NH농협
  '034': { bg: '#004A97', text: '#FFFFFF' }, // 지역농협
  '002': { bg: '#B8860B', text: '#FFFFFF' }, // KDB산업
  '050': { bg: '#4CAF50', text: '#FFFFFF' }, // iM뱅크
  '032': { bg: '#E4002B', text: '#FFFFFF' }, // 부산
  '039': { bg: '#E4002B', text: '#FFFFFF' }, // 경남
};

const DEFAULT_BANK_COLOR = { bg: '#FEEC7E', text: '#000000' };

export function getBankColor(bankCode: string): { bg: string; text: string } {
  return BANK_COLORS[bankCode] ?? DEFAULT_BANK_COLOR;
}
