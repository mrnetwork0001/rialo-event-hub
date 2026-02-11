import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-live" />
          <span className="text-sm font-medium text-primary">Rialo Ecosystem</span>
        </div>

        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-foreground">Community </span>
          <span className="text-gradient-gold">Event Hub</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Your single source of truth for everything happening across the Rialo ecosystem.
          Never miss an AMA, workshop, or community event again.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
