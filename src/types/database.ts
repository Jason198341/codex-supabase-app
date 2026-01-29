export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          nickname: string | null;
          points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          nickname?: string | null;
          points?: number;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          nickname?: string | null;
          points?: number;
        };
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          ai_verdict: string | null;
          ai_analysis: string | null;
          ai_ratio: string | null;
          guilty_count: number;
          not_guilty_count: number;
          status: string;
          is_hot: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          ai_verdict?: string | null;
          ai_analysis?: string | null;
          ai_ratio?: string | null;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          ai_verdict?: string | null;
          ai_analysis?: string | null;
          ai_ratio?: string | null;
          status?: string;
          is_hot?: boolean;
          view_count?: number;
        };
      };
      votes: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          vote: 'guilty' | 'not_guilty';
          created_at: string;
        };
        Insert: {
          case_id: string;
          user_id: string;
          vote: 'guilty' | 'not_guilty';
        };
        Update: {
          vote?: 'guilty' | 'not_guilty';
        };
      };
      comments: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          content: string;
          side: string | null;
          likes: number;
          created_at: string;
        };
        Insert: {
          case_id: string;
          user_id: string;
          content: string;
          side?: string | null;
        };
        Update: {
          content?: string;
          side?: string | null;
          likes?: number;
        };
      };
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Case = Tables<'cases'>;
export type Vote = Tables<'votes'>;
export type Comment = Tables<'comments'>;
export type Profile = Tables<'profiles'>;
