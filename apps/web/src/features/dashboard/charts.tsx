"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Biểu đồ nhỏ tự vẽ (SVG / HTML), không cần thư viện. Quy ước:
 *  - Cột ≤ 24px, đầu cột bo 4px, gốc vuông; đường 2px; vùng dưới đường 10% độ đậm.
 *  - Lưới / trục mảnh 1px, màu nhạt; chữ dùng màu chữ, không dùng màu dữ liệu.
 *  - Tooltip khi rê chuột hoặc focus bàn phím; mọi số liệu cũng có trong bảng bên dưới (DataTable).
 * Màu dữ liệu lấy từ biến CSS --series-1 / --series-2 (đã kiểm tra tương phản & mù màu).
 */

/** Chiều rộng thực của phần tử, cập nhật khi đổi kích thước (để SVG vẽ đúng pixel, chữ không bị co). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Trục giá trị "đẹp": 0 → max theo bước 1/2/5 × 10^n, khoảng 4 vạch. */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });
export const formatCount = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : n.toLocaleString("vi-VN"));

type Tip = { x: number; y: number; title: string; value: string } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      <span>{tip.title}</span>
    </div>
  );
}

/** Đường dẫn cột: đầu bo 4px, gốc vuông. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

/** Biểu đồ cột một dãy (vd lượt check-in hợp lệ theo khung giờ). */
export function ColumnChart({
  data,
  height = 220,
  ariaLabel,
}: {
  data: Array<{ tick: string; title: string; value: number }>;
  height?: number;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip>(null);
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 1));
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, band * 0.6));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  // Nhãn trục X thưa ra để không chồng nhau (~1 nhãn / 56px).
  const every = Math.max(1, Math.ceil(56 / Math.max(band, 1)));

  function show(i: number) {
    const d = data[i];
    setActive(i);
    setTip({ x: PAD.left + band * i + band / 2, y: y(d.value) - 8, title: d.title, value: formatCount(d.value) });
  }
  function hide() {
    setActive(null);
    setTip(null);
  }

  return (
    <div className="chart" ref={ref} onPointerLeave={hide}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {formatCount(t)}
              </text>
            </g>
          ))}
          <line className="chart-axis" x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} />
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const h = y(0) - y(d.value);
            return (
              <g
                key={i}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${d.title}: ${d.value}`}
                onPointerEnter={() => show(i)}
                onFocus={() => show(i)}
                onBlur={hide}
                className="chart-hit"
              >
                {/* Vùng nhận chuột rộng hơn cột. */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent" />
                {d.value > 0 && (
                  <path className={active === i ? "chart-col is-active" : "chart-col"} d={columnPath(cx - barW / 2, y(d.value), barW, h)} />
                )}
                {i % every === 0 && (
                  <text className="chart-tick" x={cx} y={height - 8} textAnchor="middle">
                    {d.tick}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

/** Biểu đồ đường một dãy có vùng tô nhạt + đường dóng dọc theo chuột (vd đăng ký cộng dồn theo ngày). */
export function LineChart({
  data,
  height = 220,
  ariaLabel,
}: {
  data: Array<{ tick: string; title: string; value: number }>;
  height?: number;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 1));
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (plotW * i) / (data.length - 1) : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join("");
  const area = data.length ? `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : "";
  const every = Math.max(1, Math.ceil(64 / Math.max(plotW / Math.max(data.length - 1, 1), 1)));

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left;
    const i = data.length > 1 ? Math.round((rel / rect.width) * (data.length - 1)) : 0;
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(data.length - 1, (h ?? -1) + 1));
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? data.length) - 1));
  }
  const h = hover === null ? null : data[hover];

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={onKey}
          onFocus={() => setHover((v) => v ?? data.length - 1)}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {formatCount(t)}
              </text>
            </g>
          ))}
          <line className="chart-axis" x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} />
          <path className="chart-area" d={area} />
          <path className="chart-line" d={line} />
          {data.map(
            (d, i) =>
              i % every === 0 && (
                <text key={i} className="chart-tick" x={x(i)} y={height - 8} textAnchor="middle">
                  {d.tick}
                </text>
              ),
          )}
          {/* Điểm cuối luôn hiện, kèm nhãn giá trị (nhãn duy nhất trên đường). */}
          {data.length > 0 && (
            <>
              <circle className="chart-dot" cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r={4} />
              <text className="chart-endlabel" x={x(data.length - 1) - 8} y={y(data[data.length - 1].value) - 10} textAnchor="end">
                {formatCount(data[data.length - 1].value)}
              </text>
            </>
          )}
          {h && hover !== null && (
            <>
              <line className="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} />
              <circle className="chart-dot" cx={x(hover)} cy={y(h.value)} r={4} />
            </>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {h && hover !== null && <Tooltip tip={{ x: x(hover), y: y(h.value) - 10, title: h.title, value: formatCount(h.value) }} />}
    </div>
  );
}

/** Thanh ngang xếp từ lớn đến nhỏ, một màu (so sánh các phần với nhau). */
export function RankedBars({
  data,
  format = formatCount,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number; note?: string }>;
  format?: (n: number) => string;
  ariaLabel: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="ranked" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="ranked-row" tabIndex={0} title={`${d.label}: ${format(d.value)}`}>
          <span className="ranked-label">
            {d.label}
            {d.note && <span className="muted small"> · {d.note}</span>}
          </span>
          <span className="ranked-track">
            <span className="ranked-bar" style={{ width: `${(d.value / max) * 100}%` }} />
            <span className="ranked-value">{format(d.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Hai thanh mỗi hàng (vd dự toán vs thực chi theo nhóm), có chú thích; vượt dự toán được ghi rõ bằng chữ. */
export function PairedBars({
  data,
  labels,
  format,
  ariaLabel,
}: {
  data: Array<{ label: string; a: number; b: number }>;
  labels: [string, string];
  format: (n: number) => string;
  ariaLabel: string;
}) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);
  return (
    <div className="paired" aria-label={ariaLabel} role="group">
      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch series-1" aria-hidden="true" /> {labels[0]}
        </span>
        <span className="legend-item">
          <span className="legend-swatch series-2" aria-hidden="true" /> {labels[1]}
        </span>
      </div>
      {data.map((d) => (
        <div key={d.label} className="paired-row" tabIndex={0} title={`${d.label}: ${labels[0]} ${format(d.a)}, ${labels[1]} ${format(d.b)}`}>
          <span className="paired-label">
            {d.label}
            {d.a > 0 && d.b > d.a && <span className="over-tag">Vượt {format(d.b - d.a)}</span>}
          </span>
          <span className="ranked-track">
            <span className="ranked-bar series-1" style={{ width: `${(d.a / max) * 100}%` }} />
            <span className="ranked-value">{format(d.a)}</span>
          </span>
          <span className="ranked-track">
            <span className="ranked-bar series-2" style={{ width: `${(d.b / max) * 100}%` }} />
            <span className="ranked-value">{format(d.b)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Thanh tỷ lệ so với giới hạn (vd đăng ký / sức chứa). Vượt 100% chuyển màu cảnh báo kèm chữ. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <span
      className={pct > 100 ? "meter meter-over" : "meter"}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="meter-fill" style={{ width: `${Math.min(100, pct)}%` }} />
    </span>
  );
}

/** Bảng số liệu của một biểu đồ (gập lại mặc định) – để mọi giá trị đọc được không cần rê chuột. */
export function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <details className="chart-table">
      <summary>Xem bảng số liệu</summary>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c} className={i ? "num" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className={j ? "num" : undefined}>
                    {typeof cell === "number" ? cell.toLocaleString("vi-VN") : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
