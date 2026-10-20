import { Hero } from "@/components/marketing/hero";
import { ClosingCta, HowItWorks, Modes, Outputs, SignalStrip, SiteFooter, SoundNote } from "@/components/marketing/sections";

export default function Home() {
  return (
    <div className="bg-background">
      <Hero />
      <main>
        <SignalStrip />
        <Outputs />
        <HowItWorks />
        <SoundNote />
        <Modes />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
