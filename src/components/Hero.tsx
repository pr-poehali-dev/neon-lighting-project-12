import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

interface HeroProps {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/images/mountain-landscape.jpg"
          alt="Mountain landscape"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          НАЙДИ СВОИХ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
          Заполни анкету и знакомься с людьми, которые тебе по-настоящему близки
        </p>
        <button
          onClick={onOpenForm}
          className="bg-white text-black px-8 py-3 text-sm uppercase tracking-wide transition-all duration-300 hover:bg-white/80 cursor-pointer"
        >
          Создать анкету
        </button>
      </div>
    </div>
  );
}