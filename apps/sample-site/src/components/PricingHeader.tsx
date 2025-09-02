export function PricingHeader() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-20" data-webexp-container="true">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="pricing-title">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the plan that fits your team size and experimentation needs. 
          All plans include our core features with no hidden fees.
        </p>
        
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg border shadow-sm" data-webexp-container="true">
            <button className="px-6 py-2 rounded-md bg-primary-600 text-white font-medium">
              Monthly
            </button>
            <button className="px-6 py-2 rounded-md text-gray-700 font-medium">
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
