export interface Member {
  id: string;
  name: string;
  created_at: string;
}

export interface Link {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  usage_url: string | null;
  memo: string | null;
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
