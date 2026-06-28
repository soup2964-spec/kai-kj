import { CUSTOMER_NAMES } from "./constants";

function CustomerNamesStrip({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
  if (CUSTOMER_NAMES.length === 0) {
    return <div className="flex h-10 w-[1752px] shrink-0 items-center" aria-hidden={ariaHidden} />;
  }

  return (
    <div
      className="flex h-10 w-max shrink-0 items-center gap-x-16 px-8"
      aria-hidden={ariaHidden}
    >
      {CUSTOMER_NAMES.map((name) => (
        <span key={name} className="whitespace-nowrap text-sm text-[#646E87]">
          {name}
        </span>
      ))}
    </div>
  );
}

export function LandingCustomersBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative -mb-20 mt-4 flex flex-col items-center overflow-hidden ${className}`.trim()}
    >
      <div className="scale-75 md:scale-100">
        <div className="customers-scroll flex justify-center">
          <CustomerNamesStrip />
          <CustomerNamesStrip aria-hidden />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-full grow bg-linear-to-r from-[#eceef1] md:from-50%" />
        <div className="min-w-[200px] md:min-w-[1000px]" />
        <div className="h-full grow bg-linear-to-l from-[#eceef1] md:from-50%" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="mask-gradient-to-l h-full grow backdrop-blur-[2px]" />
        <div className="w-[710px]" />
        <div className="mask-gradient-to-r h-full grow backdrop-blur-[2px]" />
      </div>
    </div>
  );
}
