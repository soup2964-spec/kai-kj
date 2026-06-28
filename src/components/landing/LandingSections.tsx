import Link from "next/link";
import { LandingCustomersBanner } from "./LandingCustomersBanner";

export function LandingCustomersMarquee() {
  return <LandingCustomersBanner />;
}

export function LandingPricingCompare() {
  return (
    <section className="relative z-10 mx-auto mt-16 max-w-[1097px] md:mt-32">
      <div className="mx-auto flex flex-col gap-y-10 gap-x-16 md:flex-row md:items-center md:justify-between lg:gap-x-20">
        <div className="max-lg:w-full max-lg:max-w-[629px]">
          <div className="flex max-w-[356px] flex-col max-lg:pl-4">
            <h2 className="logs-text mt-2 max-w-[629px] pb-2 text-[28px] font-bold leading-[108%] text-transparent md:text-[40px]">
              At a fraction of
              <br />
              your current costs
            </h2>
            <p className="mt-3 max-w-[441px] leading-[145%] tracking-[-0.01em] text-neutral-200">
              Get an unrivaled price-to-performance ratio. Forget sampling and ingest all your data or
              decrease your costs by 80x.
            </p>
            <div className="mt-6">
              <a
                href="https://betterstack.com/pricing#logs"
                className="inline-flex h-[37px] items-center rounded-[43px] border border-[#939db833] bg-[#171926] px-3 text-[13px] text-[#C9D3EE] transition hover:text-white"
              >
                Explore pricing
                <span className="ml-1.5 mt-px">→</span>
              </a>
            </div>
            <div className="mt-10 flex gap-x-14 md:gap-x-16">
              <div className="flex flex-col gap-y-1">
                <p className="text-[13px] leading-[145%] text-neutral-200">Ingest up to</p>
                <p className="text-[28px] font-bold leading-[117%] text-white">80x more data</p>
                <p className="text-[13px] leading-[145%] text-neutral-200">with the same budget</p>
              </div>
              <div className="flex flex-col gap-y-1">
                <p className="text-[13px] leading-[145%] text-neutral-200">or save up to</p>
                <p className="text-[28px] font-bold leading-[117%] text-white">98%</p>
                <p className="text-[13px] leading-[145%] text-neutral-200">of your costs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 rounded-[26px] border border-[#939db81a] p-4 md:max-w-[641px] md:min-w-[540px] xl:min-w-[641px]">
          <div className="w-full overflow-hidden rounded-t-xl border border-[#939db81a] bg-[#0F101A]">
            <div className="flex flex-col bg-[#171824]/80 px-4 py-6 text-base leading-[145%] md:flex-row md:items-center md:justify-between md:px-10">
              <div className="max-md:border-b max-md:border-dashed max-md:pb-3 max-md:border-[#939db81f]">
                <span className="text-[28px] font-bold leading-[145%] text-white">1 TB</span>
                <span className="block">traces per month</span>
              </div>
              <div className="hidden h-[61px] w-px border-l border-dashed border-[#939db81f] md:block" />
              <div className="max-md:border-b max-md:border-dashed max-md:py-3 max-md:border-[#939db81f]">
                <span className="text-[28px] font-bold leading-[145%] text-white">1 TB</span>
                <span className="block">logs per month</span>
              </div>
              <div className="hidden h-[61px] w-px border-l border-dashed border-[#939db81f] md:block" />
              <div className="max-md:pt-3">
                <span className="text-[28px] font-bold leading-[145%] text-white">1 TB</span>
                <span className="block">metrics per month</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col rounded-b-xl border border-t-0 border-[#939db81a] bg-[#0F101A] px-6">
            <div className="flex flex-col gap-y-4 border-b border-dashed border-[#939db81f] py-6 md:flex-row md:items-center">
              <div className="flex w-[247px] items-center gap-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#202432] text-[10px] font-bold text-white">
                  DD
                </div>
                <span className="font-medium tracking-[-0.16px] text-white">Datadog</span>
              </div>
              <div className="w-full">
                <div className="h-[13px] w-full rounded-[44px] border border-[#ffffff08] bg-[#2f354780]" />
                <p className="mt-2 text-base leading-[145%] tracking-[-0.14px] text-neutral-200">
                  approx. <span className="text-white">$55,574</span> per month
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-y-4 py-6 md:flex-row md:items-center">
              <div className="flex w-[247px] items-center gap-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#98A4F7] to-[#5B63D3]">
                  <span className="text-[8px] font-bold text-white">BS</span>
                </div>
                <span className="font-medium tracking-[-0.16px] text-white">Better Stack</span>
              </div>
              <div className="w-full">
                <div className="h-[13px] w-[13px] rounded-[200px] bg-gradient-to-r from-[#98A4F7] to-[#5B63D3]" />
                <p className="mt-2 text-base leading-[145%] tracking-[-0.14px] text-neutral-200">
                  <span className="text-white">$687</span> per month
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] leading-[145%] tracking-[-0.01em] text-[#646E87] max-w-[610px] mx-auto">
            An estimate only. Assumes annual payments, European data location, 1 responder with a Tera
            bundle, the average event size of 1 kB, $5 per 100 Datadog&apos;s &quot;custom metrics&quot;.
            Assumes 1,000 Datadog &quot;custom metrics&quot; equivalent to 1 GB metrics.
          </p>
        </div>
      </div>
    </section>
  );
}

export function LandingBottomCta() {
  return (
    <section className="bg-market-presence py-20 lg:pt-36 xl:pb-36 xl:pt-48">
      <div className="mx-auto max-w-[540px]">
        <div className="bg-market-presence-sm ml-6 md:hidden">
          <div className="aspect-[350/272]" />
        </div>
      </div>
      <div className="container mx-auto -mt-[25%] max-w-[1000px] sm:-mt-24 md:mt-0">
        <div className="mt-14 md:mt-0 md:max-w-[350px] lg:max-w-none">
          <div className="text-center md:text-left">
            <h2 className="font-helveticaDisplay mx-auto max-w-[500px] text-[24px] font-bold leading-[117%] text-white md:mx-0 lg:text-[36px]">
              Happy customers, growing market presence
            </h2>
            <p className="mx-auto mt-3 max-w-[400px] px-5 text-base md:mx-0 md:px-0">
              Ship higher-quality software faster. Be the hero of your engineering teams.
            </p>
          </div>
          <div className="mt-10 w-full sm:w-auto">
            <Link
              href="/sign-up"
              className="cta-button flex h-12 w-full max-w-[316px] items-center justify-center whitespace-nowrap px-6 font-medium text-white sm:w-auto"
            >
              Start for free
            </Link>
            <p className="mt-5 pb-2 text-center text-[13px] text-neutral-300 sm:text-base lg:ml-2 lg:text-left">
              Start monitoring for free or{" "}
              <a
                href="https://betterstack.com/book-a-demo"
                className="text-neutral-200 underline decoration-[#C9D3EE]/20 underline-offset-4 transition hover:decoration-[#C9D3EE]"
                rel="nofollow noopener"
                target="_blank"
              >
                book a demo
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
