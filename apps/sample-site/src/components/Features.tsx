export function Features() {
  const features = [
    {
      id: 'feature-1',
      title: 'Drag & Drop Editor',
      description: 'Visually edit your website with our intuitive drag and drop interface. No coding skills required.',
      icon: '🎨'
    },
    {
      id: 'feature-2', 
      title: 'A/B Testing',
      description: 'Run sophisticated experiments to optimize conversion rates and user engagement.',
      icon: '📊'
    },
    {
      id: 'feature-3',
      title: 'Real-time Analytics',
      description: 'Get instant insights into how your changes perform with detailed analytics.',
      icon: '⚡'
    },
    {
      id: 'feature-4',
      title: 'Team Collaboration',
      description: 'Work together with your team to create and test amazing experiences.',
      icon: '👥'
    },
    {
      id: 'feature-5',
      title: 'Mobile Optimized',
      description: 'All experiments work seamlessly across desktop, tablet, and mobile devices.',
      icon: '📱'
    },
    {
      id: 'feature-6',
      title: 'Enterprise Security',
      description: 'Bank-level security with SOC 2 compliance and enterprise-grade infrastructure.',
      icon: '🔒'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white" data-webexp-container="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="features-title">
            Everything you need to optimize
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help you create better user experiences and drive business results.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-webexp-container="true">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-smooth"
              data-testid={`feature-card-${feature.id}`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button 
            className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-smooth"
            data-testid="features-cta"
          >
            Explore All Features
          </button>
        </div>
      </div>
    </section>
  );
}
