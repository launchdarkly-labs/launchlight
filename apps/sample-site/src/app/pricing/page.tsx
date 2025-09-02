import { Header } from '@/components/Header';
import { PricingHeader } from '@/components/PricingHeader';
import { PricingCards } from '@/components/PricingCards';
import { PricingFAQ } from '@/components/PricingFAQ';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <PricingHeader />
        <PricingCards />
        <PricingFAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
