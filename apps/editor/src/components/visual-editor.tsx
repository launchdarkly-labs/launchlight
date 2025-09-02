"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function VisualEditor() {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  return (
    <div className="relative border rounded-md h-[600px] bg-white dark:bg-gray-800 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 p-2 flex items-center gap-2 z-10">
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-mouse-pointer mr-1"
          >
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="m13 13 6 6" />
          </svg>
          Select
        </Button>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-type mr-1"
          >
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" x2="15" y1="20" y2="20" />
            <line x1="12" x2="12" y1="4" y2="20" />
          </svg>
          Text
        </Button>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-palette mr-1"
          >
            <circle cx="13.5" cy="6.5" r=".5" />
            <circle cx="17.5" cy="10.5" r=".5" />
            <circle cx="8.5" cy="7.5" r=".5" />
            <circle cx="6.5" cy="12.5" r=".5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          Style
        </Button>
        <Button variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-image mr-1"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          Image
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-undo-2 mr-1"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
            Undo
          </Button>
          <Button variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-redo-2 mr-1"
            >
              <path d="m15 14 5-5-5-5" />
              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
            </svg>
            Redo
          </Button>
        </div>
      </div>

      {/* Website Preview */}
      <div className="pt-12 h-full overflow-auto">
        <div className="p-6">
          {/* Sample website content for editing */}
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center" data-webexp-container="true">
              <h1
                id="title"
                className="text-3xl font-bold mb-4 hover:outline hover:outline-blue-500 hover:outline-2 cursor-pointer"
                onClick={() => setSelectedElement("title")}
                data-testid="hero-title"
              >
                Welcome to Our Website
              </h1>
              <p
                id="subtitle"
                className="text-lg text-gray-600 dark:text-gray-300 hover:outline hover:outline-blue-500 hover:outline-2 cursor-pointer"
                onClick={() => setSelectedElement("subtitle")}
                data-testid="hero-subtitle"
              >
                Discover amazing products and services tailored for you
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8" data-webexp-container="true">
              <div
                id="feature1"
                className="p-6 border rounded-lg hover:outline hover:outline-blue-500 hover:outline-2 cursor-pointer"
                onClick={() => setSelectedElement("feature1")}
                data-testid="feature-card-1"
              >
                <h2 className="text-xl font-semibold mb-2">Feature One</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>
              <div
                id="feature2"
                className="p-6 border rounded-lg hover:outline hover:outline-blue-500 hover:outline-2 cursor-pointer"
                onClick={() => setSelectedElement("feature2")}
                data-testid="feature-card-2"
              >
                <h2 className="text-xl font-semibold mb-2">Feature Two</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
                </p>
              </div>
            </div>

            <div className="text-center" data-webexp-container="true">
              <button
                id="cta-button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md hover:outline hover:outline-blue-500 hover:outline-2 cursor-pointer"
                onClick={() => setSelectedElement("cta-button")}
                data-testid="primary-cta"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Element editing overlay - shows when an element is selected */}
      {selectedElement && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-4 z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              Editing: <span className="text-blue-600">#{selectedElement}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedElement(null)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>

          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              {selectedElement === "title" && (
                <div className="space-y-2">
                  <Label htmlFor="title-text">Heading Text</Label>
                  <Input
                    id="title-text"
                    defaultValue="Welcome to Our Website"
                  />
                </div>
              )}
              {selectedElement === "cta-button" && (
                <div className="space-y-2">
                  <Label htmlFor="button-text">Button Text</Label>
                  <Input
                    id="button-text"
                    defaultValue="Get Started Now"
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select defaultValue="large">
                    <SelectTrigger id="font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xl">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-weight">Font Weight</Label>
                  <Select defaultValue="bold">
                    <SelectTrigger id="font-weight">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="bolder">Bolder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#000000" className="w-8 h-8 p-0 border-0 rounded" />
                    <Input
                      id="text-color"
                      defaultValue="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#ffffff" className="w-8 h-8 p-0 border-0 rounded" />
                    <Input
                      id="bg-color"
                      defaultValue="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="operations" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">DOM Operations</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Text Replace
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Style Set
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Class Add
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Move Before
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Move After
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Duplicate
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
