export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-20" data-webexp-container="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="hero-title">
            Build Amazing
            <span className="text-primary-600 block">Web Experiences</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto" data-testid="hero-subtitle">
            Create, test, and optimize your website with our powerful experimentation platform. 
            No coding required - just drag, drop, and deploy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center" data-webexp-container="true">
            <button 
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-smooth"
              data-testid="hero-cta-primary"
            >
              Start Free Trial
            </button>
            <button 
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-smooth"
              data-testid="hero-cta-secondary"
            >
              Watch Demo
            </button>
          </div>
          
          <div className="mt-12">
            <p className="text-sm text-gray-500 mb-4">Trusted by 1000+ companies worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60" data-webexp-container="true">
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
