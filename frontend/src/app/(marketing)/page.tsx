import Hero from "./_components/Hero";
import Quote from "./_components/Quote";
import Products from "./_components/Products";
import Projections from "./_components/Projections";
import ImpactStory from "./_components/ImpactStory";
import AboutUs from "./_components/AboutUs";
import Services from "./_components/Services";
import Contact from "./_components/Contact";

export default function MarketingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Quote />
      <Products />
      <Projections />
      <ImpactStory />
      <AboutUs />
      <Services />
      <Contact />
    </div>
  );
}
