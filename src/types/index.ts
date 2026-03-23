export interface SavedArea {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  radius_km: number
  is_monitoring: boolean
  monitor_interval_minutes: number
  created_at: string
  updated_at: string
}

export interface TrackedVessel {
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
  raw_data: unknown
  created_at: string
}

export interface AreaSighting {
  id: string
  user_id: string
  area_id: string
  mmsi: string
  name: string | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  course: number | null
  heading: number | null
  spotted_at: string
  raw_data: unknown
  created_at: string
}
