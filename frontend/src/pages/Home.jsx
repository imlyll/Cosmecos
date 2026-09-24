import Hero from '../components/home/Hero';
import Banners from '../components/home/Banners';
import BestSellers from '../components/home/BestSellers';
import Partners from '../components/home/Partners';
import AboutSection from '../components/home/AboutSection';
import Features from '../components/home/Features';
import PromoBanner from '../components/home/PromoBanner';
import CategoriesGrid from '../components/home/CategoriesGrid';
import Spotlights from '../components/home/Spotlights';
import BeautyGuide from '../components/home/BeautyGuide';
import NewArrivals from '../components/home/NewArrivals';
import Testimonials from '../components/home/Testimonials';
import Blog from '../components/home/Blog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <Banners />
      <BestSellers />
      <Partners />
      <AboutSection />
      <Features />
      <PromoBanner />
      <CategoriesGrid />
      <Spotlights />
      <BeautyGuide />
      <NewArrivals />
      <Testimonials />
      <Blog />
    </>
  );
}
