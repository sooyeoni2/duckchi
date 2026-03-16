const BANK_COLORS: Record<string, { bg: string; text: string }> = {
  '001': { bg: '#003087', text: '#FFFFFF' }, // 한국은행
  '002': { bg: '#B8860B', text: '#FFFFFF' }, // 산업은행
  '003': { bg: '#AA1B26', text: '#FFFFFF' }, // 기업은행
  '004': { bg: '#FFBC00', text: '#000000' }, // 국민은행
  '011': { bg: '#004A97', text: '#FFFFFF' }, // 농협은행
  '020': { bg: '#0066B3', text: '#FFFFFF' }, // 우리은행
  '023': { bg: '#003894', text: '#FFFFFF' }, // SC제일은행
  '027': { bg: '#117ABB', text: '#FFFFFF' }, // 시티은행
  '032': { bg: '#007AC2', text: '#FFFFFF' }, // 대구은행
  '034': { bg: '#00833F', text: '#FFFFFF' }, // 광주은행
  '035': { bg: '#FF6600', text: '#FFFFFF' }, // 제주은행
  '037': { bg: '#003087', text: '#FFFFFF' }, // 전북은행
  '039': { bg: '#E4002B', text: '#FFFFFF' }, // 경남은행
  '045': { bg: '#004A97', text: '#FFFFFF' }, // 새마을금고
  '081': { bg: '#009900', text: '#FFFFFF' }, // KEB하나은행
  '088': { bg: '#0046FF', text: '#FFFFFF' }, // 신한은행
  '090': { bg: '#FFCD00', text: '#000000' }, // 카카오뱅크
  '999': { bg: '#3396FF', text: '#FFFFFF' }, // 싸피은행
};

const DEFAULT_BANK_COLOR = { bg: '#FEEC7E', text: '#000000' };

export function getBankColor(bankCode: string): { bg: string; text: string } {
  return BANK_COLORS[bankCode] ?? DEFAULT_BANK_COLOR;
}
