export function Testimonials() {
  const testimonials = [
    {
      id: 'testimonial-1',
      quote: "WebExp has transformed how we approach website optimization. The drag-and-drop editor makes it so easy for our marketing team to test ideas without depending on developers.",
      author: "Sarah Chen",
      role: "Head of Growth",
      company: "TechCorp",
      avatar: "SC"
    },
    {
      id: 'testimonial-2', 
      quote: "We've seen a 40% increase in conversion rates since implementing WebExp. The A/B testing capabilities are incredible and the insights help us make data-driven decisions.",
      author: "Michael Rodriguez",
      role: "Marketing Director", 
      company: "StartupXYZ",
      avatar: "MR"
    },
    {
      id: 'testimonial-3',
      quote: "The real-time analytics and seamless LaunchDarkly integration make WebExp a perfect fit for our enterprise needs. Security and compliance were top priorities for us.",
      author: "Emily Johnson",
      role: "VP Engineering",
      company: "Enterprise Inc",
      avatar: "EJ"
    }
  ];

  return (
    <section className="py-20 bg-gray-50" data-webexp-container="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="testimonials-title">
            Loved by teams worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what our customers have to say about their experience with WebExp.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-webexp-container="true">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-smooth"
              data-testid={`testimonial-${testimonial.id}`}
            >
              <div className="mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>
              <blockquote className="text-gray-700 mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">{testimonial.avatar}</span>
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
