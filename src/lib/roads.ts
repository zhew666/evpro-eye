/**
 * 百家樂五路演算法（傳統規則）
 *
 * 輸入：每手結果（winner + super6/pair 標記）
 * 輸出：五路的格子座標資料，給前端 grid 渲染
 *
 * 規則對齊真實賭場（MT/DG 等）顯示，方便肉眼比對驗證。
 */

export type Side = "B" | "P" | "T";

export interface HandResult {
  winner: Side;
  is_super6?: boolean;
  is_pair_p?: boolean;
  is_pair_b?: boolean;
  hand_num?: number;
  /** 贏家點數（莊贏時=banker_score、閒贏時=player_score、和時可用任一） */
  score?: number;
}

export interface BeadPlateCell {
  row: number;
  col: number;
  side: Side;
  hand_num: number;
  score: number;
  is_super6: boolean;
  is_pair_p: boolean;
  is_pair_b: boolean;
}

export interface BigRoadCell {
  row: number;
  col: number;
  side: "B" | "P";
  ties: number;
  score: number;
  is_super6: boolean;
  is_pair_p: boolean;
  is_pair_b: boolean;
  hand_num: number;
}

export interface DerivedRoadCell {
  row: number;
  col: number;
  color: "R" | "B";
}

export interface Roads {
  beadPlate: BeadPlateCell[];
  bigRoad: BigRoadCell[];
  bigEye: DerivedRoadCell[];
  smallRoad: DerivedRoadCell[];
  cockroach: DerivedRoadCell[];
  totalHands: number;
  bankerWins: number;
  playerWins: number;
  tieWins: number;
}

const MAX_ROWS = 6;
const key = (col: number, row: number) => `${col},${row}`;

/**
 * 珠盤路：從左到右，每欄由上往下填 6 格
 * 和局也記在此路
 */
function buildBeadPlate(hands: HandResult[]): BeadPlateCell[] {
  return hands.map((h, i) => ({
    row: i % MAX_ROWS,
    col: Math.floor(i / MAX_ROWS),
    side: h.winner,
    hand_num: h.hand_num ?? i + 1,
    score: h.score ?? 0,
    is_super6: !!h.is_super6,
    is_pair_p: !!h.is_pair_p,
    is_pair_b: !!h.is_pair_b,
  }));
}

/**
 * 大路：只記莊/閒；和局當作標記疊加在「上一格莊/閒」上
 *   - 同勝方向下延伸
 *   - 勝方改變 → 新欄
 *   - 撞底（row=5 已滿）同勝方繼續 → 向右彎（長龍）
 *   - 彎右時碰撞已占格子 → 繼續向右找空位
 */
function buildBigRoad(hands: HandResult[]): BigRoadCell[] {
  const cells: BigRoadCell[] = [];
  const occupied = new Map<string, BigRoadCell>();
  let last: BigRoadCell | null = null;

  for (const h of hands) {
    if (h.winner === "T") {
      if (last) last.ties++;
      continue;
    }

    const side = h.winner as "B" | "P";
    let col: number;
    let row: number;

    if (!last || last.side !== side) {
      // 新欄
      col = last ? last.col + 1 : 0;
      while (occupied.has(key(col, 0))) col++;
      row = 0;
    } else {
      // 同勝方延續
      col = last.col;
      row = last.row;
      if (row < MAX_ROWS - 1 && !occupied.has(key(col, row + 1))) {
        row++;
      } else {
        // 撞底彎右
        col++;
        while (occupied.has(key(col, row))) col++;
      }
    }

    const cell: BigRoadCell = {
      row,
      col,
      side,
      ties: 0,
      score: h.score ?? 0,
      is_super6: !!h.is_super6,
      is_pair_p: !!h.is_pair_p,
      is_pair_b: !!h.is_pair_b,
      hand_num: h.hand_num ?? cells.length + 1,
    };
    occupied.set(key(col, row), cell);
    cells.push(cell);
    last = cell;
  }

  return cells;
}

/**
 * 查指定欄在大路從 row=0 起連續有幾格
 * （長龍彎右後的格子不算在原欄長度裡）
 */
function columnLengthFromTop(
  grid: Map<string, BigRoadCell>,
  col: number,
): number {
  if (col < 0) return 0;
  let len = 0;
  for (let r = 0; r < MAX_ROWS; r++) {
    if (grid.has(key(col, r))) len++;
    else break;
  }
  return len;
}

/**
 * 從大路衍生三路（大眼仔 / 小路 / 蟑螂）
 *
 * @param bigRoad 大路格子（按產生順序）
 * @param lookback  1 = 大眼仔（比前一列 vs 前二列）
 *                  2 = 小路  （比前一列 vs 前三列）
 *                  3 = 蟑螂  （比前一列 vs 前四列）
 *
 * 三原則（依網路權威資料，字面實作，不做合併）：
 *
 *   A. 齊整（當前格位於新欄首位，row === 0）：
 *      比「前一列長度」與「再前 lookback 列的長度」
 *        長度相等 → 紅（齊）
 *        長度不等 → 藍（不齊）
 *
 *   B. 有無（當前格位於續欄，row > 0，且在前一列長度範圍內）：
 *      看「大路 (col - lookback, row) 那格」有沒有牌
 *        有 → 紅
 *        無 → 藍
 *      （實務上當 row < 該前列長度時必有；row === 前列長度時必無）
 *
 *   C. 直落（當前格位於續欄，row > 0，且超出前一列長度 2 格以上）：
 *      此時 (col - lookback, row) 與 (col - lookback, row-1) 都空，
 *      代表長龍已延伸超過前一列終點 → 紅（延續原本規律）
 *
 *   起點：大路第 (lookback+1) 欄第 1 格  或  第 lookback 欄第 2 格
 *         以先出現者為準（0-indexed：col >= lookback+1 且 row=0
 *         或 col >= lookback 且 row >= 1）
 *
 *   衍生路本身放置：
 *     - 第一格放 (0, 0)
 *     - 同色 → 同欄往下延伸一格（若未撞底）
 *     - 同色但已撞底（row === MAX_ROWS-1）→ 往右彎到下一欄同 row
 *     - 換色 → 新欄，row=0
 */
