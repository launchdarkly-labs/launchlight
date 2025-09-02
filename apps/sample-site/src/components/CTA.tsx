export function CTA() {
  return (
    <section className="py-20 bg-primary-600" data-webexp-container="true">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" data-testid="cta-title">
          Ready to optimize your website?
        </h2>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join thousands of companies using WebExp to create better user experiences and drive growth.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center" data-webexp-container="true">
          <button 
            className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-smooth"
            data-testid="cta-primary"
          >
            Start Free Trial
          </button>
          <button 
            className="border-2 border-primary-300 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:border-primary-200 transition-smooth"
            data-testid="cta-secondary"
          >
            Schedule Demo
          </button>
        </div>
        
        <div className="mt-8 text-sm text-primary-200">
          ✓ 14-day free trial • ✓ No credit card required • ✓ Setup in 5 minutes
        </div>
      </div>
    </section>
  );
}
