import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ExternalLink } from 'lucide-react';

// Mock data - in real app this would come from API
const mockFlags = [
  {
    key: 'webexp_hero_test',
    name: 'Hero Section A/B Test',
    description: 'Testing different hero messaging and CTA buttons',
    status: 'active',
    variations: ['control', 'variant-a', 'variant-b'],
    lastModified: '2024-01-15T10:30:00Z'
  },
  {
    key: 'webexp_pricing_layout',
    name: 'Pricing Page Layout',
    description: 'Optimizing pricing card order and design',
    status: 'draft',
    variations: ['control', 'reordered'],
    lastModified: '2024-01-14T15:45:00Z'
  },
  {
    key: 'webexp_nav_menu',
    name: 'Navigation Menu Test',
    description: 'Testing simplified vs detailed navigation',
    status: 'paused',
    variations: ['control', 'simplified'],
    lastModified: '2024-01-13T09:15:00Z'
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">WebExp Editor</h1>
            <Badge variant="secondary">v1.0</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/demo">
                <ExternalLink className="w-4 h-4 mr-2" />
                Enhanced Demo
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              LaunchDarkly
            </Button>
            <Button variant="outline" size="sm">Settings</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Web Experiments</h2>
            <p className="text-muted-foreground">
              Manage your LaunchDarkly flags with visual drag-and-drop editing
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search flags..."
                className="pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Experiment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockFlags.map((flag) => (
            <Card key={flag.key} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{flag.name}</CardTitle>
                  <Badge 
                    variant={
                      flag.status === 'active' ? 'default' : 
                      flag.status === 'draft' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {flag.status}
                  </Badge>
                </div>
                <CardDescription>{flag.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Flag Key:</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{flag.key}</code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Variations:</p>
                    <div className="flex flex-wrap gap-1">
                      {flag.variations.map((variation) => (
                        <Badge key={variation} variant="outline" className="text-xs">
                          {variation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground">
                      Modified {new Date(flag.lastModified).toLocaleDateString()}
                    </p>
                    <Button asChild size="sm">
                      <Link href={`/experiments/${flag.key}`}>
                        Open Editor
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Experiment
              </CardTitle>
              <CardDescription>
                Select an existing LaunchDarkly flag to start editing variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Browse LaunchDarkly Flags
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
