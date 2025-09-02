export function PricingFAQ() {
  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences."
    },
    {
      question: "What happens during the free trial?",
      answer: "You get full access to all features of your chosen plan for 14 days. No credit card required to start, and you can cancel anytime during the trial period."
    },
    {
      question: "Do you offer discounts for nonprofits or education?",
      answer: "Yes! We offer special pricing for qualified nonprofits and educational institutions. Contact our sales team for more information."
    },
    {
      question: "Is there a setup fee?", 
      answer: "No setup fees ever. You only pay for your monthly or annual subscription, and we include onboarding support at no extra cost."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and can arrange invoicing for annual Enterprise plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period."
    }
  ];

  return (
    <section className="py-20 bg-gray-50" data-webexp-container="true">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="faq-title">
            Frequently asked questions
          </h2>
          <p className="text-xl text-gray-600">
            Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>
        
        <div className="space-y-6" data-webexp-container="true">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm"
              data-testid={`faq-item-${index}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions?
          </p>
          <button 
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-smooth"
            data-testid="faq-contact"
          >
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
