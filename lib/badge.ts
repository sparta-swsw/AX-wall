import { LinkCategory, LinkStatus } from '@/types';

export const CATEGORY_STYLE: Record<LinkCategory, { bg: string; text: string; label: string }> = {
  스킬: { bg: '#EDE9FE', text: '#7C3AED', label: '스킬' },
  배포: { bg: '#DBEAFE', text: '#1D4ED8', label: '배포' },
  자동화: { bg: '#FEF3C7', text: '#B45309', label: '자동화' },
};

export const STATUS_STYLE: Record<LinkStatus, { bg: string; text: string }> = {
  '기획 중': { bg: '#F3F4F6', text: '#6B7280' },
  '개발 중': { bg: '#DBEAFE', text: '#1D4ED8' },
  '홀딩 중': { bg: '#FEF3C7', text: '#B45309' },
  '사용 중': { bg: '#D1FAE5', text: '#065F46' },
  '사용 종료': { bg: '#FEE2E2', text: '#B91C1C' },
  '폐기': { bg: '#F3F4F6', text: '#4B5563' },
};
