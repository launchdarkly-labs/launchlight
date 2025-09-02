import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16" data-webexp-container="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WE</span>
              </div>
              <span className="ml-2 text-xl font-semibold">WebExp Demo</span>
            </div>
            <p className="text-gray-400 mb-4">
              The most powerful web experimentation platform for modern teams.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-smooth">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-smooth">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-smooth">GitHub</a>
            </div>
          </div>
          
          <div data-webexp-container="true">
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-gray-400 hover:text-white transition-smooth">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-smooth">Pricing</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Integrations</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">API</a></li>
            </ul>
          </div>
          
          <div data-webexp-container="true">
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Careers</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-smooth">Contact</a></li>
            </ul>
          </div>
          
          <div data-webexp-container="true">
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Community</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-smooth">Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 WebExp Demo. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-smooth">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-smooth">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-smooth">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
