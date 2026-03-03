import React, { useState, useMemo } from 'react';

// --- 1. スタイル定義 (CSS) ---
const customStyles = `
  .token-cube {
    width: 24px; height: 24px; border-radius: 4px;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.3);
    border: 1px solid rgba(0,0,0,0.2);
  }
  .token-mat { background-color: #8b5cf6; }
  .token-wip { background-color: #8b5cf6; }
  .token-prod { background-color: #8b5cf6; }

  .hex-base {
    width: 28px; height: 26px;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    display: flex; items-center; justify-center;
    filter: drop-shadow(1px 2px 1px rgba(0,0,0,0.4));
  }
  .mach-small { background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%); position: relative; }
  .mach-small::after {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 12px; height: 12px; background: #374151;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    box-shadow: inset 1px 1px 2px black;
  }
  .mach-medium { background: radial-gradient(circle at 30% 30%, #e5e7eb 0%, #9ca3af 40%, #4b5563 100%); box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2); }
  .mach-large-wrapper { display: flex; filter: drop-shadow(1px 2px 1px rgba(0,0,0,0.4)); }
  .mach-large-part {
    width: 28px; height: 26px; margin-right: -4px;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%); position: relative;
  }
  .mach-large-part::after {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 12px; height: 12px; background: #374151;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  }

  .token-pc {
    width: 24px; height: 24px; border-radius: 50%;
    background-color: #10b981; border: 2px solid #fff; box-shadow: 0 0 5px #10b981;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;
  }
  .token-pc:hover { transform: scale(1.1); }
  .token-pc-off { background-color: #e5e7eb; border-color: #9ca3af; color: #9ca3af; box-shadow: none; }

  .token-worker-body {
    width: 20px; height: 20px; border-radius: 50%; background: #f3f4f6; border: 1px solid #9ca3af;
    position: relative; box-shadow: 1px 2px 2px rgba(0,0,0,0.2); z-index: 10;
  }
  .token-worker-visor {
    position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
    width: 24px; height: 10px; background: #e5e7eb;
    border-radius: 12px 12px 0 0; border: 1px solid #9ca3af; border-bottom: none; z-index: 1;
  }

  .token-rd { width: 20px; height: 20px; border-radius: 50%; background-color: #3b82f6; border: 1px solid white; box-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
  .token-ads { width: 20px; height: 20px; border-radius: 50%; background-color: #ef4444; border: 1px solid white; box-shadow: 1px 1px 2px rgba(0,0,0,0.3); }

  .area-label {
    position: absolute; top: -10px; left: 10px; background: white; border: 2px solid #3b82f6;
    padding: 0 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; color: #1e40af; z-index: 20;
  }

  .white-tray {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
    background-color: #f9fafb; border: 2px solid #d1d5db; border-radius: 6px; padding: 6px;
    position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-top: 12px;
  }
  .tray-handle-top {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    width: 90%; height: 12px;
    background: linear-gradient(to top, #d1d5db 0%, #ffffff 100%);
    border: 2px solid #d1d5db; border-bottom: none; border-radius: 6px 6px 0 0;
  }
  .tray-slot {
    width: 26px; height: 26px; border-radius: 4px; background-color: rgba(0,0,0,0.03);
    border: 1px dashed #e5e7eb; display: flex; align-items: center; justify-content: center;
  }

  /* 投資チップ */
  .invest-chip {
    width: 18px; height: 18px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.7);
    box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    cursor: pointer; transition: transform 0.1s;
    display: inline-block;
  }
  .invest-chip:hover { transform: scale(1.15); }
  .chip-red { background-color: #ef4444; }
  .chip-blue { background-color: #3b82f6; }
  .chip-yellow { background-color: #eab308; }

  /* スライダー */
  input[type=range] { accent-color: #3b82f6; }
`;

// --- 2. 定数 ---
const DEPRECIATION = {
  junior: { small: 10, medium: 13, large: 20 },
  senior: { small: 20, medium: 26, large: 40 },
};

const MACHINE_COSTS: Record<number, number> = {
  1: 20, 2: 22, 3: 24, 4: 26, 5: 28,
};

