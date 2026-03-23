import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Radar,
  RefreshCw,
  Ship,
  Filter,
  Download,
  Clock,
  Navigation,
  Gauge,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatSpeed, formatCourse, cn } from '@/lib/utils'
import type { SavedArea, AreaSighting } from '@/types'
import type { VesselInArea } from '@/services/datadocked-api'

interface AreaMonitorProps {
  area: SavedArea
  sightings: AreaSighting[]
  onScan: () => Promise<VesselInArea[]>
  onToggleMonitoring: (areaId: string, enabled: boolean, intervalMinutes: number) => void
  onSaveSightings: (vessels: VesselInArea[]) => Promise<void>
  isScanning: boolean
  apiKey: string | null
}

interface SightingFilters {
  search: string
  dateFrom: string
  dateTo: string
  minSpeed: string
  maxSpeed: string
}

export default function AreaMonitor({
  area,
  sightings,
  onScan,
  onToggleMonitoring,
  onSaveSightings,
  isScanning,
  apiKey,
}: AreaMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(area.monitor_interval_minutes || 60)
  const [filters, setFilters] = useState<SightingFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    minSpeed: '',
    maxSpeed: '',
  })

  // Auto-scan effect
  useEffect(() => {
    if (!area.is_monitoring || !apiKey) return

    const interval = setInterval(async () => {
      try {
        const vessels = await onScan()
        if (vessels.length > 0) {
          await onSaveSightings(vessels)
        }
      } catch (e) {
        console.error('Auto-scan failed:', e)
      }
    }, intervalMinutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [area.is_monitoring, intervalMinutes, apiKey, onScan, onSaveSightings])

  // Filter sightings
  const filteredSightings = sightings.filter((s) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (
        !s.name?.toLowerCase().includes(searchLower) &&
        !s.mmsi.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      if (new Date(s.spotted_at) < from) return false
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      if (new Date(s.spotted_at) > to) return false
    }
    if (filters.minSpeed && s.speed !== null) {
      if (s.speed < parseFloat(filters.minSpeed)) return false
    }
    if (filters.maxSpeed && s.speed !== null) {
      if (s.speed > parseFloat(filters.maxSpeed)) return false
    }
    return true
  })

  // Get unique vessels from sightings
  const uniqueVessels = new Map<string, AreaSighting>()
  filteredSightings.forEach((s) => {
    if (!uniqueVessels.has(s.mmsi) || new Date(s.spotted_at) > new Date(uniqueVessels.get(s.mmsi)!.spotted_at)) {
      uniqueVessels.set(s.mmsi, s)
    }
  })

  const handleManualScan = async () => {
    try {
      const vessels = await onScan()
      if (vessels.length > 0) {
        await onSaveSightings(vessels)
      }
    } catch (e) {
      console.error('Manual scan failed:', e)
    }
  }

  const handleExportCSV = () => {
    const headers = [
      'MMSI',
      'Name',
      'Latitude',
      'Longitude',
      'Speed (kn)',
      'Course (deg)',
      'Heading (deg)',
      'Spotted At (UTC)',
      'Area Name',
      'Area Latitude',
      'Area Longitude',
      'Area Radius (km)',
    ]
    const rows = filteredSightings.map((s) => [
      s.mmsi,
      `"${(s.name || 'Unknown').replace(/"/g, '""')}"`,
      s.latitude?.toFixed(6) || '',
      s.longitude?.toFixed(6) || '',
      s.speed?.toFixed(1) || '',
      s.course?.toFixed(1) || '',
      s.heading?.toFixed(1) || '',
      new Date(s.spotted_at).toISOString(),
      `"${area.name.replace(/"/g, '""')}"`,
      area.latitude.toFixed(6),
      area.longitude.toFixed(6),
      area.radius_km.toString(),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${area.name.replace(/\s+/g, '_')}_sightings_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      minSpeed: '',
      maxSpeed: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className={cn('h-5 w-5', area.is_monitoring ? 'text-green-500 animate-pulse' : 'text-muted-foreground')} />
            <CardTitle className="text-lg">{area.name}</CardTitle>
            {area.is_monitoring && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Monitoring
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        <CardDescription>
          {uniqueVessels.size} unique vessels • {filteredSightings.length} total sightings
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Monitoring Controls */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch
                id={`monitor-${area.id}`}
                checked={area.is_monitoring}
                onCheckedChange={(checked) => onToggleMonitoring(area.id, checked, intervalMinutes)}
                disabled={!apiKey}
              />
              <Label htmlFor={`monitor-${area.id}`} className="text-sm">
                Auto-scan
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Every</Label>
              <Select
                value={intervalMinutes.toString()}
                onValueChange={(v) => {
                  const mins = parseInt(v)
                  setIntervalMinutes(mins)
                  if (area.is_monitoring) {
                    onToggleMonitoring(area.id, true, mins)
                  }
                }}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="360">6 hours</SelectItem>
                  <SelectItem value="720">12 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <Button
              size="sm"
              variant="outline"
              onClick={handleManualScan}
              disabled={isScanning || !apiKey}
            >
              <RefreshCw className={cn('h-4 w-4 mr-1', isScanning && 'animate-spin')} />
              Scan Now
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showFilters ? 'secondary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {Object.values(filters).filter((v) => v !== '').length}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              <div className="flex-1" />

              <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={filteredSightings.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Search (name or MMSI)</Label>
                  <Input
                    placeholder="Search vessels..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Speed (kn)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minSpeed}
                    onChange={(e) => setFilters((f) => ({ ...f, minSpeed: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Speed (kn)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={filters.maxSpeed}
                    onChange={(e) => setFilters((f) => ({ ...f, maxSpeed: e.target.value }))}
                    className="h-8"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Sightings List */}
          {filteredSightings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sightings yet</p>
              <p className="text-xs mt-1">Click "Scan Now" to detect vessels in this area</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredSightings.map((sighting) => (
                  <div
                    key={sighting.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-primary flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate">
                            {sighting.name || 'Unknown Vessel'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          MMSI: {sighting.mmsi}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(sighting.spotted_at).toLocaleDateString()}
                        </div>
                        <div>{new Date(sighting.spotted_at).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {sighting.speed !== null && (
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {formatSpeed(sighting.speed)}
                        </div>
                      )}
                      {sighting.course !== null && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {formatCourse(sighting.course)}
                        </div>
                      )}
                      {sighting.latitude && sighting.longitude && (
                        <div>
                          {sighting.latitude.toFixed(4)}°, {sighting.longitude.toFixed(4)}°
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Summary Stats */}
          {filteredSightings.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
              <div>
                <span className="font-medium text-foreground">{uniqueVessels.size}</span> unique vessels
              </div>
              <div>
                <span className="font-medium text-foreground">{filteredSightings.length}</span> total sightings
              </div>
              {filteredSightings.length > 0 && (
                <div>
                  First:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(
                      Math.min(...filteredSightings.map((s) => new Date(s.spotted_at).getTime()))
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
