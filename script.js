const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const timeElement = document.querySelector("#almaty-time");
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Almaty",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const updateAstanaTime = () => {
  if (!timeElement) {
    return;
  }

  const now = new Date();
  timeElement.textContent = `${timeFormatter.format(now)}, GMT +5`;
  timeElement.dateTime = now.toISOString();
};

updateAstanaTime();
window.setInterval(updateAstanaTime, 30000);

const designCanvas = document.querySelector(".design-canvas");
const defaultPageTitle = document.title;
const projectHashes = new Set(["#projects", "#cv", "#design-work"]);
let activeRoute = "home";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const getRoute = () => {
  if (window.location.hash === "#work-ethic") {
    return "work-ethic";
  }

  return projectHashes.has(window.location.hash) ? "projects" : "home";
};

const scrollToProjectSection = (hash) => {
  const targetId = hash.slice(1);
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (window.location.hash !== hash || getRoute() !== "projects") {
        return;
      }

      if (hash === "#projects") {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    });
  });
};

const updatePageView = () => {
  const previousRoute = activeRoute;
  const nextRoute = getRoute();
  const isProjectsPage = nextRoute === "projects";
  const isWorkEthicPage = nextRoute === "work-ethic";
  const currentHash = window.location.hash;

  activeRoute = nextRoute;
  document.documentElement.classList.toggle("is-projects-view", isProjectsPage);
  document.body.classList.toggle("is-projects-view", isProjectsPage);
  designCanvas?.classList.toggle(
    "is-secondary-page",
    isWorkEthicPage || isProjectsPage,
  );
  designCanvas?.classList.toggle("is-work-ethic", isWorkEthicPage);
  designCanvas?.classList.toggle("is-projects", isProjectsPage);

  if (isWorkEthicPage) {
    document.title = "My Work Ethic — Vladislav Solomonov";
  } else if (isProjectsPage) {
    document.title = "Projects — Vladislav Solomonov";
  } else {
    document.title = defaultPageTitle;
  }

  if (isProjectsPage) {
    scrollToProjectSection(currentHash);
  } else if (previousRoute === "projects") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
};

updatePageView();
window.addEventListener("hashchange", updatePageView);
window.addEventListener("pageshow", () => {
  if (getRoute() === "projects") {
    scrollToProjectSection(window.location.hash);
  }
});

const ditherCanvas = document.querySelector(".dither-background");

