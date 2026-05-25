"use client";

import type { Fraction } from "@/lib/types";

interface NumberLineProps {
  left: Fraction;
  right: Fraction;
  correctSide: "left" | "right";
  className?: string;
}

function fractionToDecimal(f: Fraction): number {
  return f.numerator / f.denominator;
}

function formatFraction(f: Fraction): string {
  return `${f.numerator}/${f.denominator}`;
}

const TICK_LABELS = ["0", "¼", "½", "¾", "1"];
const TICK_VALUES = [0, 0.25, 0.5, 0.75, 1];

export function NumberLine({ left, right, correctSide, className = "" }: NumberLineProps) {
  const leftVal = fractionToDecimal(left);
  const rightVal = fractionToDecimal(right);

  const largerSide = correctSide === "left" ? left : right;
  const smallerSide = correctSide === "left" ? right : left;
  const largerVal = fractionToDecimal(largerSide);
  const smallerVal = fractionToDecimal(smallerSide);

  // SVG dimensions
  const svgWidth = 320;
  const svgHeight = 80;
  const lineY = 40;
  const lineStart = 24;
  const lineEnd = svgWidth - 24;
  const lineWidth = lineEnd - lineStart;

  function toX(val: number): number {
    return lineStart + val * lineWidth;
  }

  const halfX = toX(0.5);
  const leftX = toX(leftVal);
  const rightX = toX(rightVal);
  const largerX = toX(largerVal);
  const smallerX = toX(smallerVal);

  return (
    <div className={`p-4 bg-slate-50 rounded-xl border border-slate-100 ${className}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
        Number line
      </p>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-sm"
        aria-label="Number line showing fraction positions"
      >
        {/* Main line */}
        <line
          x1={lineStart}
          y1={lineY}
          x2={lineEnd}
          y2={lineY}
          stroke="#cbd5e1"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Tick marks and labels */}
        {TICK_VALUES.map((val, i) => {
          const x = toX(val);
          const isHalf = val === 0.5;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={lineY - (isHalf ? 8 : 5)}
                x2={x}
                y2={lineY + (isHalf ? 8 : 5)}
                stroke={isHalf ? "#94a3b8" : "#cbd5e1"}
                strokeWidth={isHalf ? 2 : 1.5}
              />
              <text
                x={x}
                y={lineY + 20}
                textAnchor="middle"
                fontSize={isHalf ? 11 : 10}
                fill={isHalf ? "#64748b" : "#94a3b8"}
                fontFamily="system-ui, sans-serif"
              >
                {TICK_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Smaller fraction dot */}
        <circle cx={smallerX} cy={lineY} r={5} fill="#94a3b8" />
        <text
          x={smallerX}
          y={lineY - 12}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
          fontFamily="system-ui, sans-serif"
        >
          {formatFraction(smallerSide)}
        </text>

        {/* Larger fraction dot */}
        <circle cx={largerX} cy={lineY} r={6} fill="#6366f1" />
        <text
          x={largerX}
          y={lineY - 14}
          textAnchor="middle"
          fontSize={10}
          fontWeight="600"
          fill="#6366f1"
          fontFamily="system-ui, sans-serif"
        >
          {formatFraction(largerSide)}
        </text>
      </svg>
    </div>
  );
}
