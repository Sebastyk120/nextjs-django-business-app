import Hero from "../_components/Hero";
import Quote from "../_components/Quote";
import Products from "../_components/Products";
import AboutUs from "../_components/AboutUs";
import Services from "../_components/Services";
import Contact from "../_components/Contact";

export default function MarketingPageEn() {
    return (
        <div className="flex flex-col">
            <Hero />
            <Quote />
            <Products />
            <AboutUs />
            <Services />
            <Contact />
        </div>
    );
}
