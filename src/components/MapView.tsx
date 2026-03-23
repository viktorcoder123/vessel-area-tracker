import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { VesselInArea } from '@/services/datadocked-api'

interface MapViewProps {
  vessels: VesselInArea[]
  selectedVessel: VesselInArea | null
  onVesselSelect: (vessel: VesselInArea | null) => void
  areaCenter: { lat: number; lng: number } | null
  areaRadius: number
  onAreaSelect: (center: { lat: number; lng: number }) => void
  isSelectingArea: boolean
}

export default function MapView({
  vessels,
  selectedVessel,
  onVesselSelect,
  areaCenter,
  areaRadius,
  onAreaSelect,
  isSelectingArea,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const areaCircleRef = useRef<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Use refs to track current values for click handler
  const isSelectingAreaRef = useRef(isSelectingArea)
  const onAreaSelectRef = useRef(onAreaSelect)

  // Keep refs updated
  useEffect(() => {
    isSelectingAreaRef.current = isSelectingArea
  }, [isSelectingArea])

  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect
  }, [onAreaSelect])

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 30],
      zoom: 2,
      projection: 'mercator',
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)

      // Custom water and land colors
      map.current?.setPaintProperty('water', 'fill-color', '#a8d5e5')
      map.current?.setPaintProperty('land', 'background-color', '#f5f0e8')
    })

    map.current.on('click', (e) => {
      if (isSelectingAreaRef.current) {
        onAreaSelectRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
      map.current?.remove()
    }
  }, [mapboxToken])

  // Update cursor when selecting area
  useEffect(() => {
    if (!map.current) return
    map.current.getCanvas().style.cursor = isSelectingArea ? 'crosshair' : ''
  }, [isSelectingArea])

  // Draw area circle
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing circle
    if (areaCircleRef.current) {
      if (map.current.getLayer('area-circle-fill')) {
        map.current.removeLayer('area-circle-fill')
      }
      if (map.current.getLayer('area-circle-stroke')) {
        map.current.removeLayer('area-circle-stroke')
      }
      if (map.current.getSource('area-circle')) {
        map.current.removeSource('area-circle')
      }
      areaCircleRef.current = null
    }

    if (!areaCenter) return

    // Create circle GeoJSON
    const circleGeoJSON = createCircleGeoJSON(areaCenter, areaRadius)

    map.current.addSource('area-circle', {
      type: 'geojson',
      data: circleGeoJSON,
    })

    map.current.addLayer({
      id: 'area-circle-fill',
      type: 'fill',
      source: 'area-circle',
      paint: {
        'fill-color': '#0ea5e9',
        'fill-opacity': 0.15,
      },
    })

    map.current.addLayer({
      id: 'area-circle-stroke',
      type: 'line',
      source: 'area-circle',
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 2,
        'line-dasharray': [3, 2],
      },
    })

    areaCircleRef.current = 'area-circle'

    // Fly to area
    map.current.flyTo({
      center: [areaCenter.lng, areaCenter.lat],
      zoom: calculateZoomLevel(areaRadius),
      duration: 1500,
    })
  }, [areaCenter, areaRadius, mapLoaded])

  // Update vessel markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove markers for vessels no longer in the list
    const currentMMSIs = new Set(vessels.map((v) => v.mmsi))
    markersRef.current.forEach((marker, mmsi) => {
      if (!currentMMSIs.has(mmsi)) {
        marker.remove()
        markersRef.current.delete(mmsi)
      }
    })

    // Add or update markers
    vessels.forEach((vessel) => {
      const lat = parseFloat(vessel.latitude)
      const lng = parseFloat(vessel.longitude)
      if (isNaN(lat) || isNaN(lng)) return

      const isSelected = selectedVessel?.mmsi === vessel.mmsi

      if (markersRef.current.has(vessel.mmsi)) {
        // Update existing marker
        const marker = markersRef.current.get(vessel.mmsi)!
        marker.setLngLat([lng, lat])
        const el = marker.getElement()
        el.className = `vessel-marker ${isSelected ? 'selected' : ''}`
        el.innerHTML = createVesselIcon(vessel, isSelected)
      } else {
        // Create new marker
        const el = document.createElement('div')
        el.className = `vessel-marker ${isSelected ? 'selected' : ''}`
        el.style.width = '24px'
        el.style.height = '24px'
        el.style.cursor = 'pointer'
        el.innerHTML = createVesselIcon(vessel, isSelected)
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onVesselSelect(isSelected ? null : vessel)
        })

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([lng, lat])
          .addTo(map.current!)

        markersRef.current.set(vessel.mmsi, marker)
      }
    })
  }, [vessels, selectedVessel, mapLoaded, onVesselSelect])

  // Fly to selected vessel
  useEffect(() => {
    if (!map.current || !selectedVessel) return

    const lat = parseFloat(selectedVessel.latitude)
    const lng = parseFloat(selectedVessel.longitude)
    if (isNaN(lat) || isNaN(lng)) return

    map.current.flyTo({
      center: [lng, lat],
      zoom: 10,
      duration: 1500,
    })
  }, [selectedVessel])

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Please set VITE_MAPBOX_TOKEN in your .env file to display the map.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className="h-full w-full" />
}

function createVesselIcon(vessel: VesselInArea, isSelected: boolean): string {
  const color = isSelected ? '#f97316' : '#0284c7'
  const course = parseFloat(vessel.course) || 0

  return `
    <svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(${course}deg)">
      <path
        d="M12 2 L18 20 L12 16 L6 20 Z"
        fill="${color}"
        stroke="white"
        stroke-width="1.5"
      />
    </svg>
  `
}

function createCircleGeoJSON(
  center: { lat: number; lng: number },
  radiusKm: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64
  const coords: [number, number][] = []

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = radiusKm * Math.cos(angle)
    const dy = radiusKm * Math.sin(angle)

    // Convert km to degrees (approximate)
    const lat = center.lat + (dy / 111.32)
    const lng = center.lng + (dx / (111.32 * Math.cos(center.lat * Math.PI / 180)))

    coords.push([lng, lat])
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}

function calculateZoomLevel(radiusKm: number): number {
  // Approximate zoom level based on radius
  if (radiusKm <= 5) return 12
  if (radiusKm <= 10) return 11
  if (radiusKm <= 20) return 10
  if (radiusKm <= 30) return 9
  return 8
}
