import Layout from "@/components/Layout";
import Hero from "@/sections/Hero";
import Features from "@/sections/Features";
import KeyFeature from "@/sections/KeyFeature";
import HowItWorks from "@/sections/HowItWorks";
import Testimonials from "@/sections/Testimonials";
import CTA from "@/sections/CTA";

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Features />
      <KeyFeature />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </Layout>
  );
}
