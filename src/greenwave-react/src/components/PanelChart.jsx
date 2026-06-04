// PanelChart — Recharts version with per-point hover popups.
//
// Hover model: instead of Recharts' built-in axis-based <Tooltip>, we
// capture hover at each dot/square via mouse events and render a floating
// popup near the cursor. This means hovering Sample dot A vs Sample dot B
// (even at the same date) shows different info — matching Plotly behavior.
//
// X-axis: time scale (so position is proportional to elapsed time), but
// we cap the number of ticks at ~6 evenly-spaced ones so labels never
// crowd, regardless of how many data points exist.

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { parseISO, format } from 'date-fns';

const COLOR_SAMPLE = '#1D9E75';     // green for individual sample dots
const COLOR_DAILY = '#0F6E50';      // dark green for the daily-average line
const COLOR_HARVEST = '#D85A30';    // orange for harvest squares

// Format a numeric date (epoch ms) into a short axis tick like "Mar 24"
function formatAxisTick(value) {
  return format(new Date(value), 'MMM d');
}

// Generate ~targetCount evenly-spaced tick positions across [minTs, maxTs].
// Returns an array of epoch-ms values. Avoids label crowding when there
// are many data points clustered in a small time window.
function evenTicks(minTs, maxTs, targetCount = 5) {
  if (minTs == null || maxTs == null || minTs === maxTs) return [minTs];
  const step = (maxTs - minTs) / (targetCount - 1);
  const out = [];
  for (let i = 0; i < targetCount; i++) {
    out.push(Math.round(minTs + i * step));
  }
  return out;
}