function buildDerivedRoad(
  bigRoad: BigRoadCell[],
  lookback: number,
): DerivedRoadCell[] {
  const grid = new Map<string, BigRoadCell>();
  for (const c of bigRoad) grid.set(key(c.col, c.row), c);

  // 找起點
  const startIndex = bigRoad.findIndex(
    (c) =>
      (c.col >= lookback + 1 && c.row === 0) ||
      (c.col >= lookback && c.row >= 1),
  );
  if (startIndex === -1) return [];

  const derived: DerivedRoadCell[] = [];
  const occupied = new Set<string>();
  let dCol = 0;
  let dRow = 0;
  let lastColor: "R" | "B" | null = null;

  for (let i = startIndex; i < bigRoad.length; i++) {
    const c = bigRoad[i];
    let color: "R" | "B";

    if (c.row === 0) {
      // 規則 A：齊整
      const prevLen = columnLengthFromTop(grid, c.col - 1);
      const prevPrevLen = columnLengthFromTop(grid, c.col - 1 - lookback);
      color = prevLen === prevPrevLen ? "R" : "B";
    } else {
      // 續欄：比較當前 row 與前 lookback 列的長度
      const lookbackLen = columnLengthFromTop(grid, c.col - lookback);

      if (c.row < lookbackLen) {
        // 規則 B（正向）：前列該行有牌 → 紅
        color = "R";
      } else if (c.row === lookbackLen) {
        // 規則 B（邊界）：剛好越出前列一格 → 藍
        color = "B";
      } else {
        // 規則 C：長龍延伸超過前列兩格以上 → 紅
        color = "R";
      }
    }

    // 放置：第一格、換色新欄、同色延伸
    if (lastColor === null) {
      dCol = 0;
      dRow = 0;
    } else if (color !== lastColor) {
      dCol++;
      while (occupied.has(key(dCol, 0))) dCol++;
      dRow = 0;
    } else {
      if (dRow < MAX_ROWS - 1 && !occupied.has(key(dCol, dRow + 1))) {
        dRow++;
      } else {
        dCol++;
        while (occupied.has(key(dCol, dRow))) dCol++;
      }
    }

    occupied.add(key(dCol, dRow));
    derived.push({ row: dRow, col: dCol, color });
    lastColor = color;
  }

  return derived;
}

/**
 * 主入口：輸入每手結果，輸出五路
 */
export function buildRoads(hands: HandResult[]): Roads {
  const beadPlate = buildBeadPlate(hands);
  const bigRoad = buildBigRoad(hands);
  const bigEye = buildDerivedRoad(bigRoad, 1);
  const smallRoad = buildDerivedRoad(bigRoad, 2);
  const cockroach = buildDerivedRoad(bigRoad, 3);

  return {
    beadPlate,
    bigRoad,
    bigEye,
    smallRoad,
    cockroach,
    totalHands: hands.length,
    bankerWins: hands.filter((h) => h.winner === "B").length,
    playerWins: hands.filter((h) => h.winner === "P").length,
    tieWins: hands.filter((h) => h.winner === "T").length,
  };
}

/**
 * ASCII 除錯輸出（給開發者檢驗用，不影響渲染）
 * 用法：console.log(renderRoadsAscii(roads))
 */
export function renderRoadsAscii(roads: Roads): string {
  const out: string[] = [];
  const renderGrid = <T extends { row: number; col: number }>(
    cells: T[],
    char: (c: T) => string,
  ): string => {
    if (cells.length === 0) return "(empty)\n";
    const maxCol = Math.max(...cells.map((c) => c.col));
    const grid: string[][] = [];
    for (let r = 0; r < MAX_ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c <= maxCol; c++) grid[r][c] = ".";
    }
    for (const c of cells) grid[c.row][c.col] = char(c);
    return grid.map((row) => row.join("")).join("\n") + "\n";
  };

  out.push("=== 珠盤路 ===");
  out.push(
    renderGrid(roads.beadPlate, (c) =>
      c.side === "B" ? "B" : c.side === "P" ? "P" : "T",
    ),
  );

  out.push("=== 大路 ===");
  out.push(
    renderGrid(roads.bigRoad, (c) => {
      const base = c.side === "B" ? "B" : "P";
      return c.ties > 0 ? base.toLowerCase() : base; // 小寫代表有和局標記
    }),
  );

  out.push("=== 大眼仔路 ===");
  out.push(renderGrid(roads.bigEye, (c) => (c.color === "R" ? "R" : "b")));

  out.push("=== 小路 ===");
  out.push(renderGrid(roads.smallRoad, (c) => (c.color === "R" ? "R" : "b")));

  out.push("=== 蟑螂路 ===");
  out.push(renderGrid(roads.cockroach, (c) => (c.color === "R" ? "R" : "b")));

  out.push(
    `\n總手: ${roads.totalHands}  莊: ${roads.bankerWins}  閒: ${roads.playerWins}  和: ${roads.tieWins}`,
  );

  return out.join("\n");
}
