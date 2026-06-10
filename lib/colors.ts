export const AUTHOR_PALETTE = [
  { bg: '#EEF2FF', border: '#818CF8', avatar: '#4F46E5', text: '#3730A3' },
  { bg: '#F0F9FF', border: '#38BDF8', avatar: '#0284C7', text: '#0369A1' },
  { bg: '#ECFDF5', border: '#34D399', avatar: '#059669', text: '#065F46' },
  { bg: '#FFF7ED', border: '#FB923C', avatar: '#EA580C', text: '#9A3412' },
  { bg: '#FDF4FF', border: '#C084FC', avatar: '#9333EA', text: '#6B21A8' },
  { bg: '#FFF1F2', border: '#FB7185', avatar: '#E11D48', text: '#9F1239' },
  { bg: '#F0FDF4', border: '#4ADE80', avatar: '#16A34A', text: '#14532D' },
  { bg: '#FEFCE8', border: '#FACC15', avatar: '#CA8A04', text: '#713F12' },
];

export const COLOR_PICKER = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

export { CATEGORY_STYLE, STATUS_STYLE } from '@/lib/badge';

const DEFAULT_COLOR = '#6366F1';

export function getAuthorColor(name: string, members: { name: string; color?: string | null }[]) {
  const member = members.find((m) => m.name === name);
  const c = member?.color || DEFAULT_COLOR;
  return { bg: c + '18', border: c, avatar: c, text: c };
}
