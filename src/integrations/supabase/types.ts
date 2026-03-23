export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          api_key: string | null
          company_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_key?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          api_key?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_areas: {
        Row: {
          id: string
          user_id: string
          name: string
          latitude: number
          longitude: number
          radius_km: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          latitude: number
          longitude: number
          radius_km: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          latitude?: number
          longitude?: number
          radius_km?: number
          created_at?: string
          updated_at?: string
        }
      }
      tracked_vessels: {
        Row: {
          id: string
          user_id: string
          area_id: string | null
          mmsi: string
          name: string | null
          latitude: number | null
          longitude: number | null
          speed: number | null
          course: number | null
          heading: number | null
          first_seen: string
          last_seen: string
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id?: string | null
          mmsi: string
          name?: string | null
          latitude?: number | null
          longitude?: number | null
          speed?: number | null
          course?: number | null
          heading?: number | null
          first_seen?: string
          last_seen?: string
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string | null
          mmsi?: string
          name?: string | null
          latitude?: number | null
          longitude?: number | null
          speed?: number | null
          course?: number | null
          heading?: number | null
          first_seen?: string
          last_seen?: string
          raw_data?: Json | null
          created_at?: string
        }
      }
      api_calls: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          request_data: Json | null
          response_data: Json | null
          status_code: number | null
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          credits_used?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
