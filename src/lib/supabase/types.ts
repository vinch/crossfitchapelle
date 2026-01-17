export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      course_types: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          display_order?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          display_order?: number;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          course_type_id: string;
          day: number;
          start_hour: string;
          end_hour: string;
          priority: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          course_type_id: string;
          day: number;
          start_hour: string;
          end_hour: string;
          priority?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          course_type_id?: string;
          day?: number;
          start_hour?: string;
          end_hour?: string;
          priority?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'schedules_course_type_id_fkey';
            columns: ['course_type_id'];
            referencedRelation: 'course_types';
            referencedColumns: ['id'];
          }
        ];
      };
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

