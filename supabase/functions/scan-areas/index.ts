// Supabase Edge Function for automated area scanning
// This function is triggered by pg_cron to scan all monitored areas

import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const DATADOCKED_API_URL = 'https://datadocked.com/api/vessels_operations/get-vessels-by-area'

interface SavedArea {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  radius_km: number
  is_monitoring: boolean
  monitor_interval_minutes: number
  last_scanned_at: string | null
}

interface Profile {
  api_key: string | null
}

interface VesselInArea {
  mmsi: string
  name: string
  latitude: string
  longitude: string
  speed: string
  course: string
  heading: string | null
}

// Fetch vessels from DataDocked API
async function fetchVesselsInArea(
  latitude: number,
  longitude: number,
  radiusKm: number,
  apiKey: string
): Promise<VesselInArea[]> {
  // Apply same validation as client-side
  const lat = Math.round(latitude * 10) / 10
  const lng = Math.round(longitude * 10) / 10
  const radius = Math.min(Math.round(radiusKm), 50)

  const url = new URL(DATADOCKED_API_URL)
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lng.toString())
  url.searchParams.set('circle_radius', radius.toString())

  console.log(`[scan-areas] Fetching vessels: lat=${lat}, lng=${lng}, radius=${radius}km`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`)
  }

  const data = await response.json()

  // Handle various response formats
  if (Array.isArray(data)) {
    return data as VesselInArea[]
  }
  if (data && Array.isArray(data.vessels)) {
    return data.vessels as VesselInArea[]
  }
  if (data && Array.isArray(data.data)) {
    return data.data as VesselInArea[]
  }
  if (data && data.detail) {
    throw new Error(data.detail)
  }

  return []
}

Deno.serve(async (req) => {
  try {
    // Verify the request is authorized (from pg_cron or admin)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for optional parameters
    let targetAreaId: string | null = null
    let forceAll = false

    try {
      const body = await req.json()
      targetAreaId = body.area_id || null
      forceAll = body.force_all || false
    } catch {
      // No body or invalid JSON - that's okay for cron triggers
    }

    // Get all areas that need scanning
    const now = new Date()
    let areasQuery = supabase
      .from('saved_areas')
      .select('*')
      .eq('is_monitoring', true)

    if (targetAreaId) {
      // Scan specific area
      areasQuery = areasQuery.eq('id', targetAreaId)
    }

    const { data: areas, error: areasError } = await areasQuery

    if (areasError) {
      console.error('[scan-areas] Error fetching areas:', areasError)
      return new Response(JSON.stringify({ error: 'Failed to fetch areas' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!areas || areas.length === 0) {
      console.log('[scan-areas] No areas to scan')
      return new Response(JSON.stringify({ message: 'No areas to scan', scanned: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[scan-areas] Found ${areas.length} areas to check`)

    // Filter areas that are due for scanning (based on interval)
    const areasToScan = (areas as SavedArea[]).filter(area => {
      if (forceAll || targetAreaId) return true

      if (!area.last_scanned_at) return true

      const lastScan = new Date(area.last_scanned_at)
      const intervalMs = (area.monitor_interval_minutes || 60) * 60 * 1000
      const nextScanDue = new Date(lastScan.getTime() + intervalMs)

      return now >= nextScanDue
    })

    console.log(`[scan-areas] ${areasToScan.length} areas due for scanning`)

    const results: { areaId: string; areaName: string; vesselsFound: number; error?: string }[] = []

    for (const area of areasToScan) {
      try {
        // Get user's API key from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('api_key')
          .eq('user_id', area.user_id)
          .single()

        if (profileError || !profile?.api_key) {
          console.log(`[scan-areas] No API key for user ${area.user_id}, skipping area ${area.name}`)
          results.push({
            areaId: area.id,
            areaName: area.name,
            vesselsFound: 0,
            error: 'No API key configured',
          })
          continue
        }

        // Fetch vessels from DataDocked API
        const vessels = await fetchVesselsInArea(
          area.latitude,
          area.longitude,
          area.radius_km,
          profile.api_key
        )

        console.log(`[scan-areas] Found ${vessels.length} vessels in ${area.name}`)

        // Insert sightings into database
        if (vessels.length > 0) {
          const sightings = vessels.map(v => ({
            user_id: area.user_id,
            area_id: area.id,
            mmsi: v.mmsi,
            name: v.name || null,
            latitude: v.latitude ? parseFloat(v.latitude) : null,
            longitude: v.longitude ? parseFloat(v.longitude) : null,
            speed: v.speed ? parseFloat(v.speed) : null,
            course: v.course ? parseFloat(v.course) : null,
            heading: v.heading ? parseFloat(v.heading) : null,
            spotted_at: now.toISOString(),
            raw_data: v,
          }))

          const { error: insertError } = await supabase
            .from('area_sightings')
            .insert(sightings)

          if (insertError) {
            console.error(`[scan-areas] Error inserting sightings for ${area.name}:`, insertError)
            results.push({
              areaId: area.id,
              areaName: area.name,
              vesselsFound: vessels.length,
              error: 'Failed to save sightings',
            })
            continue
          }
        }

        // Update last_scanned_at
        await supabase
          .from('saved_areas')
          .update({ last_scanned_at: now.toISOString() })
          .eq('id', area.id)

        results.push({
          areaId: area.id,
          areaName: area.name,
          vesselsFound: vessels.length,
        })

      } catch (err) {
        console.error(`[scan-areas] Error scanning area ${area.name}:`, err)
        results.push({
          areaId: area.id,
          areaName: area.name,
          vesselsFound: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const totalVessels = results.reduce((sum, r) => sum + r.vesselsFound, 0)
    console.log(`[scan-areas] Completed: ${results.length} areas scanned, ${totalVessels} vessels found`)

    return new Response(
      JSON.stringify({
        message: 'Scan completed',
        scanned: results.length,
        totalVessels,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[scan-areas] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
