import {
  addDays,
  differenceInDays,
  format,
  isBefore,
  isSameDay,
  isWeekend,
  startOfDay,
} from 'date-fns';

/* -------------------- types -------------------- */

export interface LeaveRecommendation {
  leaveDates: Date[];
  startDate: Date;
  endDate: Date;
  totalDays: number;
  leavesUsed: number;
  description: string;
}

export interface OptimizationResult {
  recommendations: LeaveRecommendation[];
  optimizedLeaves: Date[];
  totalVacations: number;
  longestBreak: number;
  leavesRemaining: number;
}

/* -------------------- utils -------------------- */

function normalize(d: Date) {
  return startOfDay(d);
}

function isHoliday(date: Date, holidays: Date[]) {
  return holidays.some(h => isSameDay(h, date));
}

function isWorkingDay(date: Date, holidays: Date[]) {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

function getDateRange(start: Date, end: Date) {
  const res: Date[] = [];
  let cur = normalize(start);
  const last = normalize(end);

  while (isBefore(cur, addDays(last, 1))) {
    res.push(cur);
    cur = addDays(cur, 1);
  }
  return res;
}

/* -------------------- rules -------------------- */

/** max 3 consecutive WORKING-DAY leaves */
function exceedsMaxConsecutiveLeaves(
  leaveDates: Date[],
  holidays: Date[],
  max = 3
) {
  const sorted = leaveDates
    .map(normalize)
    .sort((a, b) => a.getTime() - b.getTime());

  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];

    if (
      differenceInDays(cur, prev) === 1 &&
      isWorkingDay(cur, holidays)
    ) {
      streak++;
      if (streak > max) return true;
    } else {
      streak = 1;
    }
  }
  return false;
}

/** holiday must exist within ±3 days (excluding weekend holidays) */
function hasHolidayAnchor(
  leaveDates: Date[],
  holidays: Date[]
) {
  const validHolidays = holidays.filter(h => !isWeekend(h));

  return leaveDates.some(ld =>
    validHolidays.some(h =>
      Math.abs(differenceInDays(ld, h)) <= 3
    )
  );
}

/* -------------------- vacation expansion -------------------- */
/**
 * CRITICAL FIX:
 * Expand until a TRUE working day blocks continuity.
 * This fixes Christmas / Aug 15 / inter-month bugs.
 */
function extendToFullVacation(
  leaveDates: Date[],
  holidays: Date[],
  anchor: Date
) {
  const leaveSet = new Set(
    leaveDates.map(d => format(d, 'yyyy-MM-dd'))
  );

  const isOffDay = (d: Date) =>
    isWeekend(d) ||
    isHoliday(d, holidays) ||
    leaveSet.has(format(d, 'yyyy-MM-dd'));

  // 🔒 Bound expansion around anchor + leaves ONLY
  let start = normalize(
    [anchor, ...leaveDates].reduce((a, b) => (a < b ? a : b))
  );
  let end = normalize(
    [anchor, ...leaveDates].reduce((a, b) => (a > b ? a : b))
  );

  while (isOffDay(addDays(start, -1))) {
    start = addDays(start, -1);
  }

  while (isOffDay(addDays(end, 1))) {
    end = addDays(end, 1);
  }

  return { startDate: start, endDate: end };
}

/* -------------------- opportunity builders -------------------- */

function buildOpportunity(
  leaveDates: Date[],
  holidays: Date[],
  anchorHoliday: Date
) {
  if (
    leaveDates.length === 0 ||
    exceedsMaxConsecutiveLeaves(leaveDates, holidays) ||
    !hasHolidayAnchor(leaveDates, holidays)
  ) {
    return null;
  }

  const { startDate, endDate } = extendToFullVacation(
    leaveDates,
    holidays,
    anchorHoliday
  );

  const totalDays = getDateRange(startDate, endDate).length;

  return {
    leaveDates,
    startDate,
    endDate,
    totalDays,
    bonusDays: totalDays - leaveDates.length,
    efficiency: totalDays / leaveDates.length,
  };
}

function findOpportunitiesAroundHoliday(
  holiday: Date,
  holidays: Date[]
) {
  if (isWeekend(holiday)) return [];

  const results = [];

  const before: Date[] = [];
  let d = addDays(holiday, -1);
  while (isWorkingDay(d, holidays)) {
    before.unshift(normalize(d));
    d = addDays(d, -1);
  }

  const after: Date[] = [];
  d = addDays(holiday, 1);
  while (isWorkingDay(d, holidays)) {
    after.push(normalize(d));
    d = addDays(d, 1);
  }

  // BEFORE only
  const beforeOpp = buildOpportunity(before.slice(-3), holidays, holiday);
  if (beforeOpp) results.push(beforeOpp);

  // AFTER only
  const afterOpp = buildOpportunity(after.slice(0, 3), holidays, holiday);
  if (afterOpp) results.push(afterOpp);

  // 🔥 COMBINED (this fixes Christmas)
  const combined = [...before.slice(-3), ...after.slice(0, 3)];
  const combinedOpp = buildOpportunity(combined, holidays, holiday);
  if (combinedOpp) results.push(combinedOpp);

  return results;
}


/* -------------------- main optimizer -------------------- */

export function optimizeLeaves(
  holidays: Date[],
  totalLeaves: number,
  _sandwichRule: boolean,
  preferLonger: boolean
): OptimizationResult {
  if (!holidays.length || totalLeaves <= 0) {
    return emptyResult(totalLeaves);
  }

  const normalizedHolidays = holidays
    .map(normalize)
    .sort((a, b) => a.getTime() - b.getTime());

  const opportunities = normalizedHolidays.flatMap(h =>
    findOpportunitiesAroundHoliday(h, normalizedHolidays)
  );

  opportunities.sort((a, b) =>
    preferLonger
      ? b.totalDays - a.totalDays
      : b.efficiency - a.efficiency
  );

  const used = new Set<string>();
  const selected = [];
  let usedLeaves = 0;

  for (const opp of opportunities) {
    const keys = opp.leaveDates.map(d =>
      format(d, 'yyyy-MM-dd')
    );

    if (
      keys.some(k => used.has(k)) ||
      usedLeaves + keys.length > totalLeaves
    ) {
      continue;
    }

    keys.forEach(k => used.add(k));
    usedLeaves += keys.length;
    selected.push(opp);
  }

  const recommendations: LeaveRecommendation[] = selected.map(o => ({
    leaveDates: o.leaveDates,
    startDate: o.startDate,
    endDate: o.endDate,
    totalDays: o.totalDays,
    leavesUsed: o.leaveDates.length,
    description: `Take ${o.leaveDates.length} leave day(s) to get ${o.totalDays} continuous days off`,
  }));

  return {
    recommendations,
    optimizedLeaves: selected.flatMap(o => o.leaveDates),
    totalVacations: recommendations.length,
    longestBreak: Math.max(0, ...recommendations.map(r => r.totalDays)),
    leavesRemaining: totalLeaves - usedLeaves,
  };
}

/* -------------------- helpers -------------------- */

function emptyResult(totalLeaves: number): OptimizationResult {
  return {
    recommendations: [],
    optimizedLeaves: [],
    totalVacations: 0,
    longestBreak: 0,
    leavesRemaining: totalLeaves,
  };
}
