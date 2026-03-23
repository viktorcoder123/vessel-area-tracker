import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MapPin, Radar, Ship, Download, Bell } from 'lucide-react'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-background to-ocean-100 flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center mb-12">
            <img src="/logo.png" alt="Data Docked" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Vessel Area Tracker</h1>
            <p className="text-xl text-muted-foreground">
              Track vessels passing through any area in real-time
            </p>
          </div>

          {/* How It Works */}
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Define Your Area</h3>
                <p className="text-muted-foreground text-sm">
                  Click on the map to set a center point and radius for the area you want to monitor.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Scan for Vessels</h3>
                <p className="text-muted-foreground text-sm">
                  Scan manually or enable auto-scanning to detect vessels at regular intervals.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ship className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Track & Export</h3>
                <p className="text-muted-foreground text-sm">
                  View vessel details, track sightings over time, and export data to CSV.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <h2 className="text-2xl font-bold text-center mb-8">Features</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6 flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Auto-Monitoring</h3>
                  <p className="text-muted-foreground text-sm">
                    Set up automatic scanning at intervals from 5 minutes to 24 hours. Never miss a vessel passing through your area.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">CSV Export</h3>
                  <p className="text-muted-foreground text-sm">
                    Export all vessel sightings with full details including position, speed, course, and timestamps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Multiple Areas</h3>
                  <p className="text-muted-foreground text-sm">
                    Monitor multiple geographic areas simultaneously. Each area has its own sighting history.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Radar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-Time AIS Data</h3>
                  <p className="text-muted-foreground text-sm">
                    Powered by DataDocked's maritime API with live AIS vessel tracking data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/dashboard">
              <Button size="lg" className="px-8">
                Start Tracking Vessels
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
