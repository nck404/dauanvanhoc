<div class="paper-base"></div>
<div class="paper-overlay"></div>
<div class="ink-stain-overlay"></div>

<svg class="paper-filter-svg" aria-hidden="true">
  <filter id="newspaper-filter">
    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="wrinkles" />
    <feDiffuseLighting in="wrinkles" lighting-color="#fff" surfaceScale="2.2" result="light">
      <feDistantLight azimuth="45" elevation="60" />
    </feDiffuseLighting>
    <feBlend mode="multiply" in="SourceGraphic" in2="light" result="wrinkled" />
    
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" result="fibers" />
    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.05 0" in="fibers" result="coloredFibers"/>
    <feBlend mode="multiply" in="wrinkled" in2="coloredFibers" />
  </filter>
</svg>

<style>
    .paper-filter-svg {
        position: absolute;
        width: 0;
        height: 0;
        pointer-events: none;
    }
    .paper-base {
        position: fixed;
        inset: 0;
        z-index: -5;
        background: radial-gradient(circle, var(--bg-wash) 0%, var(--bg-color) 100%);
        pointer-events: none;
    }
    .paper-overlay {
        position: fixed;
        inset: 0;
        z-index: -4;
        background-color: var(--bg-color);
        filter: url(#newspaper-filter);
        opacity: 0.35;
        pointer-events: none;
    }
    .ink-stain-overlay {
        position: fixed;
        inset: 0;
        z-index: -3;
        background-image: radial-gradient(circle at 80% 20%, rgba(30, 27, 24, 0.02) 0%, transparent 40%),
                          radial-gradient(circle at 10% 80%, rgba(30, 27, 24, 0.03) 0%, transparent 50%);
        pointer-events: none;
    }
</style>
