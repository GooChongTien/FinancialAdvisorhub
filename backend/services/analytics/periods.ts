export type Period = "mtd" | "qtd" | "ytd";
export type RollingPeriod = "week" | "month";

export interface PeriodRange {
  curStart: Date;
  curEnd: Date;
  prevStart: Date;
  prevEnd: Date;
}

export function getPeriodRange(kind: Period): PeriodRange {
  const now = new Date();
  if (kind === "qtd") {
    const quarter = Math.floor(now.getUTCMonth() / 3);
    const curStart = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1));
    const curEnd = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999));
    const prevQuarter = quarter - 1;
    const prevYear = prevQuarter < 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const adjustedPrevQuarter = (prevQuarter + 4) % 4;
    const prevStart = new Date(Date.UTC(prevYear, adjustedPrevQuarter * 3, 1));
    const prevEnd = new Date(Date.UTC(prevYear, adjustedPrevQuarter * 3 + 3, 0, 23, 59, 59, 999));
    return { curStart, curEnd, prevStart, prevEnd };
  }
  if (kind === "ytd") {
    const year = now.getUTCFullYear();
    const curStart = new Date(Date.UTC(year, 0, 1));
    const curEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    const prevStart = new Date(Date.UTC(year - 1, 0, 1));
    const prevEnd = new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999));
    return { curStart, curEnd, prevStart, prevEnd };
  }
  const curStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const curEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  return { curStart, curEnd, prevStart, prevEnd };
}

export function getRollingRange(kind: RollingPeriod): PeriodRange {
  const now = new Date();
  if (kind === "week") {
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const curStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
    const curEnd = new Date(Date.UTC(curStart.getUTCFullYear(), curStart.getUTCMonth(), curStart.getUTCDate() + 6, 23, 59, 59, 999));
    const prevStart = new Date(Date.UTC(curStart.getUTCFullYear(), curStart.getUTCMonth(), curStart.getUTCDate() - 7));
    const prevEnd = new Date(Date.UTC(curEnd.getUTCFullYear(), curEnd.getUTCMonth(), curEnd.getUTCDate() - 7, 23, 59, 59, 999));
    return { curStart, curEnd, prevStart, prevEnd };
  }
  const curStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const curEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  return { curStart, curEnd, prevStart, prevEnd };
}

export function annualizePremium(record: { premium_amount: number | null; premium_frequency: string | null }): number {
  const freq = String(record.premium_frequency || "Annual");
  const multiplier = { Monthly: 12, Quarterly: 4, "Semi-Annual": 2, Annual: 1, Single: 1 }[freq] ?? 1;
  const amount = Number(record.premium_amount || 0);
  return amount * multiplier;
}