const PRICES = {
  2: { comp: 20, insurance: 5, edu: 20, rd: 20, ads: 20, worker: 33, sales: 33, warehouse: 20 },
  3: { comp: 20, insurance: 5, edu: 20, rd: 20, ads: 20, worker: 36, sales: 36, warehouse: 20 },
  4: { comp: 20, insurance: 5, edu: 20, rd: 20, ads: 20, worker: 39, sales: 39, warehouse: 20 },
  5: { comp: 20, insurance: 5, edu: 20, rd: 20, ads: 20, worker: 42, sales: 42, warehouse: 20 },
};

// 在庫評価単価
const INVENTORY_PRICES: Record<string, { mat: number; wip: number; prod: number }> = {
  2:     { mat: 12, wip: 13, prod: 14 },
  other: { mat: 13, wip: 14, prod: 15 },
};

const INITIAL_STATE = {
  materials: 0, wip: 0, products: 0,
  smallMachine: 0, mediumMachine: 0, largeMachine: 0,
  computerOn: false,
  workers: 0, salesmen: 0,
  insurance: 0, education: 0, rd: 0, ads: 0,
  safetyWarehouse: false, safetySales: false,
};

type ChipCounts = { red: number; blue: number; yellow: number };
type InvestArea = 'warehouse' | 'factory' | 'sales';
type ChipColor = 'red' | 'blue' | 'yellow';

// --- 3. UIコンポーネント ---
const WorkerToken = () => (
  <div className="relative flex items-center justify-center w-[24px] h-[24px]">
    <div className="token-worker-visor"></div>
    <div className="token-worker-body"></div>
  </div>
);

const MiniControl = ({ label, count, onInc, onDec }: any) => (
  <div className="flex flex-col items-center bg-white/60 rounded p-1 shadow-sm border border-gray-200 w-[60px]">
    <span className="text-[10px] font-bold text-gray-600 leading-tight">{label}</span>
    <div className="flex items-center justify-between w-full mt-1">
      <button onClick={onDec} className="w-4 h-4 flex items-center justify-center bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200">-</button>
      <span className="text-xs font-bold">{count}</span>
      <button onClick={onInc} className="w-4 h-4 flex items-center justify-center bg-green-100 text-green-600 rounded text-xs font-bold hover:bg-green-200">+</button>
    </div>
  </div>
);

