"use client";

/**
 * Gráficas SVG portadas de calculadora_viabilidad.html:
 * radar de enfoques, histograma de Monte Carlo y tornado de sensibilidad.
 */
import { DIMS, money, type MonteResult } from "@/lib/calculo";
import type { DimKey } from "@/lib/tipos";

export function Radar({ sc }: { sc: Record<DimKey, number> }) {
  const cx = 190,
    cy = 165,
    R = 105,
    n = DIMS.length;
  const pt = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  const rings = [25, 50, 75, 100];
  const shape = DIMS.map((d, i) => pt(i, sc[d.k]));
  return (
    <svg
      className="chart"
      viewBox="0 0 380 330"
      role="img"
      aria-label="Gráfico de radar con el puntaje de cada enfoque"
    >
      {rings.map((l) => (
        <g key={l}>
          <polygon
            points={DIMS.map((_, i) => pt(i, l).join(",")).join(" ")}
            fill="none"
            stroke="var(--line)"
          />
          <text x={cx + 4} y={cy - (R * l) / 100 + 11} fontSize="9">
            {l}
          </text>
        </g>
      ))}
      {DIMS.map((d, i) => {
        const p = pt(i, 100),
          q = pt(i, 122);
        const an = q[0] < cx - 10 ? "end" : q[0] > cx + 10 ? "start" : "middle";
        return (
          <g key={d.k}>
            <line x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--line)" />
            <text className="tx" x={q[0]} y={q[1] + 4} fontSize="12" textAnchor={an}>
              {d.n}
            </text>
          </g>
        );
      })}
      <polygon
        points={shape.map((p) => p.join(",")).join(" ")}
        fill="var(--accent)"
        fillOpacity="0.22"
        stroke="var(--accent)"
        strokeWidth="2"
      />
      {shape.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--accent)" />
      ))}
    </svg>
  );
}

export function Histograma({ mc, moneda }: { mc: MonteResult; moneda: string }) {
  const v = mc.v,
    lo = v[0],
    hi = v[v.length - 1],
    B = 28,
    W = 600,
    H = 190,
    L = 10,
    Rr = 10,
    T = 10,
    Bt = 34;
  const bins = new Array(B).fill(0),
    w = (hi - lo) / B || 1;
  v.forEach((x) => {
    bins[Math.min(B - 1, Math.floor((x - lo) / w))]++;
  });
  const mx = Math.max(...bins),
    bw = (W - L - Rr) / B,
    X = (x: number) => L + ((x - lo) / (hi - lo || 1)) * (W - L - Rr);
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Histograma de los VAN simulados"
    >
      {bins.map((c: number, i: number) => {
        const mid = lo + (i + 0.5) * w,
          h = (c / mx) * (H - T - Bt);
        return (
          <rect
            key={i}
            x={L + i * bw + 1}
            y={H - Bt - h}
            width={bw - 2}
            height={h}
            fill={mid >= 0 ? "var(--good)" : "var(--bad)"}
            opacity="0.85"
          />
        );
      })}
      <line x1={L} x2={W - Rr} y1={H - Bt} y2={H - Bt} stroke="var(--line)" />
      {lo < 0 && hi > 0 && (
        <>
          <line
            x1={X(0)}
            x2={X(0)}
            y1={T}
            y2={H - Bt + 4}
            stroke="var(--ink)"
            strokeDasharray="3 3"
          />
          <text x={X(0)} y={H - Bt + 17} fontSize="11" textAnchor="middle" className="tx">
            VAN = 0
          </text>
        </>
      )}
      <text x={L} y={H - 6} fontSize="11">
        {money(lo, moneda)}
      </text>
      <text x={W - Rr} y={H - 6} fontSize="11" textAnchor="end">
        {money(hi, moneda)}
      </text>
    </svg>
  );
}

export interface TornadoItem {
  n: string;
  lo: number;
  hi: number;
  ll: string;
  hl: string;
}

export function Tornado({
  items,
  base,
  moneda,
}: {
  items: TornadoItem[];
  base: number;
  moneda: string;
}) {
  const W = 620,
    rowH = 34,
    H = items.length * rowH + 30,
    L = 150,
    Rr = 70;
  const vals = [base];
  items.forEach((i) => vals.push(i.lo, i.hi));
  const mn = Math.min(...vals),
    mx = Math.max(...vals),
    X = (v: number) => L + ((v - mn) / (mx - mn || 1)) * (W - L - Rr);
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Gráfico de tornado de sensibilidad del VAN"
    >
      {items.map((it, k) => {
        const y = 10 + k * rowH;
        const a = [
          [it.lo, it.ll],
          [it.hi, it.hl],
        ].sort((p, q) => (p[0] as number) - (q[0] as number));
        return (
          <g key={it.n}>
            <text className="tx" x="0" y={y + 17} fontSize="12">
              {it.n}
            </text>
            {[
              [it.lo, it.ll],
              [it.hi, it.hl],
            ].map(([v], j) => {
              const vv = v as number;
              const x1 = X(Math.min(vv, base)),
                x2 = X(Math.max(vv, base));
              return (
                <rect
                  key={j}
                  x={x1}
                  y={y + 4}
                  width={Math.max(2, x2 - x1)}
                  height="20"
                  fill={vv >= base ? "var(--good)" : "var(--bad)"}
                  opacity="0.8"
                  rx="2"
                />
              );
            })}
            <text x={X(a[0][0] as number) - 6} y={y + 18} fontSize="10" textAnchor="end">
              {a[0][1]}
            </text>
            <text x={X(a[1][0] as number) + 6} y={y + 18} fontSize="10">
              {a[1][1]}
            </text>
          </g>
        );
      })}
      <line x1={X(base)} x2={X(base)} y1="4" y2={H - 18} stroke="var(--ink)" />
      <text x={X(base)} y={H - 4} fontSize="11" textAnchor="middle" className="tx">
        VAN base {money(base, moneda)}
      </text>
    </svg>
  );
}
