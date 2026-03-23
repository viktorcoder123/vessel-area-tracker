import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ship, Navigation, Gauge, Plus, ChevronRight, Filter, X } from 'lucide-react'
import type { VesselInArea } from '@/services/datadocked-api'
import { formatSpeed, formatCourse } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VesselListProps {
  vessels: VesselInArea[]
  selectedVessel: VesselInArea | null
  onVesselSelect: (vessel: VesselInArea | null) => void
  onTrackVessel: (vessel: VesselInArea) => void
  trackedMMSIs: Set<string>
}

interface VesselFilters {
  search: string
  minSpeed: string
  maxSpeed: string
}

export default function VesselList({
  vessels,
  selectedVessel,
  onVesselSelect,
  onTrackVessel,
  trackedMMSIs,
}: VesselListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<VesselFilters>({
    search: '',
    minSpeed: '',
    maxSpeed: '',
  })

  // Safety check - ensure vessels is an array
  const vesselList = Array.isArray(vessels) ? vessels : []

  // Apply filters
  const filteredVessels = vesselList.filter((vessel) => {
    // Search filter (name or MMSI)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = vessel.name?.toLowerCase().includes(searchLower)
      const mmsiMatch = vessel.mmsi.toLowerCase().includes(searchLower)
      if (!nameMatch && !mmsiMatch) return false
    }

    // Speed filters
    const speed = vessel.speed ? parseFloat(vessel.speed) : null
    if (filters.minSpeed && speed !== null) {
      if (speed < parseFloat(filters.minSpeed)) return false
    }
    if (filters.maxSpeed && speed !== null) {
      if (speed > parseFloat(filters.maxSpeed)) return false
    }

    return true
  })

  const clearFilters = () => {
    setFilters({
      search: '',
      minSpeed: '',
      maxSpeed: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  if (vesselList.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ship className="h-5 w-5 text-primary" />
            Vessels in Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No vessels found. Select an area and search to find vessels.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ship className="h-5 w-5 text-primary" />
          Vessels in Area
        </CardTitle>
        <CardDescription>
          {filteredVessels.length === vesselList.length
            ? `${vesselList.length} vessel${vesselList.length !== 1 ? 's' : ''} found`
            : `${filteredVessels.length} of ${vesselList.length} vessels`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
        {/* Filter Controls */}
        <div className="px-6 pb-3 space-y-2">
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
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
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

        <ScrollArea className="flex-1 px-6 pb-6">
          {filteredVessels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No vessels match your filters.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredVessels.map((vessel) => {
                const isSelected = selectedVessel?.mmsi === vessel.mmsi
                const isTracked = trackedMMSIs.has(vessel.mmsi)

                return (
                  <div
                    key={vessel.mmsi}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onClick={() => onVesselSelect(isSelected ? null : vessel)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {vessel.name || 'Unknown Vessel'}
                          </h4>
                          {isTracked && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Tracked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          MMSI: {vessel.mmsi}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform',
                          isSelected && 'rotate-90'
                        )}
                      />
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Gauge className="h-3.5 w-3.5" />
                            <span>Speed: {formatSpeed(vessel.speed)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Navigation className="h-3.5 w-3.5" />
                            <span>Course: {formatCourse(vessel.course)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Position: {parseFloat(vessel.latitude).toFixed(4)}°,{' '}
                          {parseFloat(vessel.longitude).toFixed(4)}°
                        </div>
                        {!isTracked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              onTrackVessel(vessel)
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add to Tracking List
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