// --- Per-point popup (rendered as absolutely-positioned div over the chart) ---
function HoverPopup({ point }) {
  if (!point) return null;
  // The popup positions itself near the hovered dot. Offset to the right
  // and up so the cursor doesn't cover the text.
  const style = {
    position: 'absolute',
    left: point.x + 14,
    top: point.y - 10,
    pointerEvents: 'none',          // don't let the popup steal hover
    zIndex: 10,
  };
  return (
    <div style={style}
         className="bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-sm max-w-xs">
      <div className="font-semibold text-gray-700 mb-1">{point.dateStr}</div>
      {point.kind === 'sample' && (
        <div style={{ color: COLOR_SAMPLE }}>
          <b>Sample: {point.weight.toFixed(2)} lb/ft</b>
          {point.notes && (
            <div className="text-xs text-gray-500 italic mt-1 whitespace-normal">
              {point.notes}
            </div>
          )}
        </div>
      )}
      {point.kind === 'daily' && (
        <div style={{ color: COLOR_DAILY }}>
          <b>Daily avg: {point.mean.toFixed(2)} lb/ft</b>
          <div className="text-xs text-gray-500">
            n = {point.n} sample{point.n === 1 ? '' : 's'} that day
          </div>
        </div>
      )}
      {point.kind === 'harvest' && (
        <div style={{ color: COLOR_HARVEST }}>
          <b>Harvest: {point.yieldVal.toFixed(2)} lb/ft</b>
          <div className="text-xs text-gray-500">
            {point.weight != null && point.length != null && (
              <>{point.weight.toFixed(0)} lb / {point.length.toFixed(0)} ft</>
            )}
          </div>
          {point.notes && (
            <div className="text-xs text-gray-500 italic mt-1 whitespace-normal">
              {point.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PanelChart({ panel }) {
  // Build per-series data arrays. Each Line has its own array — that's how
  // we allow multiple sample dots at the same date (e.g. 3 replicates on
  // the same day). The chart's main `data` prop holds the date union so
  // Recharts can compute the x-axis domain across all series.
  const computed = useMemo(() => {
    // Parse a date string into epoch ms, with safety against null/bad values.
    const toTs = (dateStr) => {
      if (!dateStr) return null;
      const ts = parseISO(dateStr).getTime();
      return Number.isNaN(ts) ? null : ts;
    };

    // Series 1: every individual sample (one row per sample, allows duplicates per date)
    const samplePoints = [];
    for (const s of panel.samples) {
      const ts = toTs(s.date);
      if (ts == null || s.weight == null) continue;
      samplePoints.push({
        date: ts,
        sampleWeight: s.weight,
        sampleNotes: s.notes || '',
      });
    }

    // Series 2: daily mean (one row per unique date). Only if ≥2 distinct days.
    const dailyMap = new Map();
    for (const s of panel.samples) {
      const ts = toTs(s.date);
      if (ts == null || s.weight == null) continue;
      if (!dailyMap.has(ts)) dailyMap.set(ts, []);
      dailyMap.get(ts).push(s.weight);
    }
    const dailyPoints = dailyMap.size >= 2
      ? [...dailyMap.entries()]
          .map(([ts, vals]) => ({
            date: ts,
            dailyMean: vals.reduce((a, b) => a + b, 0) / vals.length,
            dailyN: vals.length,
          }))
          .sort((a, b) => a.date - b.date)
      : [];

    // Series 3: harvest events (one row per harvest with a yield).
    const harvestPoints = [];
    for (const h of panel.harvests) {
      const ts = toTs(h.date);
      if (ts == null || h.yield_lb_per_ft == null) continue;
      harvestPoints.push({
        date: ts,
        harvestYield: h.yield_lb_per_ft,
        harvestWeight: h.weight,
        harvestLength: h.line_length,
        harvestNotes: h.notes || '',
      });
    }

    // Union of all dates — only used for the chart's main `data` prop so
    // Recharts can compute the x-axis domain. The series data is separate.
    const allDates = new Set();
    samplePoints.forEach((p) => allDates.add(p.date));
    dailyPoints.forEach((p) => allDates.add(p.date));
    harvestPoints.forEach((p) => allDates.add(p.date));
    const dateUnion = [...allDates].sort((a, b) => a - b).map((date) => ({ date }));

    return {
      dateUnion,
      samplePoints,
      dailyPoints,
      harvestPoints,
      hasSamples: samplePoints.length > 0,
      hasDailyMean: dailyPoints.length > 0,
      hasHarvests: harvestPoints.length > 0,
    };
  }, [panel]);

  const {
    dateUnion, samplePoints, dailyPoints, harvestPoints,
    hasSamples, hasDailyMean, hasHarvests,
  } = computed;

  // Per-point hover state. When a user mouses over a specific dot/square,
  // we store enough info to position the popup and render its content.
  // null = no popup shown.
  const [hoverPoint, setHoverPoint] = useState(null);

  // Subtitle: panel tags joined with " · "
  const tagsLine = panel.tags.join(' · ');

  // Decide if the chart has any data worth rendering
  const hasAnyData = hasSamples || hasDailyMean || hasHarvests;

  // Compute even-spaced x-axis ticks based on the date range.
  // This avoids the "20 overlapping date labels" problem when many points
  // cluster in a small time window.
  const xTicks = useMemo(() => {
    if (dateUnion.length === 0) return [];
    const minTs = dateUnion[0].date;
    const maxTs = dateUnion[dateUnion.length - 1].date;
    return evenTicks(minTs, maxTs, 5);
  }, [dateUnion]);

  // Helper to clear the hover when the mouse leaves the chart area
  const clearHover = () => setHoverPoint(null);

  return (
    <div className="border border-gray-200 rounded p-2">
      {/* Panel title + tags (matches Plotly version) */}
      <div className="px-2 pt-1 pb-2">
        <div className="font-semibold text-sm text-gray-800">
          {panel.species} / line {panel.line}
        </div>
        <div className="text-xs text-gray-500">{tagsLine}</div>
      </div>

      {!hasAnyData ? (
        <div className="text-xs text-gray-400 italic px-2 py-12 text-center">
          No data to plot
        </div>
      ) : (
        // Wrap chart in a relative container so the absolutely-positioned
        // hover popup can be placed inside it.
        <div
          className="relative"
          onMouseLeave={clearHover}
        >
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart
              data={dateUnion}
              margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

              {/* X axis: time scale with capped tick count for readability */}
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                ticks={xTicks}
                tickFormatter={formatAxisTick}
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
                label={{
                  value: 'Date',
                  position: 'bottom',
                  offset: 25,
                  style: { fontSize: 12, fill: '#666' },
                }}
              />

              {/* Y axis */}
              <YAxis
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Weight (lb/ft)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 },
                }}
              />

              {/* No <Tooltip> — we do per-point hover via custom dots instead */}
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11, paddingTop: 0, bottom: 0 }}
                iconType="circle"
              />

              {/* Series 1: individual sample dots, with per-point hover handlers */}
              {hasSamples && (
                <Line
                  data={samplePoints}
                  name="Samples"
                  dataKey="sampleWeight"
                  stroke={COLOR_SAMPLE}
                  strokeWidth={0}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (cx == null || cy == null) return null;
                    return (
                      <circle
                        key={`sample-${index}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={COLOR_SAMPLE}
                        fillOpacity={0.6}
                        stroke="white"
                        strokeWidth={0.6}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoverPoint({
                          x: cx, y: cy,
                          dateStr: format(new Date(payload.date), 'yyyy-MM-dd'),
                          kind: 'sample',
                          weight: payload.sampleWeight,
                          notes: payload.sampleNotes,
                        })}
                      />
                    );
                  }}
                  activeDot={false}
                  legendType="circle"
                  isAnimationActive={false}
                />
              )}

              {/* Series 2: daily-average line, with per-point hover on its dots */}
              {hasDailyMean && (
                <Line
                  data={dailyPoints}
                  name="Daily-average sample"
                  type="monotone"
                  dataKey="dailyMean"
                  stroke={COLOR_DAILY}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (cx == null || cy == null) return null;
                    return (
                      <circle
                        key={`daily-${index}`}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={COLOR_DAILY}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoverPoint({
                          x: cx, y: cy,
                          dateStr: format(new Date(payload.date), 'yyyy-MM-dd'),
                          kind: 'daily',
                          mean: payload.dailyMean,
                          n: payload.dailyN,
                        })}
                      />
                    );
                  }}
                  activeDot={false}
                  legendType="line"
                  isAnimationActive={false}
                />
              )}

              {/* Series 3: harvest squares, with per-point hover */}
              {hasHarvests && (
                <Line
                  data={harvestPoints}
                  name="Harvest (yield)"
                  dataKey="harvestYield"
                  stroke={COLOR_HARVEST}
                  strokeWidth={0}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (cx == null || cy == null) return null;
                    const size = 11;
                    return (
                      <rect
                        key={`harvest-${index}`}
                        x={cx - size / 2}
                        y={cy - size / 2}
                        width={size}
                        height={size}
                        fill={COLOR_HARVEST}
                        stroke="white"
                        strokeWidth={1}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoverPoint({
                          x: cx, y: cy,
                          dateStr: format(new Date(payload.date), 'yyyy-MM-dd'),
                          kind: 'harvest',
                          yieldVal: payload.harvestYield,
                          weight: payload.harvestWeight,
                          length: payload.harvestLength,
                          notes: payload.harvestNotes,
                        })}
                      />
                    );
                  }}
                  activeDot={false}
                  legendType="square"
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* The popup, positioned absolutely over the chart container */}
          <HoverPopup point={hoverPoint} />
        </div>
      )}
    </div>
  );
}
