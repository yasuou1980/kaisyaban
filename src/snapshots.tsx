import React, { useEffect, useState } from 'react';

// --- スナップショット型 ---
export type SnapshotMetrics = {
  pq: number;          // 売上 PQ
  vq: number;          // 変動費 VQ
  mq: number;          // 粗利 MQ
  f: number;           // 固定費 F
  selfCapital: number; // 自己資本
  cash: number;        // 現金
};

export type Snapshot<I> = {
  id: string;
  label: string;
  savedAt: number;
  metrics: SnapshotMetrics;
  inputs: I;
};

const STORAGE_KEY = 'kaisyaban.snapshots.v1';

export const loadSnapshots = <I,>(): Snapshot<I>[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSnapshots = <I,>(list: Snapshot<I>[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 保存不可の環境ではメモリ上のみで動作 */
  }
};

export const useSnapshots = <I,>() => {
  const [list, setList] = useState<Snapshot<I>[]>(() => loadSnapshots<I>());
  useEffect(() => saveSnapshots(list), [list]);

  const add = (label: string, metrics: SnapshotMetrics, inputs: I) =>
    setList(prev => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, label, savedAt: Date.now(), metrics, inputs },
    ]);
  const remove = (id: string) => setList(prev => prev.filter(s => s.id !== id));
  const clear = () => setList([]);
  const replaceAll = (next: Snapshot<I>[]) => setList(next);
  return { list, add, remove, clear, replaceAll };
};

// --- 数値表示 ---
const fmt = (n: number) => (n < 0 ? `▲${Math.abs(n)}` : String(n));

// --- グラフ: PQ積み上げ棒(下=MQ, 上=VQ) + F・自己資本・現金の折れ線 ---
const COLORS = { mq: '#2563eb', vq: '#fbbf24', f: '#dc2626', equity: '#16a34a', cash: '#9333ea' };

export const SnapshotChart = ({ data }: { data: Snapshot<unknown>[] }) => {
  const W = 640, H = 300, padL = 44, padR = 12, padT = 16, padB = 36;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const values = data.flatMap(s => [s.metrics.pq, s.metrics.f, s.metrics.selfCapital, s.metrics.cash, 0]);
  const rawMax = Math.max(...values), rawMin = Math.min(...values);
  const step = Math.max(10, Math.pow(10, Math.floor(Math.log10(Math.max(rawMax - rawMin, 10)))) / 2);
  const yMax = Math.ceil(rawMax / step) * step;
  const yMin = Math.floor(rawMin / step) * step;
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const slot = plotW / Math.max(data.length, 1);
  const cx = (i: number) => padL + slot * i + slot / 2;
  const barW = Math.min(48, slot * 0.5);

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);

  const line = (pick: (m: SnapshotMetrics) => number, color: string) => (
    <g>
      <polyline fill="none" stroke={color} strokeWidth={2}
        points={data.map((s, i) => `${cx(i)},${y(pick(s.metrics))}`).join(' ')} />
      {data.map((s, i) => (
        <circle key={s.id} cx={cx(i)} cy={y(pick(s.metrics))} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />
      ))}
    </g>
  );

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="PQ積み上げ棒と固定費・自己資本・現金の推移">
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#6b7280' : '#e5e7eb'} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#6b7280">{fmt(t)}</text>
          </g>
        ))}
        {data.map((s, i) => {
          const { mq, vq } = s.metrics;
          return (
            <g key={s.id}>
              <rect x={cx(i) - barW / 2} y={y(mq)} width={barW} height={Math.max(0, y(0) - y(mq))} fill={COLORS.mq} opacity={0.85} />
              <rect x={cx(i) - barW / 2} y={y(mq + vq)} width={barW} height={Math.max(0, y(mq) - y(mq + vq))} fill={COLORS.vq} opacity={0.9} />
              <text x={cx(i)} y={y(mq + vq) - 4} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#374151">{fmt(s.metrics.pq)}</text>
              <text x={cx(i)} y={H - padB + 14} textAnchor="middle" fontSize={10} fill="#374151">
                {s.label.length > 8 ? s.label.slice(0, 7) + '…' : s.label}
              </text>
            </g>
          );
        })}
        {line(m => m.f, COLORS.f)}
        {line(m => m.selfCapital, COLORS.equity)}
        {line(m => m.cash, COLORS.cash)}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
        <Legend color={COLORS.vq} label="VQ(変動費)" box />
        <Legend color={COLORS.mq} label="MQ(粗利)" box />
        <Legend color={COLORS.f} label="固定費F" />
        <Legend color={COLORS.equity} label="自己資本" />
        <Legend color={COLORS.cash} label="現金" />
        <span className="text-gray-400">棒の全体の高さ=PQ</span>
      </div>
    </div>
  );
};

