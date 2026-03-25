import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 412;
const MIN_RATIO = 0.9;
const MAX_RATIO = 1.03;

const ratio = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, MIN_RATIO), MAX_RATIO);

export const hs = (value: number): number => Math.round(value * ratio);

