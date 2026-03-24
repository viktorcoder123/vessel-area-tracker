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

// Create vessel arrow icon as a data URL for use with Mapbox symbols
function createVesselImage(color: string): HTMLImageElement {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Draw arrow pointing up (north) - rotation will be handled by Mapbox
  ctx.translate(size / 2, size / 2)
  ctx.beginPath()
  ctx.moveTo(0, -12)  // top point
  ctx.lineTo(6, 8)    // bottom right
  ctx.lineTo(0, 4)    // bottom center notch
  ctx.lineTo(-6, 8)   // bottom left
  ctx.closePath()

  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const img = new Image(size, size)
  img.src = canvas.toDataURL()
  return img
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
  const areaCircleRef = useRef<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const vesselsRef = useRef<VesselInArea[]>(vessels)

  // Keep vessels ref updated for click handler
  useEffect(() => {
    vesselsRef.current = vessels
  }, [vessels])

  // Use refs to track current values for click handler
  const isSelectingAreaRef = useRef(isSelectingArea)
  const onAreaSelectRef = useRef(onAreaSelect)
  const onVesselSelectRef = useRef(onVesselSelect)

  // Keep refs updated
  useEffect(() => {
    isSelectingAreaRef.current = isSelectingArea
  }, [isSelectingArea])

  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect
  }, [onAreaSelect])

  useEffect(() => {
    onVesselSelectRef.current = onVesselSelect
  }, [onVesselSelect])

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
      if (!map.current) return

      // Custom water and land colors
      map.current.setPaintProperty('water', 'fill-color', '#a8d5e5')
      map.current.setPaintProperty('land', 'background-color', '#f5f0e8')

      // Add vessel images
      const defaultImg = createVesselImage('#0284c7')
      const selectedImg = createVesselImage('#f97316')

      defaultImg.onload = () => {
        if (map.current && !map.current.hasImage('vessel-default')) {
          map.current.addImage('vessel-default', defaultImg, { sdf: false })
        }
      }

      selectedImg.onload = () => {
        if (map.current && !map.current.hasImage('vessel-selected')) {
          map.current.addImage('vessel-selected', selectedImg, { sdf: false })
        }
      }

      // Add empty vessel source
      map.current.addSource('vessels', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      // Add vessel layer
      map.current.addLayer({
        id: 'vessels-layer',
        type: 'symbol',
        source: 'vessels',
        layout: {
          'icon-image': ['case', ['get', 'selected'], 'vessel-selected', 'vessel-default'],
          'icon-size': 0.75,
          'icon-rotate': ['get', 'course'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      })

      // Click handler for vessels
      map.current.on('click', 'vessels-layer', (e) => {
        if (e.features && e.features.length > 0) {
          const mmsi = e.features[0].properties?.mmsi
          const vessel = vesselsRef.current.find((v) => v.mmsi === mmsi)
          if (vessel) {
            onVesselSelectRef.current(vessel)
          }
        }
      })

      // Change cursor on hover
      map.current.on('mouseenter', 'vessels-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer'
        }
      })

      map.current.on('mouseleave', 'vessels-layer', () => {
        if (map.current && !isSelectingAreaRef.current) {
          map.current.getCanvas().style.cursor = ''
        }
      })

      setMapLoaded(true)
    })

    map.current.on('click', (e) => {
      if (isSelectingAreaRef.current) {
        onAreaSelectRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    })

    return () => {
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

  // Update vessel data
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const source = map.current.getSource('vessels') as mapboxgl.GeoJSONSource
    if (!source) return

    const features: GeoJSON.Feature<GeoJSON.Point>[] = vessels.map((vessel) => {
      const lat = parseFloat(vessel.latitude)
      const lng = parseFloat(vessel.longitude)
      const course = parseFloat(vessel.course) || 0
      const isSelected = selectedVessel?.mmsi === vessel.mmsi

      return {
        type: 'Feature' as const,
        properties: {
          mmsi: vessel.mmsi,
          name: vessel.name,
          course: course,
          selected: isSelected,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat],
        },
      }
    }).filter((f) => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]))

    source.setData({
      type: 'FeatureCollection',
      features,
    })
  }, [vessels, selectedVessel, mapLoaded])

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
