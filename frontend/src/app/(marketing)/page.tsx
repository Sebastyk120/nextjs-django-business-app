import Hero from "./_components/Hero";
import Quote from "./_components/Quote";
import Products from "./_components/Products";
import Projections from "./_components/Projections";
import ImpactStory from "./_components/ImpactStory";
import AboutUs from "./_components/AboutUs";
import Services from "./_components/Services";
import Contact from "./_components/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Heavens Fruits | Sabor y Calidad de Origen | Exportamos Frutas Exóticas",
  description: "Exportamos una amplia variedad de frutas colombianas como Mango de azúcar, Uchuva, Gulupa, Granadilla, Pitahaya, Tamarillo, Aguacate...",
};

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
