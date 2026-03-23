import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Key, ExternalLink, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

interface ApiKeySetupProps {
  apiKey: string | null
  onSave: (key: string) => void
  credits: string | null
  isValidating: boolean
}

export default function ApiKeySetup({
  apiKey,
  onSave,
  credits,
  isValidating,
}: ApiKeySetupProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    if (newKey.trim()) {
      onSave(newKey.trim())
      setNewKey('')
      setDialogOpen(false)
    }
  }

  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-primary" />
          API Configuration
        </CardTitle>
        <CardDescription>
          Your DataDocked API key for vessel data access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKey ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">API Key configured</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
              <code className="text-xs flex-1">
                {showKey ? apiKey : maskedKey}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {credits && (
              <p className="text-sm text-muted-foreground">
                Balance: <span className="font-medium text-foreground">{credits}</span>
              </p>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>No API key configured. Add your key to search for vessels.</span>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              {apiKey ? 'Update API Key' : 'Add API Key'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>DataDocked API Key</DialogTitle>
              <DialogDescription>
                Enter your API key from your DataDocked dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <a
                href="https://datadocked.com/dashboard/my_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Get your API key from DataDocked
              </a>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!newKey.trim() || isValidating}>
                {isValidating ? 'Validating...' : 'Save Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
