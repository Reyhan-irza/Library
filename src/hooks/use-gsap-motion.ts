import { useRef } from "react";
import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const POINTER_MOTION_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const DESKTOP_MOTION_QUERY =
  "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const PINNED_WORKFLOW_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

export function useGsapMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(() => {
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
  }, { scope: ref });

  return ref;
}

export function useGsapAmbientScroll(
  triggerRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
) {
  useGSAP(() => {
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
  }, { scope: triggerRef, dependencies: [layerRef, triggerRef], revertOnUpdate: true });
}

export function useGsapNavChoreography(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const media = gsap.matchMedia();
    media.add(MOTION_QUERY, () => {
      const brand = scope.querySelector<HTMLElement>("[data-gsap-nav-brand]");
      const links = scope.querySelector<HTMLElement>("[data-gsap-nav-links]");
      const actions = scope.querySelector<HTMLElement>("[data-gsap-nav-actions]");
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .fromTo(
          brand,
          { autoAlpha: 0, y: 7 },
          { autoAlpha: 1, y: 0, duration: 0.42 },
          0.04,
        )
        .fromTo(
          links,
          { autoAlpha: 0, y: 7 },
          { autoAlpha: 1, y: 0, duration: 0.42 },
          0.12,
        )
        .fromTo(
          actions,
          { autoAlpha: 0, y: 7 },
          { autoAlpha: 1, y: 0, duration: 0.42 },
          0.2,
        );

      return () => intro.kill();
    });

    return () => media.revert();
  }, { scope: scopeRef, dependencies: [scopeRef], revertOnUpdate: true });
}

