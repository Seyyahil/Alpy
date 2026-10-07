import { useEffect, useRef } from "react";

const assetUrl = (fileName: string) =>
  new URL(`./assets/${fileName}`, document.baseURI).href;

import {
  BigBubbleCanScene,
  FRUIT_ENTRY_SCROLL_VIEWPORTS,
} from "./BigBubbleCanScene";

const firstSipFizzUrl = assetUrl("bigbubble-first-sip-fizz-v1.avif");
const firstSipFriendsUrl = assetUrl("bigbubble-first-sip-friends-v1.avif");
const firstSipCanUrl = assetUrl("bigbubble-first-sip-can-v1.avif");
const summerGirlUrl = assetUrl("bigbubble-summer-girl-v2.avif");
const strawberryHarvestUrl = assetUrl("bigbubble-strawberry-harvest-v1.avif");
const strawberryHalfUrl = assetUrl("bigbubble-strawberry-half-v1.avif");
const strawberrySliceUrl = assetUrl("bigbubble-strawberry-slice-v1.avif");
const strawberryWholeUrl = assetUrl("bigbubble-strawberry-whole-v1.avif");

export function HeroPlaygroundPage() {
  const storyRef = useRef<HTMLElement>(null);
  const colorStageRef = useRef<HTMLDivElement>(null);
  const fruitFieldRef = useRef<HTMLDivElement>(null);
  const chargeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fruitField = fruitFieldRef.current;
    const hero = fruitField?.closest<HTMLElement>(".bb3-hero");
    const story = storyRef.current;
    const colorStage = colorStageRef.current;
    if (!fruitField || !hero || !story || !colorStage) return;

    const fruit = Array.from(
      fruitField.querySelectorAll<HTMLElement>(".bb3-fruit"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const updateFruit = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const stage = hero.querySelector<HTMLElement>(".bb3-hero-stage");
      const travel = Math.max(
        (stage?.offsetHeight ?? window.innerHeight) *
          FRUIT_ENTRY_SCROLL_VIEWPORTS,
        1,
      );
      const rawProgress = reducedMotion.matches
        ? 0
        : Math.min(1, Math.max(0, -bounds.top / travel));
      hero.dataset.fruitAbsorbed = String(rawProgress >= 1);
      hero.dataset.absorptionProgress = rawProgress.toFixed(3);
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      const targetX = fruitField.clientWidth * 0.5;

      fruit.forEach((item, index) => {
        const isBadge = item.classList.contains("bb3-hero-badge");
        const delay = index * 0.045;
        const itemProgress = Math.min(
          1,
          Math.max(0, (progress - delay) / (1 - delay)),
        );
        const targetY =
          fruitField.clientHeight * Number(item.dataset.targetY ?? "0.5");
        const startX = item.offsetLeft + item.offsetWidth / 2;
        const startY = item.offsetTop + item.offsetHeight / 2;
        const translateX = (targetX - startX) * itemProgress;
        const translateY = (targetY - startY) * itemProgress;
        const startRotation = Number(item.dataset.rotation ?? "0");
        const scale = 1 - itemProgress * (isBadge ? 0.94 : 0.82);
        const fadeStart = isBadge ? 0.64 : 0.72;
        const fade = Math.min(
          1,
          Math.max(0, (itemProgress - fadeStart) / (1 - fadeStart)),
        );
        const rotationTravel = isBadge ? 156 : 96;

        item.style.opacity = String(1 - fade);
        item.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${startRotation + itemProgress * rotationTravel}deg) scale(${scale})`;
      });

      const storyScroll = Math.max(-story.getBoundingClientRect().top, 0);
      const stageHeight = stage?.offsetHeight ?? window.innerHeight;
      const canTravelStart = Math.max(
        hero.offsetHeight - stageHeight,
        travel,
      );
      const release = story.querySelector<HTMLElement>(".bb3-release");
      const neutralStart = release
        ? release.offsetTop + release.offsetHeight - stageHeight * 0.45
        : Number.POSITIVE_INFINITY;
      const firstSip = chargeRef.current;
      const referenceMotion = story.querySelector<HTMLElement>(
        ".bb3-reference-motion",
      );
      const chargeSequence = story.querySelector<HTMLElement>(
        ".bb3-charge-sequence",
      );
      const chargeSequenceDistance = chargeSequence
        ? Math.max(chargeSequence.offsetHeight - stageHeight, 1)
        : 1;
      const bigBubbleSnapEnd = 0.14 + 0.225 + 0.17;
      const postSnapRedStart = chargeSequence
        ? chargeSequence.offsetTop + chargeSequenceDistance * bigBubbleSnapEnd
        : firstSip
          ? firstSip.offsetTop - stageHeight * 0.38
          : Number.POSITIVE_INFINITY;
      const firstSipTurquoiseStart = firstSip
        ? firstSip.offsetTop - stageHeight * 0.38
        : Number.POSITIVE_INFINITY;
      const firstSipEnd = firstSip
        ? firstSip.offsetTop + firstSip.offsetHeight - stageHeight * 0.12
        : Number.POSITIVE_INFINITY;
      const referenceRedStart = referenceMotion
        ? referenceMotion.offsetTop - stageHeight * 0.38
        : Number.POSITIVE_INFINITY;
      const releaseFadeStart = reducedMotion.matches
        ? hero.offsetHeight - stageHeight
        : canTravelStart;
      let nextTone = "base";
      if (storyScroll < releaseFadeStart) nextTone = "hero";
      else if (storyScroll < neutralStart) nextTone = "release";
      else if (
        storyScroll >= postSnapRedStart &&
        storyScroll < firstSipTurquoiseStart
      ) {
        nextTone = "first-sip";
      } else if (
        storyScroll >= firstSipTurquoiseStart &&
        storyScroll < firstSipEnd
      ) {
        nextTone = "release";
      }
      if (storyScroll >= referenceRedStart) nextTone = "first-sip";
      colorStage.dataset.tone = nextTone;
    };

    const queueFruitUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateFruit);
    };

    updateFruit();
    window.addEventListener("scroll", queueFruitUpdate, { passive: true });
    window.addEventListener("resize", queueFruitUpdate);
    reducedMotion.addEventListener("change", queueFruitUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      delete hero.dataset.fruitAbsorbed;
      delete hero.dataset.absorptionProgress;
      window.removeEventListener("scroll", queueFruitUpdate);
      window.removeEventListener("resize", queueFruitUpdate);
      reducedMotion.removeEventListener("change", queueFruitUpdate);
    };
  }, []);

  useEffect(() => {
    const charge = chargeRef.current;
    const sequence = storyRef.current?.querySelector<HTMLElement>(
      ".bb3-charge-sequence",
    );
    const insider = charge?.querySelector<HTMLElement>(
      ".bb3-charge-insider",
    );
    if (!charge || !sequence || !insider) return;

    const cards = Array.from(
      sequence.querySelectorAll<HTMLElement>(".bb3-charge-card"),
    );
    const photos = Array.from(
      storyRef.current?.querySelectorAll<HTMLElement>("[data-inertia-item]") ??
        [],
    );
    const copy = insider.querySelector<HTMLElement>(".bb3-charge-copy");
    const referenceMotion = storyRef.current?.querySelector<HTMLElement>(
      ".bb3-reference-motion",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const inertiaAnimations = new Map<HTMLElement, Animation>();
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let frame = 0;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smooth = (start: number, end: number, value: number) => {
      const progress = clamp((value - start) / Math.max(end - start, 0.0001));
      return progress * progress * (3 - 2 * progress);
    };

    const updateCharge = () => {
      frame = 0;
      const sequenceBounds = sequence.getBoundingClientRect();
      const sequenceDistance = Math.max(
        sequence.offsetHeight - window.innerHeight,
        1,
      );
      const sequenceProgress = reducedMotion.matches
        ? 0
        : clamp(-sequenceBounds.top / sequenceDistance);
      const viewportWidth =
        document.documentElement.clientWidth || window.innerWidth;
      const compositionScale =
        viewportWidth > 820
          ? Math.min(viewportWidth / 1440, window.innerHeight / 900)
          : 1;
      const compositionHeight = window.innerHeight / compositionScale;
      sequence.style.setProperty(
        "--bb3-composition-scale",
        compositionScale.toFixed(4),
      );
      sequence.dataset.compositionScale = compositionScale.toFixed(4);

      const insiderBounds = insider.getBoundingClientRect();
      const insiderProgress = clamp(
        (window.innerHeight - insiderBounds.top) /
          (window.innerHeight + insider.offsetHeight),
      );
      copy?.style.setProperty(
        "--bb3-copy-parallax",
        `${(reducedMotion.matches ? 0 : (insiderProgress - 0.5) * 58).toFixed(1)}px`,
      );

      let activeCard = -1;
      cards.forEach((card, index) => {
        const center = 0.14 + index * 0.225;
        const enter = smooth(center - 0.16, center - 0.025, sequenceProgress);
        const exit = smooth(center + 0.055, center + 0.16, sequenceProgress);
        const reveal = smooth(center - 0.17, center - 0.145, sequenceProgress);
        const conceal = smooth(center + 0.145, center + 0.17, sequenceProgress);
        const visibility = reducedMotion.matches ? 1 : reveal * (1 - conceal);
        const y = reducedMotion.matches
          ? 0
          : (1 - enter) * compositionHeight * 1.08 -
            exit * compositionHeight * 1.12;

        if (visibility > 0.45) activeCard = index;
        card.style.setProperty("--bb3-card-opacity", visibility.toFixed(3));
        card.style.setProperty("--bb3-card-y", `${y.toFixed(1)}px`);
      });

      sequence.dataset.activeCard = String(activeCard + 1);

      if (referenceMotion) {
        const referenceBounds = referenceMotion.getBoundingClientRect();
        const referenceDistance = Math.max(
          referenceMotion.offsetHeight - window.innerHeight,
          1,
        );
        const referenceProgress = reducedMotion.matches
          ? 1
          : clamp(-referenceBounds.top / referenceDistance);
        const titleRise = reducedMotion.matches
          ? 1
          : smooth(0.4, 0.72, referenceProgress);

        referenceMotion.style.setProperty(
          "--bb3-reference-title-y",
          `${((1 - titleRise) * window.innerHeight).toFixed(1)}px`,
        );
        referenceMotion.style.setProperty(
          "--bb3-reference-title-scale",
          (0.7 + titleRise * 0.2).toFixed(3),
        );
        const detailRise = reducedMotion.matches
          ? 1
          : smooth(0.68, 0.9, referenceProgress);
        referenceMotion.style.setProperty(
          "--bb3-reference-detail-y",
          `${((1 - detailRise) * window.innerHeight).toFixed(1)}px`,
        );
        referenceMotion.dataset.progress = referenceProgress.toFixed(3);
      }
    };

    const queueChargeUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateCharge);
    };

    const rememberPointer = (event: MouseEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const animatePhotoInertia = (event: MouseEvent) => {
      if (reducedMotion.matches) return;

      const photo = event.currentTarget as HTMLElement;
      const inner = photo.querySelector<HTMLElement>(
        "[data-inertia-item-child]",
      );
      if (!inner) return;

      let velocityX = event.clientX - pointerX;
      let velocityY = event.clientY - pointerY;
      let velocity = Math.hypot(velocityX, velocityY);

      if (velocity < 0.5) {
        const bounds = photo.getBoundingClientRect();
        velocityX = event.clientX - (bounds.left + bounds.width / 2);
        velocityY = event.clientY - (bounds.top + bounds.height / 2);
        velocity = Math.max(Math.hypot(velocityX, velocityY), 1);
      }

      const x = (-velocityX / velocity) * 80;
      const y = (-velocityY / velocity) * 80;
      const rotation = x / 18;
      const transform = (amount: number) =>
        `translate3d(${(x * amount).toFixed(3)}px, ${(y * amount).toFixed(3)}px, 0) rotate(${(rotation * amount).toFixed(3)}deg)`;

      inertiaAnimations.get(inner)?.cancel();
      const animation = inner.animate(
        [
          { offset: 0, transform: transform(0) },
          { offset: 0.06, transform: transform(0.4) },
          { offset: 0.125, transform: transform(0.82) },
          { offset: 0.19, transform: transform(0.91) },
          { offset: 0.25, transform: transform(0.71) },
          { offset: 0.44, transform: transform(0.3) },
          { offset: 0.69, transform: transform(0.065) },
          { offset: 1, transform: transform(0) },
        ],
        { duration: 800, easing: "linear" },
      );
      inertiaAnimations.set(inner, animation);
      animation.addEventListener(
        "finish",
        () => inertiaAnimations.delete(inner),
        { once: true },
      );
    };

    updateCharge();
    window.addEventListener("scroll", queueChargeUpdate, { passive: true });
    window.addEventListener("resize", queueChargeUpdate);
    reducedMotion.addEventListener("change", queueChargeUpdate);
    document.addEventListener("mousemove", rememberPointer, { passive: true });
    photos.forEach((photo) =>
      photo.addEventListener("mouseenter", animatePhotoInertia),
    );

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueChargeUpdate);
      window.removeEventListener("resize", queueChargeUpdate);
      reducedMotion.removeEventListener("change", queueChargeUpdate);
      document.removeEventListener("mousemove", rememberPointer);
      photos.forEach((photo) =>
        photo.removeEventListener("mouseenter", animatePhotoInertia),
      );
      inertiaAnimations.forEach((animation) => animation.cancel());
      sequence.style.removeProperty("--bb3-composition-scale");
      delete sequence.dataset.compositionScale;
    };
  }, []);

  return (
    <div className="bb3-root">
      <header className="bb3-header">
        <a className="bb3-brand" href="#hero" aria-label="BigBubble home">
          <span>BigBubble</span>
        </a>
        <nav className="bb3-primary-nav" aria-label="Primary navigation">
          <a href="#availability">Flavors</a>
          <a href="#release">Learn</a>
          <a href="#charge">Recipes</a>
          <button
            className="product-button is-primary is-md bb3-header-cta"
            type="button"
          >
            <span>Find in store</span>
          </button>
        </nav>
      </header>

      <main className="bb3-story" ref={storyRef}>
        <div
          aria-hidden="true"
          className="bb3-color-stage"
          data-tone="hero"
          ref={colorStageRef}
        />
        <div className="bb3-can-layer" aria-hidden="true">
          <BigBubbleCanScene storyRef={storyRef} />
        </div>

        <div className="bb3-opening">
          <section className="bb3-panel bb3-hero" id="hero" aria-labelledby="bb3-title">
          <div className="bb3-hero-stage">
            <div className="bb3-fruit-field" ref={fruitFieldRef}>
              <img
                className="bb3-fruit bb3-fruit-whole"
                data-rotation="-18"
                data-target-y="0.36"
                src={strawberryWholeUrl}
                alt=""
              />
              <img
                className="bb3-fruit bb3-fruit-half"
                data-rotation="22"
                data-target-y="0.58"
                src={strawberryHalfUrl}
                alt=""
              />
              <img
                className="bb3-fruit bb3-fruit-slice"
                data-rotation="20"
                data-target-y="0.46"
                src={strawberrySliceUrl}
                alt=""
              />
              <img
                className="bb3-fruit bb3-fruit-whole-small"
                data-rotation="13"
                data-target-y="0.68"
                src={strawberryWholeUrl}
                alt=""
              />
              <ul className="bb3-hero-badges" aria-label="Product benefits">
                <li
                  className="bb3-fruit bb3-hero-badge bb3-hero-badge-usa"
                  data-rotation="-7"
                  data-target-y="0.4"
                >
                  <span className="bb3-hero-badge-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 5h18v14H3zM3 9h18M3 13h18M3 17h18" />
                      <path d="M3 5h8v8H3z" className="is-filled" />
                      <path d="m7 7 .7 1.4 1.5.2-1.1 1 .3 1.5L7 10.4l-1.4.7.3-1.5-1.1-1 1.5-.2z" className="is-knockout" />
                    </svg>
                  </span>
                  Made in USA
                </li>
                <li
                  className="bb3-fruit bb3-hero-badge bb3-hero-badge-gmo"
                  data-rotation="6"
                  data-target-y="0.48"
                >
                  <span className="bb3-hero-badge-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M19.5 4.5C12 4.5 6 8.4 6 14.1c0 3.2 2.3 5.4 5.4 5.4 5.7 0 8.1-6 8.1-15Z" />
                      <path d="M4.5 20c2.8-5 6.4-8.1 11-10.4M9.5 14.4l2.1 2 4-4.5" />
                    </svg>
                  </span>
                  NON GMO Verified
                </li>
                <li
                  className="bb3-fruit bb3-hero-badge bb3-hero-badge-recyclable"
                  data-rotation="5"
                  data-target-y="0.58"
                >
                  <span className="bb3-hero-badge-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="m10.3 4 2-2 3.2 5.4-2.7-.1-2.1 3.6M18.4 10.1l2.7.1-3.2 5.5-1.3-2.4h-4.2M13.8 19.8l-1.4 2.3-3.2-5.5 2.7.1M7.7 18.7H4.9l-3.1-5.4 2.8.1 2.1-3.6" />
                    </svg>
                  </span>
                  Recyclable
                </li>
                <li
                  className="bb3-fruit bb3-hero-badge bb3-hero-badge-sugar"
                  data-rotation="-6"
                  data-target-y="0.64"
                >
                  <span className="bb3-hero-badge-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="m6 8 6-3.5L18 8v8l-6 3.5L6 16Z" />
                      <path d="m6 8 6 3.5L18 8M12 11.5v8M4 4l16 16" />
                    </svg>
                  </span>
                  No added sugar
                </li>
              </ul>
            </div>
            <h1 className="bb3-hero-title" id="bb3-title">
              <span className="bb3-grained-word" data-text="Naturally">
                Naturally
              </span>
              <span className="bb3-grained-word" data-text="Essenced">
                Essenced
              </span>
              <span className="bb3-grained-word" data-text="Big bubbles">
                Big bubbles
              </span>
            </h1>
          </div>
          </section>

          <section className="bb3-panel bb3-release" id="release" aria-labelledby="bb3-release-title">
          <article className="bb3-release-copy">
            <h2 id="bb3-release-title">
              <span className="bb3-grained-word" data-text="Only">
                Only
              </span>
              <span className="bb3-grained-word" data-text="The finest">
                The finest
              </span>
              <span className="bb3-grained-word" data-text="berries">
                berries
              </span>
            </h2>
            <p className="bb3-body-copy">
              A bright hit of strawberry, a rush of crisp bubbles, and a clean
              finish that keeps every sip moving.
            </p>
          </article>

          <div className="bb3-release-media">
            <figure className="bb3-release-girl" data-inertia-item>
              <div className="bb3-charge-photo-inner" data-inertia-item-child>
                <img
                  alt="Woman laughing outdoors while holding a BigBubble strawberry seltzer can"
                  src={summerGirlUrl}
                />
              </div>
            </figure>
            <figure className="bb3-release-harvest" data-inertia-item>
              <div className="bb3-charge-photo-inner" data-inertia-item-child>
                <img
                  alt="People picking ripe strawberries together in a sunlit field"
                  src={strawberryHarvestUrl}
                />
              </div>
            </figure>
          </div>
          </section>
        </div>

        <div className="bb3-charge-sequence" aria-label="Why people love Strawberry Static">
          <div className="bb3-charge-sequence-stage">
            <div className="bb3-charge-card-field">
              <article className="bb3-charge-card is-yellow" data-side="right">
                <span>What hits first</span>
                <h3>Berry up front</h3>
                <p>
                  Ripe strawberry essence lands bright, juicy, and never jammy.
                </p>
              </article>
              <article className="bb3-charge-card is-cyan" data-side="left">
                <span>What hits first</span>
                <h3>Big bubble snap</h3>
                <p>
                  A tight rush of carbonation keeps every sip crisp and lively.
                </p>
              </article>
              <article className="bb3-charge-card is-red" data-side="right">
                <span>What hits first</span>
                <h3>No added sugar</h3>
                <p>
                  Ripe strawberry essence lands bright, juicy, and never jammy.
                </p>
              </article>
              <article className="bb3-charge-card is-navy" data-side="left">
                <span>What hits first</span>
                <h3>Ripe</h3>
                <p>
                  Ripe strawberry essence lands bright, juicy, and never jammy.
                </p>
              </article>
            </div>
          </div>
        </div>

        <section
          aria-label="Can transforming into bubbles"
          className="bb3-can-burst-stage"
        />

        <section
          className="bb3-panel bb3-charge"
          id="charge"
          aria-labelledby="bb3-charge-title"
          ref={chargeRef}
        >
          <div className="bb3-charge-headline">
            <p>One crack. One sip. Instant signal.</p>
            <h2 id="bb3-charge-title">
              <span>The first sip</span>
              <span>talks back</span>
            </h2>
          </div>

          <div className="bb3-charge-insider" id="first-sip-energy">
            <div className="bb3-charge-photo-stack" aria-label="BigBubble first sip moments">
              <figure className="bb3-charge-photo bb3-charge-photo-girl" data-inertia-item>
                <div className="bb3-charge-photo-inner" data-inertia-item-child>
                  <img
                    alt="Condensation-covered BigBubble strawberry seltzer can held outdoors"
                    src={firstSipCanUrl}
                  />
                </div>
              </figure>
              <figure className="bb3-charge-photo bb3-charge-photo-fizz" data-inertia-item>
                <div className="bb3-charge-photo-inner" data-inertia-item-child>
                  <img
                    alt="A cold seltzer can opening with a burst of fine bubbles"
                    src={firstSipFizzUrl}
                  />
                </div>
              </figure>
              <figure className="bb3-charge-photo bb3-charge-photo-friends" data-inertia-item>
                <div className="bb3-charge-photo-inner" data-inertia-item-child>
                  <img
                    alt="Three friends laughing and toasting with sparkling strawberry drinks"
                    src={firstSipFriendsUrl}
                  />
                </div>
              </figure>
            </div>

            <article className="bb3-charge-copy">
              <p className="bb3-eyebrow">First sip energy</p>
              <strong>
                <span>Natural berry.</span>
                <span>Big bubbles.</span>
                <span>Zero quiet.</span>
              </strong>
              <p>
                BigBubble turns ripe strawberry and a crisp rush of fizz into
                one loud little ritual—easy to share, impossible to ignore.
              </p>
              <div className="bb3-charge-action">
                <button
                  className="product-button is-primary is-md"
                  type="button"
                >
                  <span>Find in store</span>
                </button>
                <span>4.9 / 5 from berry people</span>
              </div>
            </article>
          </div>

        </section>

        <section
          aria-labelledby="bb3-reference-motion-title"
          className="bb3-reference-motion"
        >
          <div className="bb3-reference-motion-stage">
            <h2 id="bb3-reference-motion-title">
              <span>Open cold.</span>
              <span>Stay loud.</span>
            </h2>
            <p className="bb3-reference-note is-left">Ripe strawberry</p>
            <p className="bb3-reference-note is-right">Strawberry spark</p>
            <img
              alt=""
              aria-hidden="true"
              className="bb3-reference-fruit is-left"
              src={strawberryWholeUrl}
            />
            <img
              alt=""
              aria-hidden="true"
              className="bb3-reference-fruit is-right"
              src={strawberryHalfUrl}
            />
            <img
              alt=""
              aria-hidden="true"
              className="bb3-reference-fruit is-headline-left"
              src={strawberrySliceUrl}
            />
            <img
              alt=""
              aria-hidden="true"
              className="bb3-reference-fruit is-headline-right"
              src={strawberryWholeUrl}
            />
          </div>
        </section>

      </main>
    </div>
  );
}

export default HeroPlaygroundPage;
