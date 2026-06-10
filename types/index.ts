export interface Member {
  id: string;
  name: string;
  created_at: string;
}

export type LinkStatus = '기획 중' | '개발 중' | '홀딩 중' | '사용 중' | '사용 종료' | '폐기';
export type LinkCategory = '스킬' | '배포' | '자동화';
export type LinkTarget = '수강생' | '전사' | '팀' | '파트' | '트랙' | '개인';

export interface Link {
  id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  usage_url: string | null;
  memo: string | null;
  category: LinkCategory | null;
  status: LinkStatus | null;
  target: LinkTarget[] | null;
  platform: string | null;
  author_id: string | null;
  author_name: string | null;
  notice: string | null;
  notice_active: boolean;
  sort_order: number;
  created_at: string;
  comments: Comment[];
  likes_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  link_id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  avatar_url?: string | null;
}
