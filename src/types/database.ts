/**
 * Supabase 데이터베이스 타입 정의
 *
 * Supabase 대시보드에서 테이블을 생성한 후,
 * 아래 명령으로 자동 생성할 수 있습니다:
 *
 * npx supabase gen types typescript --project-id zkxiafonajwibnffbqmb > src/types/database.ts
 *
 * 현재는 예시 타입만 정의되어 있습니다.
 */

export interface Database {
  public: {
    Tables: {
      // 예시: profiles 테이블
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // TODO: 여기에 추가 테이블 타입 정의
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// 타입 헬퍼
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