export function useGsapProductReveal(
  scopeRef: RefObject<HTMLElement | null>,
  itemCount: number,
) {
  useGSAP(() => {
    const scope = scopeRef.current;
    if (!scope || itemCount === 0) return;

    const media = gsap.matchMedia();
    media.add(MOTION_QUERY, () => {
      const rows = scope.querySelectorAll<HTMLElement>("[data-gsap-product-row]");
      const covers = scope.querySelectorAll<HTMLElement>("[data-gsap-product-cover]");

      if (rows.length) {
        gsap.fromTo(
          rows,
          { y: 9, autoAlpha: 0.94 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.48,
            stagger: 0.075,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: scope,
              start: "top 88%",
              once: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (covers.length) {
        gsap.fromTo(
          covers,
          { y: 3 },
          {
            y: -3,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    });

    return () => media.revert();
  }, { scope: scopeRef, dependencies: [itemCount], revertOnUpdate: true });
}

/**
 * Scroll-linked editorial motion for the landing page.
 *
 * The page keeps its content readable at rest, then lets structural layers
 * travel at different rates while the user moves through each chapter. Unlike
 * one-shot reveals, these timelines reverse naturally when the user scrolls
 * back up.
 */
export function useGsapLandingScroll(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(MOTION_QUERY, () => {
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const intensity = mobile ? 0.42 : 0.68;
        const sections = gsap.utils.toArray<HTMLElement>("[data-gsap-section]", scope);

        sections.forEach((section) => {
          const pinnedWorkflow = section.hasAttribute("data-gsap-pinned-workflow");
          const ctaSection = section.classList.contains("landing-cta");
          const chapterLabel = pinnedWorkflow || ctaSection
            ? null
            : section.querySelector<HTMLElement>(".landing-section-label, .landing-kicker");
          const chapterTitle = pinnedWorkflow || ctaSection
            ? null
            : section.querySelector<HTMLElement>("h2:not([data-gsap-reveal])");
          const chapterCopy = chapterTitle?.parentElement?.querySelector<HTMLElement>(
            "p:not(.landing-section-label):not([data-gsap-reveal])",
          );
          const chapterWash = section.querySelector<HTMLElement>("[data-gsap-wash]");
          const chapterCurtain = section.querySelector<HTMLElement>("[data-gsap-curtain]");
          const chapterTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 96%",
              end: "bottom 8%",
              scrub: mobile ? 0.65 : 1.05,
              invalidateOnRefresh: true,
            },
          });

          const reveals = section.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
          reveals.forEach((element) => {
            gsap.fromTo(
              element,
              { y: 10, autoAlpha: 0.94 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.55,
                ease: "power3.out",
                clearProps: "transform,opacity",
                scrollTrigger: {
                  trigger: element,
                  start: "top 88%",
                  once: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          if (chapterWash) {
            chapterTimeline
              .fromTo(
                chapterWash,
                {
                  autoAlpha: 0,
                  xPercent: -18,
                  scale: 0.72,
                  rotate: -3,
                  transformOrigin: "center center",
                },
                {
                  autoAlpha: mobile ? 0.32 : 0.58,
                  xPercent: 8,
                  scale: 1,
                  rotate: 2,
                  ease: "none",
                },
                0,
              )
              .to(
                chapterWash,
                {
                  autoAlpha: 0,
                  xPercent: 22,
                  scale: 1.16,
                  rotate: 0,
                  ease: "none",
                },
                0.54,
              );
          }

          if (chapterLabel) {
            chapterTimeline.fromTo(
              chapterLabel,
              { xPercent: -4 * intensity, letterSpacing: "0.2em" },
              { xPercent: 0, letterSpacing: "0.16em", ease: "none" },
              0,
            );
          }

          if (chapterTitle) {
            chapterTimeline.fromTo(
              chapterTitle,
              {
                yPercent: 8 * intensity,
                rotateZ: mobile ? 0 : -0.65,
                transformOrigin: "left bottom",
              },
              {
                yPercent: -7 * intensity,
                rotateZ: mobile ? 0 : 0.35,
                ease: "none",
              },
              0,
            );
          }

          if (chapterCopy) {
            chapterTimeline.fromTo(
              chapterCopy,
              { yPercent: 10 * intensity },
              { yPercent: -5 * intensity, ease: "none" },
              0.08,
            );
          }

          if (chapterCurtain) {
            gsap.fromTo(
              chapterCurtain,
              { scaleX: 0, transformOrigin: "left center" },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 92%",
                  end: "top 48%",
                  scrub: mobile ? 0.6 : 0.9,
                  invalidateOnRefresh: true,
                },
              },
            );
          }

          if (section.id === "how" || section.id === "about") {
            gsap.fromTo(
              section,
              { backgroundPosition: "0 0" },
              {
                backgroundPosition: mobile ? "4px 4px" : "8px 8px",
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: mobile ? 0.8 : 1.15,
                  invalidateOnRefresh: true,
                },
              },
            );
          }

          const depthLayers = section.querySelectorAll<HTMLElement>("[data-gsap-depth]");
          depthLayers.forEach((layer) => {
            const depth = Number(layer.dataset.gsapDepth ?? 14) * intensity * 0.16;
            const lateral = Number(layer.dataset.gsapLateral ?? 0) * intensity * 0.16;

            gsap.fromTo(
              layer,
              {
                yPercent: -depth * 0.72,
                xPercent: -lateral * 0.62,
                rotate: 0,
                scale: 1,
                transformOrigin: "center center",
              },
              {
                yPercent: depth * 0.92,
                xPercent: lateral * 1.45,
                rotate: 0,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: mobile ? 0.7 : 1.15,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          const focusLayers = section.querySelectorAll<HTMLElement>("[data-gsap-focus]");
          focusLayers.forEach((layer) => {
            gsap.fromTo(
              layer,
              {
                scale: 0.985,
                y: 5 * intensity,
                rotateY: 0,
                transformOrigin: "center center",
              },
              {
                scale: 1.005,
                y: -4 * intensity,
                rotateY: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 92%",
                  end: "bottom 12%",
                  scrub: mobile ? 0.8 : 1.25,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          const rails = section.querySelectorAll<HTMLElement>("[data-gsap-rail]");
          rails.forEach((rail) => {
            gsap.fromTo(
              rail,
              {
                scaleY: 0.05,
                x: mobile ? 0 : -1,
                transformOrigin: "center top",
              },
              {
                scaleY: 1,
                x: mobile ? 0 : 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 88%",
                  end: "center 42%",
                  scrub: mobile ? 0.7 : 1,
                  invalidateOnRefresh: true,
                },
              },
            );
          });
        });

        const cta = scope.querySelector<HTMLElement>(".landing-cta");
        const ctaCopy = cta?.querySelector<HTMLElement>("[data-gsap-cta-copy]");
        const ctaActions = cta?.querySelector<HTMLElement>("[data-gsap-cta-actions]");

        if (cta && ctaCopy) {
          const copyParts = Array.from(ctaCopy.children).filter(
            (child): child is HTMLElement => child instanceof HTMLElement,
          );
          gsap.fromTo(
            copyParts,
            { y: 12, autoAlpha: 0.94 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.58,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: cta,
                start: "top 78%",
                once: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        if (cta && ctaActions) {
          gsap.fromTo(
            ctaActions,
            { y: 10, autoAlpha: 0.94 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.52,
              delay: 0.12,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: cta,
                start: "top 76%",
                once: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        const marquee = scope.querySelector<HTMLElement>("[data-gsap-marquee]");
        if (marquee) {
          gsap.to(marquee, {
            xPercent: mobile ? -6 : -10,
            skewX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: marquee,
              start: "top bottom",
              end: "bottom top",
              scrub: mobile ? 0.8 : 1.2,
              invalidateOnRefresh: true,
            },
          });
        }
      });

      media.add(PINNED_WORKFLOW_QUERY, () => {
        const section = scope.querySelector<HTMLElement>("[data-gsap-pinned-workflow]");
        const viewport = section?.querySelector<HTMLElement>("[data-gsap-workflow-viewport]");
        const track = section?.querySelector<HTMLElement>("[data-gsap-workflow-track]");
        const progress = section?.querySelector<HTMLElement>("[data-gsap-workflow-progress]");
        if (!section || !viewport || !track || !progress) return;

        const travel = () => Math.max(1, track.scrollWidth - viewport.clientWidth);
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            pin: section,
            start: "top top",
            end: () => `+=${travel()}`,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(track, { x: () => -travel(), ease: "none" }, 0)
          .fromTo(
            progress,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, ease: "none" },
            0,
          );

        return () => timeline.kill();
      });
    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, { scope: scopeRef, dependencies: [scopeRef], revertOnUpdate: true });
}

export function useGsapHeroChoreography(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(MOTION_QUERY, () => {
        const kicker = scope.querySelector<HTMLElement>('[data-gsap="hero-kicker"]');
        const title = scope.querySelector<HTMLElement>('[data-gsap="hero-title"]');
        const copy = scope.querySelector<HTMLElement>('[data-gsap="hero-copy"]');
        const actions = scope.querySelector<HTMLElement>('[data-gsap="hero-actions"]');
        const proof = scope.querySelector<HTMLElement>('[data-gsap="hero-proof"]');
        const visual = scope.querySelector<HTMLElement>('[data-gsap="hero-visual"]');
         const titleLines = scope.querySelectorAll<HTMLElement>('[data-gsap="hero-title-line"]');
        const panelHead = scope.querySelector<HTMLElement>('[data-gsap="hero-panel-head"]');
        const panelBody = scope.querySelector<HTMLElement>('[data-gsap="hero-panel-body"]');
        const panelFoot = scope.querySelector<HTMLElement>('[data-gsap="hero-panel-foot"]');
        const status = scope.querySelector<HTMLElement>('[data-gsap="hero-status"]');
        const rows = scope.querySelectorAll<HTMLElement>('[data-gsap="hero-row"]');

        if (!kicker || !title || !copy || !actions || !proof || !visual) return;

        gsap.set(visual, { transformPerspective: 1200, transformOrigin: "50% 50%" });

        const intro = gsap.timeline({
          defaults: { ease: "power4.out" },
        });

        intro
          .fromTo(
            visual,
            { autoAlpha: 0, y: 24, rotateX: 4, rotateY: -3, scale: 0.985 },
            { autoAlpha: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1, duration: 1.1 },
            0,
          )
          .fromTo(
            kicker,
            { autoAlpha: 0, y: 14, letterSpacing: "0.3em" },
            { autoAlpha: 1, y: 0, letterSpacing: "0.14em", duration: 0.62 },
            0.1,
          )
           .fromTo(
             titleLines.length ? Array.from(titleLines) : [title],
             { autoAlpha: 0, yPercent: 112, rotateX: -14, filter: "blur(9px)" },
             {
               autoAlpha: 1,
               yPercent: 0,
               rotateX: 0,
               filter: "blur(0px)",
               duration: 0.86,
               stagger: 0.1,
             },
             0.16,
           )
          .fromTo(
            copy,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.68 },
            0.42,
          )
          .fromTo(
            actions,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.62 },
            0.54,
          )
          .fromTo(
            proof,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.58 },
            0.68,
          )
          .fromTo(
            [panelHead, panelBody, panelFoot].filter(Boolean),
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.08 },
            0.5,
          )
          .fromTo(
            rows,
            { autoAlpha: 0, x: -10 },
            { autoAlpha: 1, x: 0, duration: 0.38, stagger: 0.07 },
            0.65,
          )
          .fromTo(
            status,
            { autoAlpha: 0, scaleX: 0.96, transformOrigin: "left center" },
            { autoAlpha: 1, scaleX: 1, duration: 0.5 },
            0.72,
          );

        return () => intro.kill();
      });

      media.add(MOTION_QUERY, () => {
        const visual = scope.querySelector<HTMLElement>('[data-gsap="hero-visual"]');
        const grid = scope.querySelector<HTMLElement>('[data-gsap="hero-grid"]');
        const copy = scope.querySelector<HTMLElement>('[data-gsap="hero-copy"]');
        if (!visual) return;

        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const scrollScale = mobile ? 0.55 : 1;
        const scrollTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: scope,
            start: "top top",
            end: "bottom top",
            scrub: 1.15,
            invalidateOnRefresh: true,
          },
        });

        scrollTimeline
          .to(
            visual,
            {
              yPercent: -5 * scrollScale,
              scale: 1 - 0.012 * scrollScale,
              ease: "none",
            },
            0,
          )
          .to(
            grid,
            { yPercent: 4 * scrollScale, xPercent: -0.8 * scrollScale, ease: "none" },
            0,
          )
          .to(copy, { yPercent: -2.5 * scrollScale, ease: "none" }, 0);

        return () => scrollTimeline.kill();
      });

      media.add(POINTER_MOTION_QUERY, () => {
        const visual = scope.querySelector<HTMLElement>("[data-gsap-hero-tilt]");
        if (!visual) return;

        gsap.set(visual, { transformPerspective: 1200, transformOrigin: "50% 50%" });

        const tiltX = gsap.quickTo(visual, "rotationX", {
          duration: 0.65,
          ease: "power3.out",
        });
        const tiltY = gsap.quickTo(visual, "rotationY", {
          duration: 0.65,
          ease: "power3.out",
        });

        const handlePointerMove = (event: PointerEvent) => {
          const bounds = visual.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          tiltX(gsap.utils.clamp(-1.1, 1.1, y * -2.2));
          tiltY(gsap.utils.clamp(-1.4, 1.4, x * 2.8));
        };

        const resetTilt = () => {
          tiltX(0);
          tiltY(0);
        };

        visual.addEventListener("pointermove", handlePointerMove);
        visual.addEventListener("pointerleave", resetTilt);
        visual.addEventListener("blur", resetTilt);

        return () => {
          visual.removeEventListener("pointermove", handlePointerMove);
          visual.removeEventListener("pointerleave", resetTilt);
          visual.removeEventListener("blur", resetTilt);
        };
      });
    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, { scope: scopeRef, dependencies: [scopeRef], revertOnUpdate: true });
}