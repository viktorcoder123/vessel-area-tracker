import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowLeft, HelpCircle, Key } from 'lucide-react'
import Footer from '@/components/Footer'

export default function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-background to-ocean-100 flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
            <p className="text-muted-foreground">
              Everything you need to know about using Vessel Area Tracker
            </p>
          </div>

          {/* Quick Start */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Get Your API Key</h4>
                  <p className="text-muted-foreground text-sm">
                    Visit <a href="https://datadocked.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">datadocked.com</a> to get your free API key. Enter it in the Settings panel.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Create an Area</h4>
                  <p className="text-muted-foreground text-sm">
                    Click on the map to set a center point, adjust the radius slider, give it a name, and click "Save Area".
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Scan for Vessels</h4>
                  <p className="text-muted-foreground text-sm">
                    Go to the "Results" tab, find your area, and click "Scan Now" to detect vessels in that area.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="api-key">
                  <AccordionTrigger>Where do I get an API key?</AccordionTrigger>
                  <AccordionContent>
                    You can get a free API key by signing up at <a href="https://datadocked.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">datadocked.com</a>. The free tier includes a generous number of API calls per month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="auto-scan">
                  <AccordionTrigger>How does auto-monitoring work?</AccordionTrigger>
                  <AccordionContent>
                    When you enable auto-monitoring for an area, the system will automatically scan for vessels at your chosen interval (5 min to 24 hours). Any detected vessels are saved to your sighting history. Note: Auto-scanning requires the app to remain open in your browser.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vessel-data">
                  <AccordionTrigger>What vessel data is available?</AccordionTrigger>
                  <AccordionContent>
                    For each vessel, you'll see: MMSI (unique identifier), vessel name, position (lat/lon), speed in knots, course in degrees, heading, and the timestamp when it was spotted. All data comes from AIS (Automatic Identification System) transmissions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="csv-export">
                  <AccordionTrigger>How do I export my data?</AccordionTrigger>
                  <AccordionContent>
                    In the Results tab, each area has an "Export CSV" button. This downloads all sightings for that area (filtered if you have filters active) as a CSV file that can be opened in Excel or Google Sheets.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="multiple-areas">
                  <AccordionTrigger>Can I monitor multiple areas?</AccordionTrigger>
                  <AccordionContent>
                    Yes! You can create as many monitoring areas as you need. Each area maintains its own sighting history and can have auto-monitoring enabled independently.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="radius">
                  <AccordionTrigger>What's the maximum area radius?</AccordionTrigger>
                  <AccordionContent>
                    You can set a radius from 1 km to 100 km. Larger areas will typically detect more vessels but may include traffic you're not interested in. Start with a smaller radius and adjust as needed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account">
                  <AccordionTrigger>Is my account the same as datadocked.com?</AccordionTrigger>
                  <AccordionContent>
                    No, your Vessel Area Tracker account is separate from your datadocked.com account. You need to create a new account specifically for this app, even if you already have a DataDocked account.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions or need assistance, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a href="mailto:support@datadocked.com" className="text-primary hover:underline">
                    support@datadocked.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">API Documentation:</span>{' '}
                  <a href="https://datadocked.com/docs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    datadocked.com/docs
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
