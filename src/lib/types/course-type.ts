import type { Database } from '../supabase/types';

export type CourseType = Database['public']['Tables']['course_types']['Row'];
export type CourseTypeInsert = Database['public']['Tables']['course_types']['Insert'];
export type CourseTypeUpdate = Database['public']['Tables']['course_types']['Update'];

