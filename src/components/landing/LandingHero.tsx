"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HERO_SLIDES, SITE_LOGO_3D, SITE_LOGO_ALT } from "./constants";

export function LandingHero() {
  const [activeIndex, setActiveIndex] = useState(2);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative mx-auto max-w-[1100px]">
      <div className="container mx-auto flex max-md:bg-flare-hero flex-col px-2 pb-48 sm:px-5 md:flex-row">
        <div className="z-30 flex-1 pt-30 text-center md:pt-38 md:text-left">
          <div className="flex w-full justify-center md:hidden">
            {SITE_LOGO_3D ? (
              <Image
                src={SITE_LOGO_3D}
                alt={SITE_LOGO_ALT}
                width={150}
                height={23}
                className="scale-75 md:scale-100"
                priority
                unoptimized={SITE_LOGO_3D.startsWith("http")}
              />
            ) : (
              <span className="inline-block h-[23px] w-[150px] scale-75 md:scale-100" aria-hidden />
            )}
          </div>
          <h1 className="homepage-heading-gradient mt-5 max-w-[509px] pb-2 text-[40px] font-medium leading-[110%] md:mt-8 md:text-[53px]">
            Your Expense
            <br />
            Tracking Agent
          </h1>
          <p className="md:mt-2 md:text-[20px] max-md:text-center">
            Cheaper than an accountant. Predictable pricing.
            <br />
            Exceptional customer support.
          </p>
          <div className="mt-7 w-full sm:w-auto">
            <Link
              href="/sign-up"
              className="cta-button flex h-[50px] w-full max-w-[316px] items-center justify-center whitespace-nowrap px-6 font-medium text-white sm:w-auto"
            >
              Start for free
            </Link>
            <div className="flex w-full justify-center md:justify-start md:pl-1">
              <p className="mt-5 max-w-[315px] text-[13px] text-[#646E87] max-md:text-center">
                Datadog bill too high? Migrate today, the rest of your contract is on us.
                <br className="max-md:hidden" />
                Migration assistance and bespoke onboarding included.{" "}
                <a
                  href="https://calendly.com/betterstack/consultation-migrating-from-datadog"
                  className="text-[#C9D3EE] underline decoration-[#C9D3EE]/20 underline-offset-4 transition hover:decoration-[#C9D3EE]"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  Book a consultation
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-end sm:min-h-[550px] md:min-h-[610px]">
          <div className="relative h-[370px] w-[390px] sm:absolute sm:-top-6 sm:h-[550px] sm:w-[875px] md:-left-50 md:top-13 md:h-[610px]">
            {HERO_SLIDES.map((slide, index) => (
              <Image
                key={`${slide.id}-sm`}
                src={slide.imageSm}
                alt=""
                width={390}
                height={448}
                draggable={false}
                className={`pointer-events-none absolute top-0 -left-4 max-w-none transition-opacity duration-500 ease-in-out sm:hidden ${
                  index === activeIndex ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
                priority={index <= 2}
              />
            ))}
            {HERO_SLIDES.map((slide, index) => (
              <Image
                key={`${slide.id}-lg`}
                src={slide.imageLg}
                alt=""
                width={875}
                height={609}
                draggable={false}
                className={`pointer-events-none absolute left-0 top-0 hidden transition-opacity duration-500 ease-in-out max-sm:hidden ${
                  index === activeIndex ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
                priority={index <= 2}
              />
            ))}
          </div>

          <div className="relative z-10 max-sm:-mt-8">
            <div className="relative h-8 text-center text-[13px] text-neutral-300 sm:h-10">
              {HERO_SLIDES.map((slide, index) => (
                <a
                  key={slide.id}
                  href={`https://betterstack.com${slide.href}`}
                  className={`absolute inset-x-0 transition-all duration-400 ease-in-out ${
                    index === activeIndex
                      ? "z-10 opacity-100 pointer-events-auto"
                      : "z-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {slide.label}
                </a>
              ))}
            </div>
            <div className="flex items-center justify-center gap-x-4.5">
              <button
                type="button"
                aria-label="Previous hero slide"
                onClick={() =>
                  setActiveIndex((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                }
                className="inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border border-[#939DB8]/20 bg-[#171926] text-[#939DB8]"
              >
                ‹
              </button>
              <div className="flex items-center gap-x-0.5">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to ${slide.label}`}
                    onClick={() => setActiveIndex(index)}
                    className="group px-1.5 py-2"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full border-[0.75px] border-[#939DB8]/20 ${
                        index === activeIndex ? "bg-[#939DB8]" : "bg-[#171926]"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next hero slide"
                onClick={() => setActiveIndex((current) => (current + 1) % HERO_SLIDES.length)}
                className="inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border border-[#939DB8]/20 bg-[#171926] text-[#939DB8]"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
