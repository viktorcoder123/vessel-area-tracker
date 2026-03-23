const API_BASE_URL = 'https://datadocked.com/api/vessels_operations'

export interface VesselInArea {
  mmsi: string
  name: string
  latitude: string
  longitude: string
  speed: string
  course: string
  heading: string | null
}

export interface VesselsByAreaParams {
  latitude: number
  longitude: number
  circle_radius: number
}

export interface ApiError {
  error: string
  message: string
}

export async function getVesselsByArea(
  params: VesselsByAreaParams,
  apiKey: string
): Promise<VesselInArea[]> {
  // Validate parameters according to API spec
  // Latitude: up to 1 decimal place
  const lat = Math.round(params.latitude * 10) / 10
  // Longitude: up to 1 decimal place
  const lng = Math.round(params.longitude * 10) / 10
  // Radius: max 50km, integer
  const radius = Math.min(Math.round(params.circle_radius), 50)

  const url = new URL(`${API_BASE_URL}/get-vessels-by-area`)
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lng.toString())
  url.searchParams.set('circle_radius', radius.toString())

  console.log(`[DataDocked API] Searching area: lat=${lat}, lng=${lng}, radius=${radius}km`)

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
  console.log(`[DataDocked API] Raw response:`, data)
  console.log(`[DataDocked API] Response type: ${typeof data}, isArray: ${Array.isArray(data)}`)

  // Ensure we always return an array
  if (Array.isArray(data)) {
    return data as VesselInArea[]
  }

  // Handle case where API returns object with vessels array
  if (data && Array.isArray(data.vessels)) {
    return data.vessels as VesselInArea[]
  }

  // Handle case where API returns object with data array
  if (data && Array.isArray(data.data)) {
    return data.data as VesselInArea[]
  }

  // If data has detail property, it's likely an error message
  if (data && data.detail) {
    throw new Error(data.detail)
  }

  // Return empty array if no valid data
  return []
}

export async function getMyCredits(apiKey: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/my-credits`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch credits')
  }

  const data = await response.json()
  return data.detail || 'Unknown credits'
}

export async function getVesselLocation(
  imoOrMmsi: string,
  apiKey: string
): Promise<any> {
  const url = new URL(`${API_BASE_URL}/get-vessel-location`)
  url.searchParams.set('imo_or_mmsi', imoOrMmsi)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API Error: ${response.status}`)
  }

  return response.json()
}

export async function getVesselInfo(
  imoOrMmsi: string,
  apiKey: string
): Promise<any> {
  const url = new URL(`${API_BASE_URL}/get-vessel-info`)
  url.searchParams.set('imo_or_mmsi', imoOrMmsi)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API Error: ${response.status}`)
  }

  return response.json()
}
