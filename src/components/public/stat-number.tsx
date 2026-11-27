"use client";

import { useEffect, useRef, useState } from "react";

export function StatNumber({ value }: { value: string }) {
  const visualRef = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = visualRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        let tick = 0;
        interval = setInterval(() => {
          tick += 1;
          setDisplay(tick >= 8 ? value : value.replace(/\d/g, () => String(Math.floor(Math.random() * 10))));
          if (tick >= 8) clearInterval(interval);
        }, 60);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={visualRef} aria-hidden="true">
        {display}
      </span>
    </>
  );
}