const Legend = ({ color, label, box }: { color: string; label: string; box?: boolean }) => (
  <span className="inline-flex items-center gap-1">
    <span style={{ background: color, width: box ? 10 : 14, height: box ? 10 : 3, display: 'inline-block' }} />
    {label}
  </span>
);

// --- 推移表 ---
const SnapshotTable = <I,>({ data, onRestore, onRemove }: {
  data: Snapshot<I>[];
  onRestore: (s: Snapshot<I>) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs text-right border-collapse">
      <thead>
        <tr className="bg-gray-100 text-gray-600">
          <th className="p-1 text-left">記録</th>
          <th className="p-1">PQ</th><th className="p-1">VQ</th><th className="p-1">MQ</th>
          <th className="p-1">F</th><th className="p-1">自己資本</th>
          <th className="p-1">現金</th><th className="p-1">現金増減</th><th className="p-1"></th>
        </tr>
      </thead>
      <tbody>
        {data.map((s, i) => {
          const m = s.metrics;
          const diff = i === 0 ? null : m.cash - data[i - 1].metrics.cash;
          return (
            <tr key={s.id} className="border-t font-mono">
              <td className="p-1 text-left font-sans">{s.label}</td>
              <td className="p-1">{fmt(m.pq)}</td><td className="p-1">{fmt(m.vq)}</td><td className="p-1">{fmt(m.mq)}</td>
              <td className="p-1">{fmt(m.f)}</td><td className="p-1">{fmt(m.selfCapital)}</td>
              <td className="p-1">{fmt(m.cash)}</td>
              <td className={`p-1 font-bold ${diff === null ? 'text-gray-300' : diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {diff === null ? '—' : diff > 0 ? `+${diff}` : fmt(diff)}
              </td>
              <td className="p-1 whitespace-nowrap font-sans">
                <button onClick={() => onRestore(s)} className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 rounded border border-blue-200 mr-1">読込</button>
                <button onClick={() => onRemove(s.id)} className="px-2 py-0.5 text-[11px] bg-red-50 text-red-600 rounded border border-red-200">削除</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// --- パネル本体 ---
export function SnapshotPanel<I>({ snapshots, defaultLabel, onSave, onRestore, onRemove, onClear, onImport }: {
  snapshots: Snapshot<I>[];
  defaultLabel: string;
  onSave: (label: string) => void;
  onRestore: (s: Snapshot<I>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onImport: (list: Snapshot<I>[]) => void;
}) {
  const [label, setLabel] = useState('');

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(snapshots, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kaisyaban-snapshots.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    file.text().then(text => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.every(s => s && s.metrics && s.inputs)) onImport(parsed);
        else alert('スナップショットの形式が正しくありません');
      } catch {
        alert('JSONを読み込めませんでした');
      }
    });
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={defaultLabel}
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => { onSave(label.trim() || defaultLabel); setLabel(''); }}
          className="px-3 py-1 text-sm font-bold bg-green-600 text-white rounded shadow hover:bg-green-700"
        >
          現在値を記録
        </button>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">まだ記録がありません。入力後に「現在値を記録」を押してください。</p>
      ) : (
        <>
          <SnapshotChart data={snapshots} />
          <div className="mt-3"><SnapshotTable data={snapshots} onRestore={onRestore} onRemove={onRemove} /></div>
        </>
      )}

      <div className="flex gap-2 mt-3 text-xs">
        <button onClick={exportJson} disabled={snapshots.length === 0} className="px-2 py-1 border rounded disabled:opacity-40">JSON書き出し</button>
        <label className="px-2 py-1 border rounded cursor-pointer">
          JSON読み込み
          <input type="file" accept="application/json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
        </label>
        <button
          onClick={() => { if (window.confirm('記録をすべて削除しますか？')) onClear(); }}
          disabled={snapshots.length === 0}
          className="px-2 py-1 border border-red-300 text-red-600 rounded disabled:opacity-40 ml-auto"
        >
          全削除
        </button>
      </div>
    </div>
  );
}
