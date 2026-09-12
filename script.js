const timeElement = document.querySelector("#almaty-time");

const updateAstanaTime = () => {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  timeElement.textContent = `${formattedTime}, GMT +5`;
  timeElement.dateTime = now.toISOString();
};

updateAstanaTime();
window.setInterval(updateAstanaTime, 30000);

const designCanvas = document.querySelector(".design-canvas");
const defaultPageTitle = document.title;

const updatePageView = () => {
  const isWorkEthicPage = window.location.hash === "#work-ethic";

  designCanvas?.classList.toggle("is-work-ethic", isWorkEthicPage);
  document.title = isWorkEthicPage
    ? "My Work Ethic — Vladislav Solomonov"
    : defaultPageTitle;
};

updatePageView();
window.addEventListener("hashchange", updatePageView);

const ditherCanvas = document.querySelector(".dither-background");

if (ditherCanvas) {
  const context = ditherCanvas.getContext("2d", { alpha: false });
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
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
  let animationFrame;
  let lastRender = 0;

  const renderDither = (timestamp = 0) => {
    if (!context) {
      return;
    }

    const { width, height } = ditherCanvas;
    const image = context.createImageData(width, height);
    const pixels = image.data;
    const time = timestamp * 0.00018;

    for (let y = 0; y < height; y += 1) {
      const vertical = y / height;

      for (let x = 0; x < width; x += 1) {
        const horizontal = x / width;
        const wave =
          Math.sin(horizontal * 6 + time) * 0.28 +
          Math.cos(vertical * 5 - time * 0.7) * 0.2 +
          Math.sin((horizontal + vertical) * 8 + time * 0.45) * 0.13;
        const glowX = horizontal - (0.5 + Math.sin(time * 0.5) * 0.06);
        const glowY = vertical - (0.35 + Math.cos(time * 0.4) * 0.08);
        const glow = Math.exp(-(glowX * glowX + glowY * glowY) * 8) * 0.22;
        const level = Math.max(
          0,
          Math.min(
            3,
            Math.pow(Math.sin(Math.PI * horizontal), 1.4) * 2.65 +
              vertical * 0.3 +
              wave +
              glow,
          ),
        );
        const lowerColor = Math.floor(level);
        const blend = level - lowerColor;
        const threshold = (bayerMatrix[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
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
    if (timestamp - lastRender >= 80) {
      renderDither(timestamp);
      lastRender = timestamp;
    }

    animationFrame = window.requestAnimationFrame(animateDither);
  };

  const resizeDither = () => {
    ditherCanvas.width = Math.max(240, Math.round(window.innerWidth / 4));
    ditherCanvas.height = Math.max(140, Math.round(window.innerHeight / 4));
    renderDither(performance.now());
  };

  const updateDitherMotion = () => {
    window.cancelAnimationFrame(animationFrame);
    renderDither(0);

    if (!motionPreference.matches) {
      animationFrame = window.requestAnimationFrame(animateDither);
    }
  };

  resizeDither();
  updateDitherMotion();
  window.addEventListener("resize", resizeDither);
  motionPreference.addEventListener("change", updateDitherMotion);
}
