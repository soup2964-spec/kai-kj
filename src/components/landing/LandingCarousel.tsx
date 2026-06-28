"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { CarouselSection } from "./constants";

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function cardHref(href: string) {
  return href.startsWith("http") ? href : `https://betterstack.com${href}`;
}

export function LandingCarousel({ section }: { section: CarouselSection }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scrollByCard = useCallback(
    (direction: -1 | 1) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollBy({ left: direction * 380, behavior: "smooth" });
      window.setTimeout(updateScrollState, 350);
    },
    [updateScrollState],
  );

  const sectionClass = section.sectionClass ?? "my-48";

  return (
    <section className={sectionClass}>
      <div className="relative">
        <div className="relative z-30 mx-auto flex max-w-[1126px] flex-col gap-4 px-5 md:flex-row md:justify-between">
          <h2 className="font-helveticaDisplay ml-1 text-[28px] font-bold text-[#363D4E] md:ml-0 md:text-[40px]">
            {section.title}
          </h2>
          <div className="flex items-center">
            <div className="hidden items-center md:flex">
              <button
                type="button"
                aria-label="Previous slide"
                disabled={!canScrollPrev}
                onClick={() => scrollByCard(-1)}
                className="mr-2 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#939DB8]/20 bg-[#171926] text-[#89CFF0] transition hover:bg-[#222330] disabled:opacity-40"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                disabled={!canScrollNext}
                onClick={() => scrollByCard(1)}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#939DB8]/20 bg-[#171926] text-[#89CFF0] transition hover:bg-[#222330] disabled:opacity-40"
              >
                <ChevronRightIcon />
              </button>
              <div className="mx-5 h-[18px] w-px shrink-0 bg-[#939DB8]/12" />
            </div>
            <a
              href={cardHref(section.exploreHref)}
              className="block shrink-0 rounded-full border border-[#939DB8]/20 bg-[#171926] px-3 py-1 text-[13px] text-[#89CFF0] transition hover:bg-[#222330] md:px-4 md:py-2"
            >
              {section.exploreLabel}
              <span className="ml-1 inline-block">→</span>
            </a>
          </div>
        </div>

        <div className="relative mt-9 w-screen max-w-screen">
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="no-scrollbars flex snap-x snap-mandatory gap-5 overflow-x-auto py-1 scroll-smooth"
            style={{ scrollPaddingLeft: "max(50vw - 563px, 20px)" }}
          >
            <div className="min-w-[calc(50vw-563px)] shrink-0 max-md:min-w-5" />
            {section.cards.map((card) => (
              <a
                key={card.title}
                href={cardHref(card.href)}
                draggable={false}
                className="relative z-10 min-h-[478px] max-h-[478px] shrink-0 snap-start snap-always overflow-hidden rounded-xl border border-[#939DB8]/10 bg-[#0F101A] bg-cover bg-center bg-no-repeat transition select-none hover:scale-[1.01] max-sm:max-w-[85vw] sm:max-w-none"
                style={{
                  width: card.width,
                  backgroundImage: card.bgImage ? `url(${card.bgImage})` : undefined,
                }}
              >
                <Image
                  src={card.image}
                  alt=""
                  width={card.width}
                  height={478}
                  draggable={false}
                  className="pointer-events-none w-full object-contain"
                />
                <div className="absolute inset-0 flex flex-col justify-end pb-8 pl-6 pr-8 md:pl-8">
                  <h3 className="font-medium text-white">{card.title}</h3>
                  <p className="mt-3 text-neutral-300">{card.description}</p>
                </div>
              </a>
            ))}
            <div className="hidden min-w-[calc(50vw-563px)] shrink-0 snap-start snap-always md:block" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex justify-center">
          <button
            type="button"
            aria-label="Scroll carousel left"
            disabled={!canScrollPrev}
            onClick={() => scrollByCard(-1)}
            className="pointer-events-auto h-full grow bg-linear-to-r from-[#eceef1] from-20% via-[#eceef1]/70 via-80% disabled:cursor-default"
          />
          <div className="w-[1086px] shrink-0" />
          <button
            type="button"
            aria-label="Scroll carousel right"
            disabled={!canScrollNext}
            onClick={() => scrollByCard(1)}
            className="pointer-events-auto h-full grow bg-linear-to-l from-[#eceef1] from-20% via-[#eceef1]/70 via-80% disabled:cursor-default"
          />
        </div>
      </div>

      {section.replaces ? (
        <div className="mx-auto mt-8 flex max-w-[1095px] items-center gap-4 px-10 md:mt-11 md:justify-end">
          <div className="text-[13px] text-neutral-300 md:text-base">Replaces</div>
          <div className="h-[18px] w-px bg-neutral-200/12" />
          {section.replaces.srcSm ? (
            <>
              <Image
                src={section.replaces.src}
                alt={section.replaces.alt}
                width={section.replaces.width}
                height={section.replaces.height}
                className={`hidden md:block ${section.replaces.className ?? ""}`}
                unoptimized
              />
              <Image
                src={section.replaces.srcSm}
                alt={section.replaces.alt}
                width={152}
                height={16}
                className="md:hidden"
                unoptimized
              />
            </>
          ) : (
            <Image
              src={section.replaces.src}
              alt={section.replaces.alt}
              width={section.replaces.width}
              height={section.replaces.height}
              className={section.replaces.className ?? ""}
              unoptimized
            />
          )}
        </div>
      ) : null}
    </section>
  );
}