if (ditherCanvas) {
  const context = ditherCanvas.getContext("2d", { alpha: false });
  const cursorPreference = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
  const palette = [
    [24, 7, 13],
    [59, 10, 23],
    [78, 13, 29],
    [109, 22, 41],
  ];
  const bayerMatrix = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5,
  ];
  const idleFrameInterval = 80;
  const interactiveFrameInterval = 1000 / 24;
  const cursor = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    trailX: window.innerWidth / 2,
    trailY: window.innerHeight / 2,
    strength: 0,
    targetStrength: 0,
  };
  let image;
  let animationFrame = 0;
  let resizeFrame = 0;
  let previousFrame = 0;
  let lastRender = 0;
  let pointerListenersActive = false;

  const resetCursor = () => {
    cursor.strength = 0;
    cursor.targetStrength = 0;
  };

  const fadeCursor = () => {
    cursor.targetStrength = 0;
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    if (cursor.strength < 0.01 && cursor.targetStrength === 0) {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
      cursor.trailX = event.clientX;
      cursor.trailY = event.clientY;
    }

    cursor.targetX = event.clientX;
    cursor.targetY = event.clientY;
    cursor.targetStrength = 1;
  };

  const handlePointerOut = (event) => {
    if (!event.relatedTarget) {
      fadeCursor();
    }
  };

  const addPointerListeners = () => {
    if (pointerListenersActive) {
      return;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("blur", fadeCursor);
    pointerListenersActive = true;
  };

  const removePointerListeners = () => {
    if (!pointerListenersActive) {
      return;
    }

    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerout", handlePointerOut);
    window.removeEventListener("blur", fadeCursor);
    pointerListenersActive = false;
  };

  const updatePointerSupport = () => {
    if (cursorPreference.matches && !motionPreference.matches) {
      addPointerListeners();
      return;
    }

    removePointerListeners();
    resetCursor();
  };

  const updateCursor = (timestamp) => {
    const elapsed = Math.min(64, Math.max(0, timestamp - previousFrame || 16));
    const cursorFollow = 1 - Math.exp(-elapsed * 0.009);
    const trailFollow = 1 - Math.exp(-elapsed * 0.0045);
    const strengthFollow =
      1 -
      Math.exp(
        -elapsed * (cursor.targetStrength > cursor.strength ? 0.009 : 0.005),
      );

    cursor.x += (cursor.targetX - cursor.x) * cursorFollow;
    cursor.y += (cursor.targetY - cursor.y) * cursorFollow;
    cursor.trailX += (cursor.x - cursor.trailX) * trailFollow;
    cursor.trailY += (cursor.y - cursor.trailY) * trailFollow;
    cursor.strength +=
      (cursor.targetStrength - cursor.strength) * strengthFollow;
    previousFrame = timestamp;
  };

  const renderDither = (timestamp = 0) => {
    if (!context || !image) {
      return;
    }

    const { width, height } = ditherCanvas;
    const pixels = image.data;
    const time = timestamp * 0.00018;
    const vortexTime = timestamp * 0.0024;
    const interactionStrength = cursorPreference.matches
      ? cursor.strength
      : 0;
    const scaleX = width / window.innerWidth;
    const scaleY = height / window.innerHeight;
    const cursorX = cursor.x * scaleX;
    const cursorY = cursor.y * scaleY;
    const radius = Math.min(
      116,
      Math.max(80, Math.min(window.innerWidth, window.innerHeight) * 0.13),
    );
    const radiusX = radius * scaleX;
    const radiusY = radius * scaleY;
    const inverseRadiusX = 1 / radiusX;
    const inverseRadiusY = 1 / radiusY;
    const radiusHorizontal = radius / window.innerWidth;
    const radiusVertical = radius / window.innerHeight;
    const flowX = Math.max(
      -0.4,
      Math.min(0.4, (cursor.x - cursor.trailX) / radius),
    );
    const flowY = Math.max(
      -0.4,
      Math.min(0.4, (cursor.y - cursor.trailY) / radius),
    );

    for (let y = 0; y < height; y += 1) {
      const vertical = y / height;

      for (let x = 0; x < width; x += 1) {
        const horizontal = x / width;
        let sampleHorizontal = horizontal;
        let sampleVertical = vertical;
        let cursorInfluence = 0;
        let spiralDensity = 0;

        if (interactionStrength > 0.002) {
          const localX = (x - cursorX) * inverseRadiusX;
          const localY = (y - cursorY) * inverseRadiusY;
          const distanceSquared = localX * localX + localY * localY;

          if (distanceSquared < 1) {
            const distance = Math.sqrt(distanceSquared);
            const proximity = 1 - distance;
            const softFalloff =
              proximity * proximity * (3 - 2 * proximity);
            const falloff =
              softFalloff * softFalloff * interactionStrength;
            const inverseDistance = distance > 0.001 ? 1 / distance : 0;
            const radialX = localX * inverseDistance;
            const radialY = localY * inverseDistance;
            const angle = Math.atan2(localY, localX);

            spiralDensity = Math.pow(
              0.5 +
                Math.sin(angle * 3 + distance * 14 + vortexTime) * 0.5,
              1.35,
            );

            const inwardPull = falloff * (0.08 + spiralDensity * 0.06);
            const spiralTurn = falloff * (0.09 + spiralDensity * 0.09);
            const motionPull = falloff * 0.04;

            sampleHorizontal +=
              (radialX * inwardPull - radialY * spiralTurn + flowX * motionPull) *
              radiusHorizontal;
            sampleVertical +=
              (radialY * inwardPull + radialX * spiralTurn + flowY * motionPull) *
              radiusVertical;
            cursorInfluence = falloff;
          }
        }

        sampleHorizontal = Math.max(0, Math.min(1, sampleHorizontal));
        sampleVertical = Math.max(0, Math.min(1, sampleVertical));

        const wave =
          Math.sin(sampleHorizontal * 6 + time) * 0.28 +
          Math.cos(sampleVertical * 5 - time * 0.7) * 0.2 +
          Math.sin((sampleHorizontal + sampleVertical) * 8 + time * 0.45) *
            0.13;
        const glowX =
          sampleHorizontal - (0.5 + Math.sin(time * 0.5) * 0.06);
        const glowY =
          sampleVertical - (0.35 + Math.cos(time * 0.4) * 0.08);
        const glow = Math.exp(-(glowX * glowX + glowY * glowY) * 8) * 0.22;
        const level = Math.max(
          0,
          Math.min(
            3,
            Math.pow(Math.sin(Math.PI * sampleHorizontal), 1.4) * 2.65 +
              sampleVertical * 0.3 +
              wave +
              glow -
              cursorInfluence *
                (0.22 + spiralDensity * 0.24 + wave * 0.05),
          ),
        );
        const lowerColor = Math.floor(level);
        const blend = level - lowerColor;
        const threshold = Math.min(
          0.98,
          (bayerMatrix[(y % 4) * 4 + (x % 4)] + 0.5) / 16 +
            cursorInfluence * (0.02 + spiralDensity * 0.08),
        );
        const colorIndex = Math.min(3, lowerColor + (blend > threshold ? 1 : 0));
        const color = palette[colorIndex];
        const pixelIndex = (y * width + x) * 4;

        pixels[pixelIndex] = color[0];
        pixels[pixelIndex + 1] = color[1];
        pixels[pixelIndex + 2] = color[2];
        pixels[pixelIndex + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  };

  const animateDither = (timestamp) => {
    updateCursor(timestamp);

    const isInteractive =
      cursor.targetStrength > 0 || cursor.strength > 0.002;
    const frameInterval = isInteractive
      ? interactiveFrameInterval
      : idleFrameInterval;

    if (timestamp - lastRender >= frameInterval) {
      renderDither(timestamp);
      lastRender = timestamp;
    }

    animationFrame = window.requestAnimationFrame(animateDither);
  };

  const resizeDither = () => {
    ditherCanvas.width = Math.max(240, Math.round(window.innerWidth / 4));
    ditherCanvas.height = Math.max(140, Math.round(window.innerHeight / 4));
    image = context?.createImageData(ditherCanvas.width, ditherCanvas.height);
    cursor.targetX = Math.min(cursor.targetX, window.innerWidth);
    cursor.targetY = Math.min(cursor.targetY, window.innerHeight);
    renderDither(motionPreference.matches ? 0 : performance.now());
  };

  const scheduleDitherResize = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(resizeDither);
  };

  const stopDitherAnimation = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const startDitherAnimation = () => {
    if (animationFrame || document.hidden || motionPreference.matches) {
      return;
    }

    previousFrame = performance.now();
    lastRender = previousFrame - idleFrameInterval;
    animationFrame = window.requestAnimationFrame(animateDither);
  };

  const updateDitherMotion = () => {
    stopDitherAnimation();
    updatePointerSupport();

    if (motionPreference.matches) {
      resetCursor();
      renderDither(0);
      return;
    }

    renderDither(performance.now());
    startDitherAnimation();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      fadeCursor();
      stopDitherAnimation();
      return;
    }

    startDitherAnimation();
  };

  resizeDither();
  updateDitherMotion();
  window.addEventListener("resize", scheduleDitherResize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  motionPreference.addEventListener("change", updateDitherMotion);
  cursorPreference.addEventListener("change", updatePointerSupport);
}
