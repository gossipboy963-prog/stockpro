import { SOPStep } from './types';

export const INITIAL_SOP_STEPS: Omit<SOPStep, 'status' | 'note'>[] = [
  { id: 1, label: "價量行為", description: "型態完整？量價配合？不通過直接淘汰。" },
  { id: 2, label: "OBV 能量潮", description: "趨勢確認。是否隨價格創新高？" },
  { id: 3, label: "A/D Line", description: "主資金誠意。是否有主力吸籌跡象？" },
  { id: 4, label: "CMF", description: "資金流向。只看是否翻負，作為煞車。" },
  { id: 5, label: "RSI", description: "40-50 區間是否有撐？背離確認。禁止超買超賣決策。" },
  { id: 6, label: "MA 均線", description: "結構排列正確？是否有均線支撐？" },
  { id: 7, label: "ATR", description: "波動率正常？是否有足夠空間設置停損？" },
];

export const COACH_QUOTES = {
  tradable: [
    "耐心是獵人的美德。祝好運。",
    "計劃你的交易，交易你的計劃。",
    "保持平靜，執行系統。"
  ],
  watch: [
    "等待也是一種交易。",
    "讓子彈再飛一會兒。",
    "不急，市場永遠都在。"
  ],
  banned: [
    "本金安全第一，做得好。",
    "休息是為了走更長遠的路。",
    "避開風險就是最大的獲利。"
  ]
};
