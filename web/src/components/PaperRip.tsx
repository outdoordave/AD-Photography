// Wiederverwendbare „gerissene Papierkante" — 1:1 der Hero-Riss-SVG (HomeHeroLive),
// aber mit eindeutigem id-Präfix, damit mehrere Instanzen auf EINER Seite (z. B.
// Über uns: oben + unten) sich nicht über doppelte Filter-/Gradient-IDs stören.
// Farbe kommt per CSS (currentColor -> .band-rip { color: var(--c-bg) }).

type Props = { idp: string; className?: string };

export default function PaperRip({ idp, className }: Props) {
  return (
    <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${idp}Ramp`} x1="0" y1="66" x2="0" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0"></stop>
          <stop offset="1" stopColor="currentColor" stopOpacity="1"></stop>
        </linearGradient>
        <filter id={`${idp}Dry`} x="-3%" y="-70%" width="106%" height="240%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.18" numOctaves="3" seed="7" stitchTiles="stitch" result="n"></feTurbulence>
          <feColorMatrix in="n" type="luminanceToAlpha" result="na"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.42" result="sum"></feComposite>
          <feComponentTransfer in="sum" result="mask"><feFuncA type="linear" slope="7" intercept="-2.2"></feFuncA></feComponentTransfer>
          <feFlood floodColor="currentColor" result="cream"></feFlood>
          <feComposite in="cream" in2="mask" operator="in" result="col"></feComposite>
          <feDisplacementMap in="col" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
        </filter>
      </defs>
      <rect x="0" y="89" width="1200" height="31" fill="currentColor"></rect>
      <rect x="-20" y="62" width="1240" height="36" fill={`url(#${idp}Ramp)`} filter={`url(#${idp}Dry)`}></rect>
    </svg>
  );
}
