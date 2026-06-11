import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TrustSection from './TrustSection';
import FeaturesSection from './FeaturesSection';
import ProductShowcase from './ProductShowcase';
import WhySection from './WhySection';
import CTASection from './CTASection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-teal-100 selection:text-teal-800 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <ProductShowcase />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  );
}
