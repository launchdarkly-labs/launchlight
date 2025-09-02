import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b" data-webexp-container="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WE</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">WebExp Demo</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8" data-webexp-container="true">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-smooth">
              Home
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-smooth">
              Pricing
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-smooth">
              Features
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-smooth">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4" data-webexp-container="true">
            <button 
              className="text-gray-600 hover:text-gray-900 transition-smooth"
              data-testid="signin-btn"
            >
              Sign In
            </button>
            <button 
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-smooth"
              data-testid="cta-header"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
