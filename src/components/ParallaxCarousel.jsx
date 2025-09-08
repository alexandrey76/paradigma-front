import React, { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function ParallaxCarousel({
  media = [],
  height = 400,       // число в px
  speed = 0.18,
  fit = "cover"       // 'cover' или 'contain'
}) {
  console.log("ParallaxCarousel v2 loaded"); // ← увидишь в консоли, что файл точно обновился

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps"
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snaps, setSnaps] = useState([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const layersRef = useRef([]);
  const videosRef = useRef([]);
  layersRef.current = [];
  videosRef.current = [];

  const setLayerRef = (el) => { if (el && !layersRef.current.includes(el)) layersRef.current.push(el); };
  const setVideoRef = (i, el) => { videosRef.current[i] = el || null; };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = emblaApi.scrollProgress();
    const list = emblaApi.scrollSnapList();
    layersRef.current.forEach((layer, i) => {
      const diff = list[i] - progress;
      const translate = clamp(diff * -100 * speed, -12, 12);
      layer.style.transform = `translate3d(${translate}%,0,0)`;
    });
  }, [emblaApi, speed]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedIndex(idx);
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    videosRef.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else { v.pause(); try { v.currentTime = 0; } catch {} }
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onScroll(); onSelect();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => { setSnaps(emblaApi.scrollSnapList()); onScroll(); onSelect(); });
    return () => {
      emblaApi.off("scroll", onScroll);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll, onSelect]);

  // ------- инлайновые стили (ничего в App.css не требуется) -------
  const S = {
    wrap: { width: "100%" },
    stage: { position: "relative" },
    embla: { position: "relative", overflow: "hidden" },
    container: { display: "flex" },
    slide: {
      flex: "0 0 100%", minWidth: 0, height,
      position: "relative", overflow: "hidden"
    },
    layer: { width: "100%", height: "100%", willChange: "transform" },
    media: { width: "100%", height: "100%", objectFit: fit, display: "block" },
    arrow: (side) => ({
      position: "absolute", top: "50%", transform: "translateY(-50%)",
      [side]: 10, width: 40, height: 40, borderRadius: "50%",
      background: "rgba(0,0,0,0.5)", color: "#fff", border: "none",
      fontSize: 24, cursor: "pointer", zIndex: 2
    }),
    arrowDisabled: { opacity: .3, cursor: "default" },
    dots: { display: "flex", justifyContent: "center", gap: 6, marginTop: 10 },
    dot: (active) => ({
      width: 10, height: 10, borderRadius: "50%",
      background: active ? "#111" : "#cfcfcf", border: "none",
      cursor: "pointer", transform: active ? "scale(1.2)" : "none",
      transition: "transform .2s, background .2s"
    })
  };
  // ----------------------------------------------------------------

  return (
    <div style={S.wrap}>
      <div style={S.stage}>
        <div className="embla" ref={emblaRef} style={S.embla}>
          <div className="embla__container" style={S.container}>
            {media.map((m, idx) => (
              <div key={idx} className="embla__slide" style={S.slide}>
                <div ref={setLayerRef} className="embla__parallax__layer" style={S.layer}>
                  {m.type === "video" ? (
                    <video
                      ref={(el) => setVideoRef(idx, el)}
                      autoPlay muted loop playsInline
                      controls     // ← управление плеером
                      preload="metadata"
                      poster={m.poster}
                      style={S.media}
                    >
                      {m.webm && <source src={m.webm} type="video/webm" />}
                      {m.mp4  && <source src={m.mp4}  type="video/mp4"  />}
                    </video>
                  ) : (
                    <img src={m.src} alt="" loading="lazy" style={S.media} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* стрелки */}
        <button
          onClick={() => emblaApi && emblaApi.scrollPrev()}
          style={{ ...S.arrow("left"), ...(canPrev ? {} : S.arrowDisabled) }}
          disabled={!canPrev}
          aria-label="Предыдущий"
        >‹</button>
        <button
          onClick={() => emblaApi && emblaApi.scrollNext()}
          style={{ ...S.arrow("right"), ...(canNext ? {} : S.arrowDisabled) }}
          disabled={!canNext}
          aria-label="Следующий"
        >›</button>
      </div>

      {/* точки */}
      <div style={S.dots}>
        {snaps.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi && emblaApi.scrollTo(i)}
            style={S.dot(i === selectedIndex)}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
