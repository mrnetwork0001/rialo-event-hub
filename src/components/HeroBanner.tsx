const HeroBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(220,60%,25%)] via-[hsl(210,50%,30%)] to-[hsl(200,45%,35%)]">
      {/* Decorative circles */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative px-8 py-10">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Rialo Community Event Hub
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Your single source of truth for everything happening across the Rialo ecosystem.
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;
