import type { Database } from '../supabase/types';

export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

export type ScheduleWithCourseType = Schedule & {
  course_types: {
    id: string;
    name: string;
    color?: string;
    text_color?: string;
    priority?: number;
  };
};

export const DAYS_OF_WEEK = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

