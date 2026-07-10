import { useMemo, useState } from "react";
import { getCircleData, loopFeedLines } from "../data/journey";

interface BlockerCircleProps {
  journeyStage: number;
  answers: Record<string, string>;
  trigger?: string;
  resourceName?: string | null;
  agreementText?: string | null;
  variant: "live" | "summary";
  interactive?: boolean;
}

const TRUNCATE_LEN = 40;

function truncate(text: string, max = TRUNCATE_LEN): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// ── geometry helpers ───────────────────────────────────────────────────
const CX = 240;
const CY = 200;
const R = 140;
const GAP_DEG = 28; // angular clearance left/right of each node for the arrows

function pointAt(angleDeg: number, radius: number = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

// Clockwise arc between two angles (in degrees), both within a single
// 0-360 sweep. Assumes end > start and the sweep is under 180°.
function arcPath(startDeg: number, endDeg: number, radius: number = R) {
  const p1 = pointAt(startDeg, radius);
  const p2 = pointAt(endDeg, radius);
  return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`;
}

// trigger(-90) -> feeling(30) -> reaction(150) -> back to trigger(270)
// This ordering reads clockwise: ⚡ top → ❤️ lower-right → 🌀 lower-left.
const ANGLE_TRIGGER = -90;
const ANGLE_FEELING = 30;
const ANGLE_REACTION = 150;
const ANGLE_TRIGGER_WRAP = 270; // -90 + 360, for closing-arc math

const posTrigger = pointAt(ANGLE_TRIGGER);
const posFeeling = pointAt(ANGLE_FEELING);
const posReaction = pointAt(ANGLE_REACTION);

const arcTriggerToFeeling = arcPath(ANGLE_TRIGGER + GAP_DEG, ANGLE_FEELING - GAP_DEG);
const arcFeelingToReaction = arcPath(ANGLE_FEELING + GAP_DEG, ANGLE_REACTION - GAP_DEG);
const arcReactionToTrigger = arcPath(ANGLE_REACTION + GAP_DEG, ANGLE_TRIGGER_WRAP - GAP_DEG);

// Full circle path (two 180° arcs) used as the travel path for the pulse dot.
const fullCirclePath = `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`;

const NODE_W = 132;
const NODE_H = 76;

// ── Closing-arc label pill (round 6 fix) ────────────────────────────────
// Bug (owner screenshot feedback): the label used to sit at R+34 near the
// top-left, where it got clipped by the viewBox edge and crossed by the
// closing arc itself. Fix: pin it as a fixed-size pill fully outside the
// circle in the upper-left quadrant, connected to the arc by a short
// leader line, and widen the viewBox (see the `viewBox` prop below) so the
// pill — which now sits at negative x — isn't clipped.
//
// Geometry proof (SVG user units; CX=240 CY=200 R=140, NODE_W=132 NODE_H=76):
//  - Label pill box:  x ∈ [-100, 80],  y ∈ [118, 182]   (LABEL_W=180, LABEL_H=64,
//    centered at (-10, 150)).
//  - Trigger node box: x ∈ [174, 306], y ∈ [22, 98] (top of the circle).
//    x-ranges are disjoint (pill's max-x 80 < trigger's min-x 174), so no
//    overlap is possible regardless of how long the truncated label text is
//    — the pill's box size is fixed, only its (clipped) text content varies.
//  - Reaction node box: x ∈ [52.76, 184.76], y ∈ [232, 308] (lower-left).
//    y-ranges are disjoint (pill's max-y 182 < reaction's min-y 232), so
//    again no overlap is possible at any label length.
//  - Closing arc (angles 178°→242°, radius R=140): for y ∈ [115, 185] (the
//    pill's y-span with a little slack), the arc's x = CX - √(R² - (y-CY)²)
//    ranges from ~100.8 (at y=185) to ~128.76 (at y=130, the arc's own
//    midpoint) to ~128.76 (at y=115) — i.e. always ≥ 100.8, comfortably to
//    the right of the pill's right edge (x=80). The arc never crosses the
//    pill, leaving a ~20-48px gap for the leader line.
//  - Distance from the circle's center (240,200) to the pill rect's nearest
//    corner (80,185) is √(160² + 15²) ≈ 160.7 > R(140) — the whole pill is
//    outside the circle.
const LABEL_W = 180;
const LABEL_H = 64;
const labelBox = { x: -100, y: 118 }; // top-left corner of the pill
const labelCenter = { x: labelBox.x + LABEL_W / 2, y: labelBox.y + LABEL_H / 2 }; // (-10, 150)
// Point ON the closing arc itself (radius R, not R+something) — the leader
// line's target, so it visibly connects the pill to the arc it explains.
const closingArcAnchor = pointAt((ANGLE_REACTION + ANGLE_TRIGGER_WRAP) / 2, R);
// Leader line from the pill's right edge to the arc anchor point. Both
// endpoints checked above to sit clear of the trigger/reaction node boxes.
const leaderLineStart = { x: labelBox.x + LABEL_W, y: labelCenter.y };

// Exit crack: from the reaction node, curving down-left, outside the circle.
// Starts NODE_H/2 + 10px below the reaction node's center so the path's
// start point clears the node box's bottom edge (y=308) instead of
// originating inside it (round 6 fix — it used to start at +34, i.e.
// y=304, a few px *inside* the box).
const exitBoxCenter = { x: 100, y: 430 };
const exitCrackStart = { x: posReaction.x - 6, y: posReaction.y + NODE_H / 2 + 10 };
const exitCrackPath = `M ${exitCrackStart.x} ${exitCrackStart.y} C ${posReaction.x - 40} ${posReaction.y + 90}, ${exitBoxCenter.x + 20} ${exitBoxCenter.y - 70}, ${exitBoxCenter.x} ${exitBoxCenter.y - 34}`;

function NodeBox({
  x,
  y,
  icon,
  label,
  value,
}: {
  x: number;
  y: number;
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <foreignObject x={x - NODE_W / 2} y={y - NODE_H / 2} width={NODE_W} height={NODE_H}>
      <div
        // @ts-expect-error -- xmlns is valid on foreignObject content but not in React's typings
        xmlns="http://www.w3.org/1999/xhtml"
        title={value}
        className="bc-node-box w-full h-full flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-white/10 bg-[#171a23]/95 px-2 py-1 text-center shadow-lg"
        dir="rtl"
      >
        <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-1">
          <span className="text-sm leading-none">{icon}</span> {label}
        </span>
        <span className="text-white text-xs font-bold leading-snug break-words">
          {truncate(value)}
        </span>
      </div>
    </foreignObject>
  );
}

export default function BlockerCircle({
  journeyStage,
  answers,
  trigger,
  resourceName,
  agreementText,
  variant,
  interactive = false,
}: BlockerCircleProps) {
  const [exited, setExited] = useState(false);

  const data = useMemo(
    () => getCircleData(journeyStage, answers, trigger),
    [journeyStage, answers, trigger]
  );

  const isGoalMap = journeyStage === 4;
  const isBindMap = journeyStage === 3;

  const centerHeading = isGoalMap
    ? "מה עומד ביני לבין המטרה"
    : "אמונת הליבה שמפעילה את הלולאה";

  const centerValue = isGoalMap
    ? (data.agreement !== "—" ? data.agreement : "—")
    : isBindMap
    ? (data.belief !== "—" ? `על מה זה שמר: ${data.belief}` : "—")
    : data.belief;

  const nodeLabels = isGoalMap
    ? { trigger: "הלחישה של החוסם", feeling: "על מה זה שומר", reaction: "הכוח שכבר יש לי" }
    : { trigger: "הטריגר", feeling: "מה הרגשתי", reaction: "מה עשיתי אוטומטית" };

  // Round 5 (chapter 1): stage 1/2 reactions each have an owner-approved
  // "loop feed" line (how that specific reaction feeds the next trigger).
  // When the trainee's reaction answer matches one, show it instead of the
  // generic label — it's the whole point of the closing arc.
  const loopFeedLine = !isGoalMap && data.reaction !== "—" ? loopFeedLines[data.reaction] : undefined;
  const closingLabelFull = isGoalMap
    ? "...ובכל זאת עוצר אותי מהמטרה"
    : loopFeedLine || "...ומייצר את הטריגר הבא";

  const showExitCrack = Boolean((resourceName && resourceName.trim()) || (agreementText && agreementText.trim()));
  const animated = variant === "summary" && interactive;

  const containerMaxWidth = variant === "live" ? "max-w-xs" : "max-w-lg";

  return (
    <div className={`bc-root ${containerMaxWidth} mx-auto w-full`} dir="rtl">
      <svg
        viewBox={`-140 0 620 520`}
        className="bc-svg w-full h-auto"
        role="img"
        aria-label="מעגל החסם"
      >
        <defs>
          <marker id="bc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-amber-500/50" />
          </marker>
          <marker id="bc-arrow-strong" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="fill-amber-400" />
          </marker>
          <marker id="bc-arrow-dashed" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" className="fill-neutral-400" />
          </marker>
        </defs>

        {/* Regular arcs */}
        <path
          d={arcTriggerToFeeling}
          fill="none"
          className="stroke-amber-500/40"
          strokeWidth={2.5}
          markerEnd="url(#bc-arrow)"
        />
        <path
          d={arcFeelingToReaction}
          fill="none"
          className="stroke-amber-500/40"
          strokeWidth={2.5}
          markerEnd="url(#bc-arrow)"
        />

        {/* Closing arc — emphasized, this is what feeds the next loop */}
        <path
          d={arcReactionToTrigger}
          fill="none"
          className={`bc-closing-arc stroke-amber-400 transition-opacity duration-700 ${exited ? "opacity-10" : "opacity-100"}`}
          strokeWidth={4.5}
          markerEnd="url(#bc-arrow-strong)"
        />
        {/* Leader line — connects the pill (fully outside the circle) to the
            point on the closing arc it explains. Geometry proved above. */}
        <line
          x1={leaderLineStart.x}
          y1={leaderLineStart.y}
          x2={closingArcAnchor.x}
          y2={closingArcAnchor.y}
          className={`stroke-amber-400/50 transition-opacity duration-700 ${exited ? "opacity-10" : "opacity-100"}`}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <foreignObject x={labelBox.x} y={labelBox.y} width={LABEL_W} height={LABEL_H}>
          <div
            // @ts-expect-error -- xmlns is valid on foreignObject content but not in React's typings
            xmlns="http://www.w3.org/1999/xhtml"
            title={closingLabelFull}
            className={`bc-closing-label w-full h-full flex items-center justify-center text-center rounded-xl border border-amber-400/25 bg-[#171a23]/90 px-2.5 py-1.5 transition-opacity duration-700 ${exited ? "opacity-10" : "opacity-100"}`}
          >
            <span
              className="text-[10px] font-bold text-amber-400/90 leading-tight overflow-hidden"
              style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
            >
              {closingLabelFull}
            </span>
          </div>
        </foreignObject>

        {/* Center — the belief / goal that the loop revolves around */}
        <foreignObject x={CX - 100} y={CY - 62} width={200} height={124}>
          <div
            // @ts-expect-error -- xmlns is valid on foreignObject content but not in React's typings
            xmlns="http://www.w3.org/1999/xhtml"
            title={centerValue}
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 text-center"
          >
            <span className="text-[9px] font-bold tracking-widest text-amber-500/80 uppercase">
              {centerHeading}
            </span>
            <span className="text-white text-xs font-bold leading-snug break-words">
              {truncate(centerValue, 60)}
            </span>
          </div>
        </foreignObject>

        {/* Exit crack — the way out, only when there's a resource/agreement to show */}
        {showExitCrack && (
          <>
            <path
              d={exitCrackPath}
              fill="none"
              className="stroke-neutral-400"
              strokeWidth={2}
              strokeDasharray="5 5"
              markerEnd="url(#bc-arrow-dashed)"
            />
            <foreignObject x={exitBoxCenter.x - 95} y={exitBoxCenter.y - 34} width={190} height={80}>
              <div
                // @ts-expect-error -- xmlns is valid on foreignObject content but not in React's typings
                xmlns="http://www.w3.org/1999/xhtml"
                role={interactive ? "button" : undefined}
                onClick={interactive ? () => setExited((v) => !v) : undefined}
                className={`bc-exit-box w-full h-full flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-emerald-400/50 bg-emerald-500/10 px-3 py-1.5 text-center shadow-[0_0_20px_rgba(52,211,153,0.25)] ${interactive ? "cursor-pointer" : ""}`}
              >
                <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                  🚪 הדלת החוצה
                </span>
                {resourceName && (
                  <span className="text-emerald-200 text-[11px] font-bold leading-tight">{truncate(resourceName, 30)}</span>
                )}
                {agreementText && (
                  <span className="text-white text-[11px] font-medium leading-tight break-words" title={agreementText}>
                    {truncate(agreementText, 45)}
                  </span>
                )}
              </div>
            </foreignObject>
          </>
        )}

        {/* Circumference nodes */}
        <NodeBox x={posTrigger.x} y={posTrigger.y} icon="⚡" label={nodeLabels.trigger} value={data.trigger} />
        <NodeBox x={posFeeling.x} y={posFeeling.y} icon="❤️" label={nodeLabels.feeling} value={data.feeling} />
        <NodeBox x={posReaction.x} y={posReaction.y} icon="🌀" label={nodeLabels.reaction} value={data.reaction} />

        {/* Traveling pulse — only for the interactive summary variant */}
        {animated && !exited && (
          <circle r={5} className="bc-pulse fill-amber-400">
            <animateMotion
              id="bc-pulse-intro"
              path={fullCirclePath}
              dur="6s"
              repeatCount="2"
              rotate="auto"
            />
            <animateMotion
              begin="bc-pulse-intro.end"
              path={fullCirclePath}
              dur="10s"
              repeatCount="indefinite"
              rotate="auto"
            />
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Exit pulse — plays once when the trainee clicks the exit crack */}
        {animated && exited && (
          <circle key="exit-pulse" r={5} className="bc-pulse fill-emerald-400">
            <animateMotion path={exitCrackPath} dur="1.1s" fill="freeze" begin="0s" />
          </circle>
        )}
      </svg>

      <style>{`
        @media print {
          .bc-pulse,
          .bc-pulse animateMotion,
          .bc-pulse animate {
            display: none !important;
          }
          .bc-node-box {
            background: white !important;
            border-color: #ccc !important;
            box-shadow: none !important;
          }
          .bc-node-box span {
            color: black !important;
          }
          .bc-closing-arc {
            opacity: 1 !important;
          }
          .bc-svg .fill-amber-500\\/50,
          .bc-svg .fill-amber-400,
          .bc-svg .stroke-amber-500\\/40,
          .bc-svg .stroke-amber-400 {
            fill: #444 !important;
            stroke: #444 !important;
          }
          .bc-closing-label {
            background: white !important;
            border-color: #ccc !important;
            opacity: 1 !important;
          }
          .bc-closing-label span {
            color: #444 !important;
          }
        }
      `}</style>
    </div>
  );
}
