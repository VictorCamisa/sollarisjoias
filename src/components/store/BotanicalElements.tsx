/**
 * Botanical SVG decorative elements inspired by Larifa's brand identity.
 * Tropical leaf silhouettes used as dividers, corners, and background patterns.
 */

/* ═══════════════════════════════════════════════════════════════
   LEAF SVG PATHS — reusable tropical leaf shapes
═══════════════════════════════════════════════════════════════ */

/** A flowing tropical leaf */
const LeafPath1 = () => (
  <path d="M0,50 C10,30 25,10 50,5 C65,2 80,15 85,30 C90,45 80,60 65,65 C50,70 35,60 25,50 C15,40 5,55 0,50 Z" />
);

/** A narrower elongated leaf */
const LeafPath2 = () => (
  <path d="M10,80 C15,60 30,35 55,20 C70,12 85,20 90,35 C95,50 85,65 70,70 C55,75 40,68 30,60 C20,52 12,70 10,80 Z" />
);

/** A small round leaf */
const LeafPath3 = () => (
  <path d="M5,40 C10,20 30,5 50,8 C65,10 75,25 72,42 C69,58 55,68 40,65 C25,62 10,50 5,40 Z" />
);

/* ═══════════════════════════════════════════════════════════════
   BOTANICAL WAVE DIVIDER — organic wave with leaf silhouettes
═══════════════════════════════════════════════════════════════ */
export const BotanicalDivider = ({
  flip = false,
  bgClass = "fill-background",
  leafOpacity = 0.06,
}: {
  flip?: boolean;
  bgClass?: string;
  leafOpacity?: number;
}) => (
  <div
    className={`relative w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`}
    style={{ marginTop: "-1px", marginBottom: "-1px" }}
  >
    <svg
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className={`w-full h-[60px] md:h-[100px]`}
    >
      {/* Wave shape */}
      <path
        d="M0,50 C240,90 480,10 720,50 C960,90 1200,20 1440,50 L1440,100 L0,100 Z"
        className={bgClass}
      />
      {/* Decorative leaves on the wave */}
      <g opacity={leafOpacity} className={bgClass}>
        <g transform="translate(120, 20) scale(0.6) rotate(-25)">
          <LeafPath1 />
        </g>
        <g transform="translate(900, 15) scale(0.5) rotate(15)">
          <LeafPath2 />
        </g>
        <g transform="translate(1250, 25) scale(0.4) rotate(-10)">
          <LeafPath3 />
        </g>
      </g>
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   CORNER DECORATION — leaf cluster for section corners
═══════════════════════════════════════════════════════════════ */
export const CornerLeaves = ({
  position = "top-right",
  className = "",
  opacity = 0.06,
}: {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
  opacity?: number;
}) => {
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0 -scale-x-100",
    "bottom-right": "bottom-0 right-0 -scale-y-100",
    "bottom-left": "bottom-0 left-0 -scale-x-100 -scale-y-100",
  };

  return (
    <div className={`absolute ${positionClasses[position]} pointer-events-none ${className}`}>
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        className="w-[200px] h-[200px] md:w-[320px] md:h-[320px]"
        style={{ opacity }}
      >
        <g fill="currentColor">
          {/* Main large leaf */}
          <g transform="translate(180, -20) rotate(35) scale(2.2)">
            <LeafPath1 />
          </g>
          {/* Medium leaf */}
          <g transform="translate(220, 80) rotate(55) scale(1.5)">
            <LeafPath2 />
          </g>
          {/* Small accent leaf */}
          <g transform="translate(140, 60) rotate(15) scale(1.2)">
            <LeafPath3 />
          </g>
          {/* Extra small leaf */}
          <g transform="translate(260, 160) rotate(70) scale(0.9)">
            <LeafPath3 />
          </g>
        </g>
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   BOTANICAL BACKGROUND PATTERN — subtle repeating leaves
═══════════════════════════════════════════════════════════════ */
export const BotanicalPattern = ({
  opacity = 0.04,
  className = "",
}: {
  opacity?: number;
  className?: string;
}) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
    <svg
      className="w-full h-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <g fill="currentColor">
        {/* Scattered leaves across the pattern */}
        <g transform="translate(50, 50) rotate(-20) scale(1.8)">
          <LeafPath1 />
        </g>
        <g transform="translate(350, 100) rotate(40) scale(1.3)">
          <LeafPath2 />
        </g>
        <g transform="translate(650, 80) rotate(-15) scale(1.6)">
          <LeafPath3 />
        </g>
        <g transform="translate(150, 350) rotate(60) scale(1.4)">
          <LeafPath2 />
        </g>
        <g transform="translate(500, 300) rotate(-35) scale(2)">
          <LeafPath1 />
        </g>
        <g transform="translate(700, 400) rotate(25) scale(1.1)">
          <LeafPath3 />
        </g>
        <g transform="translate(250, 500) rotate(-50) scale(1.7)">
          <LeafPath1 />
        </g>
        <g transform="translate(600, 520) rotate(10) scale(1.2)">
          <LeafPath2 />
        </g>
      </g>
    </svg>
  </div>
);
