import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { getVesselsByArea, getMyCredits, getVesselLocation, type VesselInArea } from '@/services/datadocked-api'
import type { SavedArea, TrackedVessel, AreaSighting } from '@/types'

import MapView from '@/components/MapView'
import AreaSelector from '@/components/AreaSelector'
import VesselList from '@/components/VesselList'
import TrackedVessels from '@/components/TrackedVessels'
import SavedAreas from '@/components/SavedAreas'
import ApiKeySetup from '@/components/ApiKeySetup'
import AreaMonitor from '@/components/AreaMonitor'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { LogOut, Menu, X, Ship, Bookmark, Radar, HelpCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast, error: showError, success: showSuccess } = useToast()
  const navigate = useNavigate()

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [credits, setCredits] = useState<string | null>(null)
  const [isValidatingKey, setIsValidatingKey] = useState(false)

  const [areaCenter, setAreaCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [areaRadius, setAreaRadius] = useState(25)
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [vessels, setVessels] = useState<VesselInArea[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselInArea | null>(null)

  const [savedAreas, setSavedAreas] = useState<SavedArea[]>([])
  const [trackedVessels, setTrackedVessels] = useState<TrackedVessel[]>([])
  const [isRefreshingVessel, setIsRefreshingVessel] = useState(false)

  // Area monitoring state
  const [areaSightings, setAreaSightings] = useState<Map<string, AreaSighting[]>>(new Map())
  const [isScanningArea, setIsScanningArea] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  // Load user profile and data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      // Load profile with API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('user_id', user.id)
        .single() as { data: { api_key: string | null } | null }

      if (profile?.api_key) {
        setApiKey(profile.api_key)
        // Fetch credits
        try {
          const creditsInfo = await getMyCredits(profile.api_key)
          setCredits(creditsInfo)
        } catch (e) {
          console.error('Failed to fetch credits:', e)
        }
      }

      // Load saved areas
      const { data: areas } = await supabase
        .from('saved_areas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as { data: SavedArea[] | null }

      if (areas) {
        setSavedAreas(areas)
        // Load sightings for each area
        for (const area of areas) {
          loadAreaSightings(area.id)
        }
      }

      // Load tracked vessels
      const { data: tracked } = await supabase
        .from('tracked_vessels')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false }) as { data: TrackedVessel[] | null }

      if (tracked) setTrackedVessels(tracked)
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }

  const loadAreaSightings = async (areaId: string) => {
    try {
      const { data } = await supabase
        .from('area_sightings')
        .select('*')
        .eq('area_id', areaId)
        .order('spotted_at', { ascending: false })
        .limit(500) as { data: AreaSighting[] | null }

      if (data) {
        setAreaSightings((prev) => new Map(prev).set(areaId, data))
      }
    } catch (e) {
      console.error('Failed to load sightings for area:', areaId, e)
    }
  }

  const handleSaveApiKey = async (key: string) => {
    if (!user) return

    setIsValidatingKey(true)
    try {
      // Validate key by fetching credits
      const creditsInfo = await getMyCredits(key)
      setCredits(creditsInfo)

      // Save to profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          api_key: key,
          updated_at: new Date().toISOString(),
        } as never, { onConflict: 'user_id' })

      if (error) throw error

      setApiKey(key)
      showSuccess('API key saved', 'Your DataDocked API key has been configured.')
    } catch (e: unknown) {
      const error = e as Error
      showError('Invalid API key', error.message || 'Please check your API key and try again.')
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleSearchVessels = async () => {
    if (!areaCenter || !apiKey) return

    setIsSearching(true)
    try {
      const results = await getVesselsByArea(
        {
          latitude: areaCenter.lat,
          longitude: areaCenter.lng,
          circle_radius: areaRadius,
        },
        apiKey
      )

      setVessels(results)
      setSelectedVessel(null)

      if (results.length === 0) {
        toast({ title: 'No vessels found in this area' })
      } else {
        showSuccess(`Found ${results.length} vessels`)
      }

      // Refresh credits
      try {
        const creditsInfo = await getMyCredits(apiKey)
        setCredits(creditsInfo)
      } catch (e) {
        console.error('Failed to refresh credits:', e)
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Search failed', error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSaveArea = async (name: string) => {
    if (!user || !areaCenter) return

    try {
      const { data, error } = await supabase
        .from('saved_areas')
        .insert({
          user_id: user.id,
          name,
          latitude: areaCenter.lat,
          longitude: areaCenter.lng,
          radius_km: areaRadius,
        } as never)
        .select()
        .single() as { data: SavedArea | null; error: unknown }

      if (error) throw error

      if (data) {
        setSavedAreas((prev) => [data, ...prev])
        showSuccess('Area saved', `"${name}" has been saved to your areas.`)
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to save area', error.message)
    }
  }

  const handleSelectSavedArea = (area: SavedArea) => {
    setAreaCenter({ lat: area.latitude, lng: area.longitude })
    setAreaRadius(area.radius_km)
  }

  const handleDeleteArea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_areas')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSavedAreas((prev) => prev.filter((a) => a.id !== id))
      showSuccess('Area deleted')
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to delete area', error.message)
    }
  }

  const handleTrackVessel = async (vessel: VesselInArea) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tracked_vessels')
        .insert({
          user_id: user.id,
          mmsi: vessel.mmsi,
          name: vessel.name,
          latitude: parseFloat(vessel.latitude),
          longitude: parseFloat(vessel.longitude),
          speed: vessel.speed ? parseFloat(vessel.speed) : null,
          course: vessel.course ? parseFloat(vessel.course) : null,
          heading: vessel.heading ? parseFloat(vessel.heading) : null,
          raw_data: vessel,
        } as never)
        .select()
        .single() as { data: TrackedVessel | null; error: unknown }

      if (error) throw error

      if (data) {
        setTrackedVessels((prev) => [data, ...prev])
        showSuccess('Vessel tracked', `${vessel.name || vessel.mmsi} added to your tracking list.`)
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to track vessel', error.message)
    }
  }

  const handleRemoveTrackedVessel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tracked_vessels')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTrackedVessels((prev) => prev.filter((v) => v.id !== id))
      showSuccess('Vessel removed from tracking')
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to remove vessel', error.message)
    }
  }

  const handleRefreshVessel = async (vessel: TrackedVessel) => {
    if (!apiKey) return

    setIsRefreshingVessel(true)
    try {
      const location = await getVesselLocation(vessel.mmsi, apiKey)
      const detail = location.detail

      if (detail) {
        const { error } = await supabase
          .from('tracked_vessels')
          .update({
            latitude: detail.latitude ? parseFloat(detail.latitude) : null,
            longitude: detail.longitude ? parseFloat(detail.longitude) : null,
            speed: detail.speed ? parseFloat(detail.speed) : null,
            course: detail.course ? parseFloat(detail.course) : null,
            last_seen: new Date().toISOString(),
            raw_data: detail,
          } as never)
          .eq('id', vessel.id)

        if (error) throw error

        // Update local state
        setTrackedVessels((prev) =>
          prev.map((v) =>
            v.id === vessel.id
              ? {
                  ...v,
                  latitude: detail.latitude ? parseFloat(detail.latitude) : null,
                  longitude: detail.longitude ? parseFloat(detail.longitude) : null,
                  speed: detail.speed ? parseFloat(detail.speed) : null,
                  course: detail.course ? parseFloat(detail.course) : null,
                  last_seen: new Date().toISOString(),
                }
              : v
          )
        )

        showSuccess('Vessel location updated')
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to refresh vessel', error.message)
    } finally {
      setIsRefreshingVessel(false)
    }
  }

  const handleLocateVessel = (vessel: TrackedVessel) => {
    if (vessel.latitude && vessel.longitude) {
      setAreaCenter({ lat: vessel.latitude, lng: vessel.longitude })
    }
  }

  // Area monitoring handlers
  const handleScanArea = useCallback(async (area: SavedArea): Promise<VesselInArea[]> => {
    if (!apiKey) return []

    setIsScanningArea(area.id)
    try {
      const results = await getVesselsByArea(
        {
          latitude: area.latitude,
          longitude: area.longitude,
          circle_radius: area.radius_km,
        },
        apiKey
      )

      // Refresh credits
      try {
        const creditsInfo = await getMyCredits(apiKey)
        setCredits(creditsInfo)
      } catch (e) {
        console.error('Failed to refresh credits:', e)
      }

      return results
    } finally {
      setIsScanningArea(null)
    }
  }, [apiKey])

  const handleSaveSightings = useCallback(async (area: SavedArea, vessels: VesselInArea[]) => {
    if (!user) return

    const now = new Date().toISOString()
    const sightingsToInsert = vessels.map((v) => ({
      user_id: user.id,
      area_id: area.id,
      mmsi: v.mmsi,
      name: v.name || null,
      latitude: parseFloat(v.latitude),
      longitude: parseFloat(v.longitude),
      speed: v.speed ? parseFloat(v.speed) : null,
      course: v.course ? parseFloat(v.course) : null,
      heading: v.heading ? parseFloat(v.heading) : null,
      spotted_at: now,
      raw_data: v,
    }))

    try {
      const { data, error } = await supabase
        .from('area_sightings')
        .insert(sightingsToInsert as never)
        .select() as { data: AreaSighting[] | null; error: unknown }

      if (error) throw error

      if (data) {
        setAreaSightings((prev) => {
          const existing = prev.get(area.id) || []
          return new Map(prev).set(area.id, [...data, ...existing])
        })
        showSuccess(`Recorded ${vessels.length} vessel sightings`)
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to save sightings', error.message)
    }
  }, [user, showSuccess, showError])

  const handleToggleMonitoring = async (areaId: string, enabled: boolean, intervalMinutes: number) => {
    try {
      const { error } = await supabase
        .from('saved_areas')
        .update({
          is_monitoring: enabled,
          monitor_interval_minutes: intervalMinutes,
        } as never)
        .eq('id', areaId)

      if (error) throw error

      setSavedAreas((prev) =>
        prev.map((a) =>
          a.id === areaId
            ? { ...a, is_monitoring: enabled, monitor_interval_minutes: intervalMinutes }
            : a
        )
      )

      if (enabled) {
        showSuccess('Monitoring enabled', `Area will be scanned every ${intervalMinutes} minutes`)
      } else {
        toast({ title: 'Monitoring paused' })
      }
    } catch (e: unknown) {
      const error = e as Error
      showError('Failed to update monitoring', error.message)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const trackedMMSIs = new Set(trackedVessels.map((v) => v.mmsi))

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <img src="/logo.png" alt="Data Docked" className="h-8 w-auto" />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <h1 className="font-semibold hidden sm:block">Vessel Area Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/about">
            <Button variant="ghost" size="sm">
              <Info className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">About</span>
            </Button>
          </Link>
          <Link to="/help">
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Help</span>
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground hidden md:block">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } border-r bg-card transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <ApiKeySetup
                apiKey={apiKey}
                onSave={handleSaveApiKey}
                credits={credits}
                isValidating={isValidatingKey}
              />

              <AreaSelector
                center={areaCenter}
                radius={areaRadius}
                onCenterChange={setAreaCenter}
                onRadiusChange={setAreaRadius}
                onSearch={handleSearchVessels}
                onSaveArea={handleSaveArea}
                isSelectingOnMap={isSelectingArea}
                onToggleMapSelection={() => setIsSelectingArea(!isSelectingArea)}
                isLoading={isSearching}
              />

              <SavedAreas
                areas={savedAreas}
                onSelect={handleSelectSavedArea}
                onDelete={handleDeleteArea}
              />
            </div>
          </ScrollArea>
        </aside>

        {/* Map and Vessel Panel */}
        <main className="flex-1 flex min-w-0">
          {/* Map */}
          <div className="flex-1 relative">
            <MapView
              vessels={vessels}
              selectedVessel={selectedVessel}
              onVesselSelect={setSelectedVessel}
              areaCenter={areaCenter}
              areaRadius={areaRadius}
              onAreaSelect={(center) => {
                setAreaCenter(center)
                setIsSelectingArea(false)
              }}
              isSelectingArea={isSelectingArea}
            />
          </div>

          {/* Right Panel - Vessel Lists */}
          <aside className="w-96 border-l bg-card hidden lg:flex flex-col">
            <Tabs defaultValue="results" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 grid grid-cols-3">
                <TabsTrigger value="results" className="flex items-center gap-1.5">
                  <Ship className="h-4 w-4" />
                  Results
                </TabsTrigger>
                <TabsTrigger value="monitor" className="flex items-center gap-1.5">
                  <Radar className="h-4 w-4" />
                  Monitor
                </TabsTrigger>
                <TabsTrigger value="tracked" className="flex items-center gap-1.5">
                  <Bookmark className="h-4 w-4" />
                  Tracked
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="flex-1 m-0 mt-4 min-h-0">
                <VesselList
                  vessels={vessels}
                  selectedVessel={selectedVessel}
                  onVesselSelect={setSelectedVessel}
                  onTrackVessel={handleTrackVessel}
                  trackedMMSIs={trackedMMSIs}
                />
              </TabsContent>

              <TabsContent value="monitor" className="flex-1 m-0 mt-4 min-h-0 overflow-hidden">
                <ScrollArea className="h-full px-4 pb-4">
                  {savedAreas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No saved areas to monitor</p>
                      <p className="text-xs mt-1">Save an area to start tracking vessels over time</p>
                    </div>
                  ) : (
                    savedAreas.map((area) => (
                      <AreaMonitor
                        key={area.id}
                        area={area}
                        sightings={areaSightings.get(area.id) || []}
                        onScan={() => handleScanArea(area)}
                        onToggleMonitoring={handleToggleMonitoring}
                        onSaveSightings={(vessels) => handleSaveSightings(area, vessels)}
                        isScanning={isScanningArea === area.id}
                        apiKey={apiKey}
                      />
                    ))
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tracked" className="flex-1 m-0 mt-4 min-h-0">
                <TrackedVessels
                  vessels={trackedVessels}
                  onRemove={handleRemoveTrackedVessel}
                  onRefresh={handleRefreshVessel}
                  onLocate={handleLocateVessel}
                  isRefreshing={isRefreshingVessel}
                />
              </TabsContent>
            </Tabs>
          </aside>
        </main>
      </div>
    </div>
  )
}
