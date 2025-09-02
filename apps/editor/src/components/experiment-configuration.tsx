"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ExperimentConfiguration() {
  const [experimentName, setExperimentName] = useState("Homepage Optimization")
  const [trafficAllocation, setTrafficAllocation] = useState([50])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="setup">
        <TabsList className="w-full">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="experiment-name">Experiment Name</Label>
            <Input id="experiment-name" value={experimentName} onChange={(e) => setExperimentName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experiment-key">Experiment Key</Label>
            <Input id="experiment-key" value={experimentName.toLowerCase().replace(/\s+/g, "-")} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hypothesis">Hypothesis</Label>
            <textarea
              id="hypothesis"
              className="w-full min-h-[80px] p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="What do you expect to happen?"
              defaultValue="Changing the CTA button text will increase conversion rates."
            />
          </div>

          <div className="space-y-2">
            <Label>Traffic Allocation ({trafficAllocation}%)</Label>
            <Slider value={trafficAllocation} onValueChange={setTrafficAllocation} max={100} step={5} />
          </div>
        </TabsContent>

        <TabsContent value="targeting" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="new">New Users</SelectItem>
                <SelectItem value="returning">Returning Users</SelectItem>
                <SelectItem value="mobile">Mobile Users</SelectItem>
                <SelectItem value="desktop">Desktop Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Geographic Location</Label>
            <Select defaultValue="worldwide">
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia Pacific</SelectItem>
                <SelectItem value="custom">Custom Rules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>URL Targeting</Label>
            <Input placeholder="https://example.com/page" defaultValue="https://example.com/" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Specify which pages this experiment should run on
            </p>
          </div>

          <div className="space-y-2">
            <Label>Device Type</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Desktop
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Mobile
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Tablet
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Primary Metric</Label>
            <Select defaultValue="conversions">
              <SelectTrigger>
                <SelectValue placeholder="Select primary metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversions">Conversions</SelectItem>
                <SelectItem value="clicks">Click-through Rate</SelectItem>
                <SelectItem value="engagement">Engagement Rate</SelectItem>
                <SelectItem value="revenue">Revenue per User</SelectItem>
                <SelectItem value="retention">User Retention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Success Criteria</Label>
            <div className="flex gap-2 items-center">
              <span className="text-sm">Increase by at least</span>
              <Input type="number" defaultValue="5" className="w-20" />
              <span className="text-sm">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statistical Significance</Label>
            <Select defaultValue="95">
              <SelectTrigger>
                <SelectValue placeholder="Select confidence level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
                <SelectItem value="99">99%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum Sample Size</Label>
            <Input type="number" defaultValue="1000" placeholder="Number of users" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Minimum number of users needed before analyzing results
            </p>
          </div>

          <div className="space-y-2">
            <Label>Test Duration</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" defaultValue="14" className="w-20" />
              <span className="text-sm">days</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary Metrics</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="bounce-rate" className="rounded" />
                <Label htmlFor="bounce-rate" className="text-sm">
                  Bounce Rate
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="page-views" className="rounded" />
                <Label htmlFor="page-views" className="text-sm">
                  Page Views per Session
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="time-on-site" className="rounded" />
                <Label htmlFor="time-on-site" className="text-sm">
                  Average Time on Site
                </Label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="flex-1">
          Save Draft
        </Button>
        <Button className="flex-1">Launch Experiment</Button>
      </div>
    </div>
  )
}
