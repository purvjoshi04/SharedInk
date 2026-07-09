export function WhiteboardMockup() {
  return (
    <div className="relative w-full aspect-4/3 rounded-2xl border border-white/15 bg-black overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/10">
        <span className="h-2.5 w-2.5 rounded-full border border-white/40" />
        <span className="h-2.5 w-2.5 rounded-full border border-white/40" />
        <span className="h-2.5 w-2.5 rounded-full border border-white/40" />
        <span className="ml-4 text-[11px] text-white/40 tracking-wide">sharedink.app / board / team-canvas</span>
      </div>

      {/* dot grid canvas */}
      <div
        className="absolute inset-0 top-9"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <svg
        viewBox="0 0 800 560"
        className="absolute inset-0 top-9 w-full h-[calc(100%-2.25rem)]"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* hand-drawn rectangle */}
        <path d="M70 90 C 200 85, 320 92, 300 88 L 300 190 C 302 205, 180 200, 68 195 Z" />
        <text x="90" y="130" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="22">
          Idea board
        </text>
        <text x="90" y="160" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="16" opacity="0.7">
          brainstorm →
        </text>

        {/* circle */}
        <path d="M470 140 C 540 120, 610 160, 600 210 C 590 260, 510 270, 460 240 C 420 215, 410 165, 470 140 Z" />
        <text x="485" y="200" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="20">
          Users
        </text>

        {/* arrow rect to circle */}
        <path d="M305 145 C 360 140, 400 150, 445 170" />
        <path d="M438 162 L 452 172 L 438 180" />

        {/* sticky note 1 */}
        <path d="M90 260 L 220 258 L 220 358 L 88 362 Z" />
        <text x="105" y="295" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="18">
          ship v1
        </text>
        <text x="105" y="322" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="14" opacity="0.7">
          - realtime cursors
        </text>
        <text x="105" y="342" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="14" opacity="0.7">
          - export png
        </text>

        {/* sticky note 2 */}
        <path d="M260 280 L 380 275 L 382 370 L 258 372 Z" />
        <text x="275" y="310" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="18">
          research
        </text>
        <text x="275" y="335" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="14" opacity="0.7">
          talk to 5 teams
        </text>

        {/* diamond */}
        <path d="M500 320 L 600 300 L 640 380 L 540 410 Z" />
        <text x="540" y="360" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="18">
          decide
        </text>

        {/* connection line sticky -> diamond */}
        <path d="M382 320 C 430 322, 470 322, 500 340" strokeDasharray="4 6" />

        {/* freehand squiggle */}
        <path d="M420 450 C 440 430, 470 470, 490 450 S 540 430, 560 460 S 620 470, 660 445" />

        {/* small circle node */}
        <path d="M690 250 C 720 245, 735 275, 720 295 C 700 315, 670 300, 675 275 C 678 260, 685 253, 690 250 Z" />
        <text x="686" y="280" fill="white" stroke="none" fontFamily="var(--font-caveat), cursive" fontSize="14">
          v2
        </text>

        {/* arrow diamond -> node */}
        <path d="M640 340 C 665 320, 685 300, 700 300" />
        <path d="M694 293 L 703 300 L 696 308" />

        {/* cursors */}
        <g stroke="none" fill="white">
          <path d="M330 200 l 12 4 l -5 3 l 3 8 l -3 1 l -3 -8 l -5 2 z" />
        </g>
        <text x="345" y="215" fill="white" stroke="none" fontFamily="Inter, sans-serif" fontSize="10">
          Ada
        </text>

        <g stroke="none" fill="white" opacity="0.7">
          <path d="M560 370 l 12 4 l -5 3 l 3 8 l -3 1 l -3 -8 l -5 2 z" />
        </g>
        <text x="575" y="385" fill="white" stroke="none" fontFamily="Inter, sans-serif" fontSize="10" opacity="0.7">
          Kai
        </text>
      </svg>
    </div>
  );
}