const SafetyTray = ({ count, typeClass }: { count: number; typeClass: string }) => {
  const CAPACITY = 12;
  const insideTray = Math.min(count, CAPACITY);
  const overflow = Math.max(0, count - CAPACITY);
  return (
    <div className="flex flex-col items-center">
      <div className="white-tray">
        <div className="tray-handle-top"></div>
        {[...Array(CAPACITY)].map((_, i) => (
          <div key={i} className="tray-slot">
            {i < insideTray && <div className={`token-cube ${typeClass}`} />}
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 justify-center max-w-[100px] bg-gray-200/40 p-1 rounded">
          {[...Array(overflow)].map((_, i) => <div key={i} className={`token-cube ${typeClass}`} />)}
        </div>
      )}
    </div>
  );
};

// 投資盤の各エリア
const InvestSection = ({
  title, metric, chips, onUpdate,
}: {
  title: string;
  metric: string;
  chips: ChipCounts;
  onUpdate: (color: ChipColor, delta: number) => void;
}) => {
  const chipDefs: { color: ChipColor; label: string; cls: string }[] = [
    { color: 'red',    label: '赤', cls: 'chip-red'    },
    { color: 'blue',   label: '青', cls: 'chip-blue'   },
    { color: 'yellow', label: '黄', cls: 'chip-yellow' },
  ];
  return (
    <div className="bg-white/80 rounded-xl border-2 border-green-300 p-2 flex flex-col gap-2 shadow">
      <div className="text-center border-b border-green-200 pb-1">
        <div className="text-xs font-bold text-gray-700">{title}</div>
        <div className="text-blue-600 font-bold text-base">{metric}</div>
      </div>
      {chipDefs.map(({ color, label, cls }) => (
        <div key={color} className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-gray-600 w-4 shrink-0">{label}</span>
          <div className="flex flex-wrap gap-0.5 flex-1 min-h-[20px] items-center">
            {[...Array(chips[color])].map((_, i) => (
              <span key={i} className={`invest-chip ${cls}`} onClick={() => onUpdate(color, -1)} />
            ))}
          </div>
          <button onClick={() => onUpdate(color, -1)} className="w-4 h-4 flex items-center justify-center bg-red-100 text-red-600 rounded text-[10px] font-bold hover:bg-red-200 shrink-0">-</button>
          <span className="w-4 text-center text-[10px] font-mono font-bold shrink-0">{chips[color]}</span>
          <button onClick={() => onUpdate(color, 1)} className="w-4 h-4 flex items-center justify-center bg-green-100 text-green-600 rounded text-[10px] font-bold hover:bg-green-200 shrink-0">+</button>
        </div>
      ))}
    </div>
  );
};

// スライダー行
const SliderRow = ({
  label, value, onChange, min, max, note,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; note?: string;
}) => (
  <div className="flex items-center gap-2">
    <label className="text-xs font-bold text-gray-700 w-20 shrink-0">{label}</label>
    <input
      type="range" min={min} max={max} value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      className="flex-1 h-2 cursor-pointer"
    />
    <span className="font-mono font-bold text-sm w-10 text-right shrink-0">{value}</span>
    {note && <span className="text-xs text-orange-600 font-bold w-20 shrink-0">{note}</span>}
  </div>
);

// --- 4. メインアプリ ---
export default function App() {
  const [period, setPeriod] = useState(2);
  const [dice, setDice] = useState(3);
  const [ruleMode, setRuleMode] = useState<'junior' | 'senior'>('junior');
  const [state, setState] = useState(INITIAL_STATE);

  // シニア: 投資チップ
  const [investChips, setInvestChips] = useState<Record<InvestArea, ChipCounts>>({
    warehouse: { red: 0, blue: 0, yellow: 0 },
    factory:   { red: 0, blue: 0, yellow: 0 },
    sales:     { red: 0, blue: 0, yellow: 0 },
  });

  // 財務入力
  const [cash, setCash] = useState(0);
  const [longTermLoan, setLongTermLoan] = useState(0);
  const [shortTermLoan, setShortTermLoan] = useState(0);
  const [specialLoss, setSpecialLoss] = useState(0);

  const update = (key: keyof typeof INITIAL_STATE, delta: number) => {
    setState((prev) => {
      // @ts-ignore
      const newVal = Math.max(0, (typeof prev[key] === 'number' ? prev[key] : 0) + delta);
      if (key === 'education' && newVal > 2) return prev;
      return { ...prev, [key]: newVal };
    });
  };

  const toggleSafety = (key: 'safetyWarehouse' | 'safetySales') => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleComputer = () => {
    setState(prev => ({ ...prev, computerOn: !prev.computerOn }));
  };

  const updateInvestChip = (area: InvestArea, color: ChipColor, delta: number) => {
    setInvestChips(prev => ({
      ...prev,
      [area]: { ...prev[area], [color]: Math.max(0, prev[area][color] + delta) },
    }));
  };

  const results = useMemo(() => {
    // @ts-ignore
    const p = PRICES[period];
    let costs = { machines: 0, fixed: 0, labor: 0, strat: 0, total: 0 };
    const compCount = state.computerOn ? 1 : 0;

    // 設備費
    const totalMachineCount = state.smallMachine + state.mediumMachine + state.largeMachine;
    let machineUnitRate = MACHINE_COSTS[period] ?? 0;
    if (ruleMode === 'senior') {
      const multiplier = dice <= 3 ? 1.1 : 1.2;
      machineUnitRate = Math.round(machineUnitRate * multiplier);
    }
    costs.machines = (totalMachineCount * machineUnitRate) + (compCount * p.comp);

    // 人件費
    let workerRate = p.worker;
    let salesRate = p.sales;
    if (ruleMode === 'senior' && period >= 3) {
      const multiplier = dice <= 3 ? 1.1 : 1.2;
      workerRate = Math.round(p.worker * multiplier);
      salesRate = Math.round(p.sales * multiplier);
    }
    costs.labor = (state.workers * workerRate) + (state.salesmen * salesRate);

    // 戦略費
    const calcSpecial = (count: number, price: number) => (period === 2 && count > 0) ? price : count * price;
    costs.strat = calcSpecial(state.education, p.edu) + calcSpecial(state.rd, p.rd) + calcSpecial(state.ads, p.ads);

    // 固定費 (減価償却 + 保険 + 倉庫 + 利息 + 特別損失)
    const safetyCount = (state.safetyWarehouse ? 1 : 0) + (state.safetySales ? 1 : 0);
    const dep = DEPRECIATION[ruleMode];
    const depCost = (state.smallMachine * dep.small) + (state.mediumMachine * dep.medium) + (state.largeMachine * dep.large);
    const ltlInterest = Math.round(longTermLoan * 0.1);
    const stlInterest = Math.round(shortTermLoan * 0.2);
    costs.fixed = (state.insurance * p.insurance) + (safetyCount * p.warehouse) + depCost + ltlInterest + stlInterest + specialLoss;

    costs.total = costs.machines + costs.labor + costs.strat + costs.fixed;

    // 生産・販売能力
    const machCap = (state.smallMachine * 1) + (state.mediumMachine * 2) + (state.largeMachine * 4);
    const compEffect = state.computerOn ? totalMachineCount : 0;
    const prodCap = machCap + compEffect + (state.education > 0 ? 1 : 0);
    const salesCap = (state.salesmen * 2) + (state.ads * 2) + (state.education > 0 ? 1 : 0);
    const priceComp = state.rd * 2;

    // 在庫評価額
    const invP = period === 2 ? INVENTORY_PRICES[2] : INVENTORY_PRICES.other;
    const inventoryValue =
      (state.materials * invP.mat) + (state.wip * invP.wip) + (state.products * invP.prod);

    return { costs, prodCap, salesCap, priceComp, inventoryValue, invP, ltlInterest, stlInterest };
  }, [state, period, dice, ruleMode, longTermLoan, shortTermLoan, specialLoss]);

  return (
    <div className="min-h-screen bg-gray-100 p-2 font-sans text-gray-800 pb-48">
      <style>{customStyles}</style>

      {/* --- コントロールパネル --- */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-3 mb-4 flex flex-wrap gap-4 items-center justify-between border-t-4 border-blue-600">
        <div>
          <h1 className="text-lg font-bold text-gray-800">会社盤 シミュレーター</h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-gray-100 rounded p-1">
            <button onClick={() => setRuleMode('junior')} className={`px-3 py-1 text-xs rounded ${ruleMode === 'junior' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-500'}`}>ジュニア</button>
            <button onClick={() => setRuleMode('senior')} className={`px-3 py-1 text-xs rounded ${ruleMode === 'senior' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-500'}`}>シニア</button>
          </div>
          <div className="flex rounded shadow-sm border overflow-hidden">
            {[2, 3, 4, 5].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-xs ${period === p ? 'bg-blue-600 text-white font-bold' : 'bg-white hover:bg-gray-50'}`}>{p}期</button>
            ))}
          </div>
          <div className="flex flex-col w-24">
            <input type="range" min="1" max="6" value={dice} onChange={e => setDice(parseInt(e.target.value))} className="w-full h-1 bg-gray-300 rounded cursor-pointer" />
            <div className="flex justify-between text-[10px] font-mono font-bold mt-1">
              <span>サイコロ:</span><span className="text-blue-600 text-sm">{dice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- シニア: 投資盤 --- */}
      {ruleMode === 'senior' && (
        <div className="max-w-4xl mx-auto mb-4 bg-green-50 rounded-xl border-2 border-green-400 p-3 shadow-lg relative">
          <div className="text-center text-xs font-bold text-green-800 bg-green-100 border border-green-300 rounded-lg py-1 mb-3">
            投資盤（次期への投資） ― 固定費不算入
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InvestSection
              title="倉庫"
              metric={`仕入可能 ${results.prodCap}個`}
              chips={investChips.warehouse}
              onUpdate={(c, d) => updateInvestChip('warehouse', c, d)}
            />
            <InvestSection
              title="工場"
              metric={`製造能力 ${results.prodCap}個`}
              chips={investChips.factory}
              onUpdate={(c, d) => updateInvestChip('factory', c, d)}
            />
            <InvestSection
              title="営業所"
              metric={`販売 ${results.salesCap}個`}
              chips={investChips.sales}
              onUpdate={(c, d) => updateInvestChip('sales', c, d)}
            />
          </div>
        </div>
      )}

      {/* --- メインボード --- */}
      <div className="max-w-4xl mx-auto relative bg-[#FFD700] rounded-xl p-4 shadow-xl border-4 border-yellow-400 select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* 左: 材料倉庫 */}
          <div className="bg-gray-300 rounded-lg p-2 border-2 border-gray-400 min-h-[400px] relative shadow-inner flex flex-col">
            <div className="area-label">材料倉庫</div>
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-300 cursor-pointer z-20" onClick={() => toggleSafety('safetyWarehouse')}>
              <span>無災害(倉)</span>
              <div className={`w-4 h-4 border ${state.safetyWarehouse ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-400'}`}></div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {state.safetyWarehouse ? (
                <SafetyTray count={state.materials} typeClass="token-mat" />
              ) : (
                <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                  {[...Array(state.materials)].map((_, i) => <div key={i} className="token-cube token-mat" />)}
                  {state.materials === 0 && <span className="text-gray-400 text-xs">No Materials</span>}
                </div>
              )}
            </div>
            <div className="mt-auto flex flex-col items-center gap-1 pb-2">
              <MiniControl label="材料" count={state.materials} onInc={() => update('materials', 1)} onDec={() => update('materials', -1)} />
              <div className="text-[10px] text-gray-500">
                @{results.invP.mat} = <span className="font-bold text-gray-700">{state.materials * results.invP.mat}</span>
              </div>
            </div>
          </div>

          {/* 中: 工場 */}
          <div className="bg-gray-300 rounded-lg p-2 border-2 border-gray-400 min-h-[400px] relative shadow-inner flex flex-col">
            <div className="area-label">工場</div>
            <div className="absolute top-2 right-2 flex flex-col items-center z-20" onClick={toggleComputer}>
              <div className={`token-pc ${state.computerOn ? '' : 'token-pc-off'}`}>PC</div>
              <span className="text-[9px] font-bold text-gray-600 mt-1">{state.computerOn ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex flex-col items-center gap-2 pt-10 pb-2 border-b border-gray-400/30">
              <div className="flex flex-wrap justify-center gap-2 min-h-[30px] items-end">
                {[...Array(state.smallMachine)].map((_, i) => <div key={`s${i}`} className="hex-base mach-small" />)}
                {[...Array(state.mediumMachine)].map((_, i) => <div key={`m${i}`} className="hex-base mach-medium" />)}
                {[...Array(state.largeMachine)].map((_, i) => (
                  <div key={`l${i}`} className="mach-large-wrapper">
                    <div className="mach-large-part"></div><div className="mach-large-part"></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <MiniControl label="小型" count={state.smallMachine} onInc={() => update('smallMachine', 1)} onDec={() => update('smallMachine', -1)} />
                <MiniControl label="中型" count={state.mediumMachine} onInc={() => update('mediumMachine', 1)} onDec={() => update('mediumMachine', -1)} />
                <MiniControl label="大型" count={state.largeMachine} onInc={() => update('largeMachine', 1)} onDec={() => update('largeMachine', -1)} />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="flex flex-wrap gap-1 justify-center max-w-[100px] mb-1">
                {[...Array(state.wip)].map((_, i) => <div key={i} className="token-cube token-wip" />)}
              </div>
              <MiniControl label="仕掛品" count={state.wip} onInc={() => update('wip', 1)} onDec={() => update('wip', -1)} />
              <div className="text-[10px] text-gray-500 mt-1">
                @{results.invP.wip} = <span className="font-bold text-gray-700">{state.wip * results.invP.wip}</span>
              </div>
            </div>
            <div className="mt-auto bg-gray-200/50 rounded p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap max-w-[80px]">
                  {[...Array(state.workers)].map((_, i) => <WorkerToken key={i} />)}
                </div>
                <MiniControl label="ワーカー" count={state.workers} onInc={() => update('workers', 1)} onDec={() => update('workers', -1)} />
              </div>
              <hr className="border-gray-400" />
              <div className="flex justify-around items-end">
                <div className="flex flex-col items-center cursor-pointer" onClick={() => update('insurance', state.insurance ? -1 : 1)}>
                  <span className="text-[10px] font-bold mb-1">保険</span>
                  <div className={`w-6 h-6 rounded-full border-2 ${state.insurance ? 'bg-orange-500 border-white' : 'bg-gray-400 border-gray-500'}`}></div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold mb-1">教育(Max2)</span>
                  <div className="flex gap-1">
                    <div onClick={() => update('education', state.education >= 1 ? -1 : 1)} className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center font-bold text-xs ${state.education >= 1 ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-gray-200 border-gray-400 text-gray-400'}`}>1</div>
                    <div onClick={() => update('education', state.education >= 2 ? -1 : 1)} className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center font-bold text-xs ${state.education >= 2 ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-gray-200 border-gray-400 text-gray-400'}`}>2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右: 営業所 */}
          <div className="bg-gray-300 rounded-lg p-2 border-2 border-gray-400 min-h-[400px] relative shadow-inner flex flex-col">
            <div className="area-label">営業所</div>
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-300 cursor-pointer z-20" onClick={() => toggleSafety('safetySales')}>
              <span>無災害(営)</span>
              <div className={`w-4 h-4 border ${state.safetySales ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-400'}`}></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              {state.safetySales ? (
                <SafetyTray count={state.products} typeClass="token-prod" />
              ) : (
                <div className="flex flex-wrap gap-1 justify-center max-w-[120px] mb-2">
                  {[...Array(state.products)].map((_, i) => <div key={i} className="token-cube token-prod" />)}
                </div>
              )}
              <MiniControl label="商品" count={state.products} onInc={() => update('products', 1)} onDec={() => update('products', -1)} />
              <div className="text-[10px] text-gray-500 mt-1">
                @{results.invP.prod} = <span className="font-bold text-gray-700">{state.products * results.invP.prod}</span>
              </div>
            </div>
            <div className="mt-auto h-[120px] bg-gray-200/50 rounded p-2 grid grid-cols-2 gap-2 border-t border-gray-300">
              <div className="flex flex-col items-center border-r border-gray-300 pr-1">
                <span className="text-[10px] font-bold mb-1">セールス</span>
                <div className="flex flex-wrap gap-1 justify-center max-w-[60px] mb-1">
                  {[...Array(state.salesmen)].map((_, i) => <WorkerToken key={i} />)}
                </div>
                <div className="mt-auto">
                  <MiniControl label="" count={state.salesmen} onInc={() => update('salesmen', 1)} onDec={() => update('salesmen', -1)} />
                </div>
              </div>
              <div className="flex flex-col items-center pl-1">
                <span className="text-[10px] font-bold mb-1">広告</span>
                <div className="flex flex-wrap gap-1 justify-center max-w-[60px] mb-1">
                  {[...Array(state.ads)].map((_, i) => <div key={i} className="token-ads" />)}
                </div>
                <div className="mt-auto">
                  <MiniControl label="" count={state.ads} onInc={() => update('ads', 1)} onDec={() => update('ads', -1)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 研究開発 */}
        <div className="mt-4 bg-gray-300 rounded-lg p-3 border-2 border-gray-400 w-1/3 relative shadow-inner">
          <div className="absolute -top-3 left-2 bg-white border border-blue-500 px-2 text-xs font-bold text-blue-800 rounded">研究開発</div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1 flex-wrap">
              {[...Array(state.rd)].map((_, i) => <div key={i} className="token-rd" />)}
            </div>
            <MiniControl label="R&D" count={state.rd} onInc={() => update('rd', 1)} onDec={() => update('rd', -1)} />
          </div>
        </div>
      </div>

      {/* --- 在庫評価額 --- */}
      <div className="max-w-4xl mx-auto mt-4 bg-white rounded-lg border border-indigo-200 p-3 shadow">
        <h3 className="text-xs font-bold text-indigo-700 mb-2">
          在庫評価額（{period}期: 材料@{results.invP.mat} / 仕掛品@{results.invP.wip} / 製品@{results.invP.prod}）
        </h3>
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <span className="text-gray-600">
            材料 <span className="font-bold text-gray-800">{state.materials}</span>個
            × {results.invP.mat} = <span className="font-bold text-indigo-700">{state.materials * results.invP.mat}</span>
          </span>
          <span className="text-gray-400">+</span>
          <span className="text-gray-600">
            仕掛品 <span className="font-bold text-gray-800">{state.wip}</span>個
            × {results.invP.wip} = <span className="font-bold text-indigo-700">{state.wip * results.invP.wip}</span>
          </span>
          <span className="text-gray-400">+</span>
          <span className="text-gray-600">
            製品 <span className="font-bold text-gray-800">{state.products}</span>個
            × {results.invP.prod} = <span className="font-bold text-indigo-700">{state.products * results.invP.prod}</span>
          </span>
          <span className="text-gray-400">=</span>
          <span className="text-lg font-bold text-indigo-800 bg-indigo-50 px-3 py-0.5 rounded border border-indigo-200">
            合計 {results.inventoryValue}
          </span>
        </div>
      </div>

      {/* --- 財務入力 --- */}
      <div className="max-w-4xl mx-auto mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        <h3 className="text-xs font-bold text-gray-700 mb-3">財務入力</h3>
        <div className="flex flex-col gap-3">
          <SliderRow
            label="現金"
            value={cash} onChange={setCash}
            min={0} max={700}
          />
          <SliderRow
            label="長期借入"
            value={longTermLoan} onChange={setLongTermLoan}
            min={0} max={700}
            note={`利息 → ${results.ltlInterest}`}
          />
          <SliderRow
            label="短期借入"
            value={shortTermLoan} onChange={setShortTermLoan}
            min={0} max={700}
            note={`利息 → ${results.stlInterest}`}
          />
          <SliderRow
            label="特別損失"
            value={specialLoss} onChange={setSpecialLoss}
            min={0} max={60}
            note="→ 固定費算入"
          />
        </div>
      </div>

      {/* --- フッター --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 shadow-2xl border-t-4 border-green-500 z-50">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-green-300">費用集計 ({period}期)</h2>
            <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>設備: {results.costs.machines}</span>
              <span>人件: {results.costs.labor}</span>
              <span>戦略: {results.costs.strat}</span>
              <span>固定他: {results.costs.fixed}</span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="bg-gray-800 px-2 py-1 rounded text-xs">
              製造: <span className="font-bold text-blue-400 text-sm">{results.prodCap}</span>
            </div>
            <div className="bg-gray-800 px-2 py-1 rounded text-xs">
              販売: <span className="font-bold text-green-400 text-sm">{results.salesCap}</span>
            </div>
            <div className="bg-gray-800 px-2 py-1 rounded text-xs">
              価格: <span className="font-bold text-red-400 text-sm">{results.priceComp}</span>
            </div>
            <div className="bg-indigo-900 px-2 py-1 rounded text-xs border border-indigo-600">
              在庫評価: <span className="font-bold text-indigo-300 text-sm">{results.inventoryValue}</span>
            </div>
            <div className="bg-green-800 px-3 py-1 rounded border border-green-600 ml-1">
              <span className="text-[10px] text-green-300 block leading-none">固定費計(F)</span>
              <span className="text-xl font-mono font-bold">{results.costs.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
