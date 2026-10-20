import Image from "next/image";
import dusk from "../../../public/images/hero-dusk.jpg";
import { EmailCapture } from "./email-capture";
import { SiteHeader } from "./site-header";
import { TerritoryCard } from "./territory-card";

export function Hero() {
  return (
    <section className="p-2 sm:p-3">
      <div className="relative isolate flex min-h-[min(60rem,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-[22px] bg-neutral-900 sm:rounded-[28px]">
        <Image
          src={dusk}
          alt="Red sandstone cliffs under a pale dusk sky in southern Utah"
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover object-[center_65%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/5 to-black/60" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-black/35 via-black/0 to-transparent" />

        <SiteHeader />

        <div className="mt-auto grid gap-10 px-5 pt-36 pb-6 sm:px-8 sm:pb-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-14 lg:px-12 lg:pb-12">
          <div className="text-white">
            <p className="inline-flex animate-rise items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium tracking-wide text-white/90 ring-1 ring-white/20 backdrop-blur-md ring-inset">
              <span className="size-1.5 rounded-full bg-ember" aria-hidden />
              Built on Qloo&rsquo;s taste graph
            </p>
            <h1 className="mt-6 max-w-[13ch] animate-rise font-heading font-semibold text-[3.4rem] leading-[0.98] tracking-[-0.035em] text-balance [animation-delay:60ms] sm:text-[4.6rem] lg:text-[5.6rem]">
              See the culture your market lives in.
            </h1>
            <p className="mt-6 max-w-[34rem] animate-rise text-[17px] leading-relaxed text-white/80 text-pretty [animation-delay:120ms]">
              Map the podcasts, creators, shows and places around your brand and your competitors. Turn it into briefs and ad checks your team can act on.
            </p>
            <EmailCapture className="mt-8 animate-rise [animation-delay:180ms]" />
            <p className="mt-3 animate-rise text-[13px] text-white/60 [animation-delay:220ms]">US and UK markets first.</p>
          </div>

          <TerritoryCard className="animate-rise [animation-delay:260ms] lg:mb-1" />
        </div>
      </div>
    </section>
  );
}
