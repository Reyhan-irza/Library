import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const POINTER_MOTION_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const DESKTOP_MOTION_QUERY =
  "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export function useGsapMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(POINTER_MOTION_QUERY, () => {
        const moveX = gsap.quickTo(element, "x", {
          duration: 0.42,
          ease: "power3.out",
        });
        const moveY = gsap.quickTo(element, "y", {
          duration: 0.42,
          ease: "power3.out",
        });

        const handlePointerMove = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect();
          const offsetX = event.clientX - (bounds.left + bounds.width / 2);
          const offsetY = event.clientY - (bounds.top + bounds.height / 2);

          moveX(gsap.utils.clamp(-6, 6, offsetX * 0.11));
          moveY(gsap.utils.clamp(-4, 4, offsetY * 0.11));
        };

        const reset = () => {
          moveX(0);
          moveY(0);
        };

        element.addEventListener("pointermove", handlePointerMove);
        element.addEventListener("pointerleave", reset);
        element.addEventListener("blur", reset);

        return () => {
          element.removeEventListener("pointermove", handlePointerMove);
          element.removeEventListener("pointerleave", reset);
          element.removeEventListener("blur", reset);
        };
      });
    }, element);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return ref;
}

export function useGsapAmbientScroll(
  triggerRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const trigger = triggerRef.current;
    const layer = layerRef.current;
    if (!trigger || !layer) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(DESKTOP_MOTION_QUERY, () => {
        gsap.fromTo(
          layer,
          { xPercent: -2, yPercent: -8 },
          {
            xPercent: 2,
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top top",
              end: "bottom top",
              scrub: 1.1,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    }, trigger);

    return () => {
      media.revert();
      context.revert();
    };
  }, [layerRef, triggerRef]);
}