import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, MapPin, Trash2, Search } from 'lucide-react'
import { formatCoordinate } from '@/lib/utils'
import type { SavedArea } from '@/types'

interface SavedAreasProps {
  areas: SavedArea[]
  onSelect: (area: SavedArea) => void
  onDelete: (id: string) => void
}

export default function SavedAreas({ areas, onSelect, onDelete }: SavedAreasProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          Saved Areas
        </CardTitle>
        <CardDescription>
          Your saved search areas for quick access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved areas yet. Search an area and save it for later.
          </p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{area.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatCoordinate(area.latitude, 'lat')}, {formatCoordinate(area.longitude, 'lng')}
                      <span className="mx-1">•</span>
                      {area.radius_km}km
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onSelect(area)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(area.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
