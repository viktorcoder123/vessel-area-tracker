import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MapPin, Target, Save, Crosshair } from 'lucide-react'
import { formatCoordinate } from '@/lib/utils'

interface AreaSelectorProps {
  center: { lat: number; lng: number } | null
  radius: number
  onCenterChange: (center: { lat: number; lng: number }) => void
  onRadiusChange: (radius: number) => void
  onSearch: () => void
  onSaveArea: (name: string) => void
  isSelectingOnMap: boolean
  onToggleMapSelection: () => void
  isLoading: boolean
}

export default function AreaSelector({
  center,
  radius,
  onCenterChange,
  onRadiusChange,
  onSearch,
  onSaveArea,
  isSelectingOnMap,
  onToggleMapSelection,
  isLoading,
}: AreaSelectorProps) {
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [areaName, setAreaName] = useState('')

  // Sync manual inputs with center when it changes (e.g., from map selection)
  useEffect(() => {
    if (center) {
      setManualLat(center.lat.toFixed(1))
      setManualLng(center.lng.toFixed(1))
    }
  }, [center])

  const handleManualInput = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onCenterChange({ lat, lng })
    }
  }

  const handleSave = () => {
    if (areaName.trim()) {
      onSaveArea(areaName.trim())
      setAreaName('')
      setSaveDialogOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Search Area
        </CardTitle>
        <CardDescription>
          Define the area to search for vessels (max 50km radius)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Selection Toggle */}
        <Button
          variant={isSelectingOnMap ? 'default' : 'outline'}
          className="w-full"
          onClick={onToggleMapSelection}
        >
          <Crosshair className="mr-2 h-4 w-4" />
          {isSelectingOnMap ? 'Click on map to select...' : 'Select on Map'}
        </Button>

        {/* Manual Coordinate Input */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.1"
              min="-90"
              max="90"
              placeholder="e.g., 45.0"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={handleManualInput}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.1"
              min="-180"
              max="180"
              placeholder="e.g., -9.0"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              onBlur={handleManualInput}
            />
          </div>
        </div>

        {/* Current Selection Display */}
        {center && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded-md">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {formatCoordinate(center.lat, 'lat')}, {formatCoordinate(center.lng, 'lng')}
            </span>
          </div>
        )}

        {/* Radius Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Radius</Label>
            <span className="text-sm font-medium">{radius} km</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={([value]) => onRadiusChange(value)}
            min={1}
            max={50}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            API cost: 10 credits per search
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={onSearch}
            disabled={!center || isLoading}
          >
            {isLoading ? 'Searching...' : 'Search Vessels'}
          </Button>

          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" disabled={!center}>
                <Save className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search Area</DialogTitle>
                <DialogDescription>
                  Save this area for quick access later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="area-name">Area Name</Label>
                <Input
                  id="area-name"
                  placeholder="e.g., Port of Rotterdam"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Area</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
