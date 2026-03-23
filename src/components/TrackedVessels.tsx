import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bookmark, Trash2, MapPin, RefreshCw } from 'lucide-react'
import { formatSpeed, formatCourse } from '@/lib/utils'
import type { TrackedVessel } from '@/types'

interface TrackedVesselsProps {
  vessels: TrackedVessel[]
  onRemove: (id: string) => void
  onRefresh: (vessel: TrackedVessel) => void
  onLocate: (vessel: TrackedVessel) => void
  isRefreshing: boolean
}

export default function TrackedVessels({
  vessels,
  onRemove,
  onRefresh,
  onLocate,
  isRefreshing,
}: TrackedVesselsProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bookmark className="h-5 w-5 text-primary" />
          Tracked Vessels
        </CardTitle>
        <CardDescription>
          {vessels.length} vessel{vessels.length !== 1 ? 's' : ''} being tracked
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        {vessels.length === 0 ? (
          <div className="px-6 pb-6">
            <p className="text-sm text-muted-foreground text-center py-8">
              No vessels tracked yet. Search an area and add vessels to your tracking list.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-2">
              {vessels.map((vessel) => (
                <div
                  key={vessel.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {vessel.name || 'Unknown Vessel'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        MMSI: {vessel.mmsi}
                      </p>
                    </div>
                  </div>

                  {vessel.latitude && vessel.longitude && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Last seen: {vessel.latitude.toFixed(4)}°, {vessel.longitude.toFixed(4)}°
                      </div>
                      {vessel.speed && (
                        <div className="mt-1">
                          Speed: {formatSpeed(vessel.speed)} | Course: {formatCourse(vessel.course)}
                        </div>
                      )}
                      <div className="mt-1 text-muted-foreground/70">
                        Updated: {new Date(vessel.last_seen).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onLocate(vessel)}
                      disabled={!vessel.latitude || !vessel.longitude}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      Locate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRefresh(vessel)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemove(vessel.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
