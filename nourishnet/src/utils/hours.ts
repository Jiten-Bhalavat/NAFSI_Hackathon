/**
 * Parses hours strings like "Mon-Fri: 9am-3pm", "Wed,Fri: 10am-1pm/4-6pm"
 * and determines if a place is currently open.
 */

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, th: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

/** Convert a day abbreviation/name to 0-6 (Sun=0). Returns -1 if unknown. */
function dayIndex(token: string): number {
  return DAY_MAP[token.trim().toLowerCase()] ?? -1;
}

/** Parse "8am", "9:30pm", "12noon", "12pm", "6:45" into minutes since midnight. */
function parseTime(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace("noon", "pm").replace("midnight", "am");
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2] ?? "0", 10);
  const meridiem = match[3];
  if (meridiem === "pm" && hours !== 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/** Parse a time range string like "9am-3pm" or "5:30-6:45" (inherits pm if end has pm). */
function parseTimeRange(raw: string): [number, number] | null {
  const parts = raw.split("-");
  if (parts.length < 2) return null;
  // Rejoin in case of "9:30am-3:30pm" (only one dash expected between times)
  // But handle "5:30-6:45pm" where pm only appears on end
  const endRaw = parts[parts.length - 1];
  const startRaw = parts.slice(0, parts.length - 1).join("-");

  let start = parseTime(startRaw);
  let end = parseTime(endRaw);
  if (start === null || end === null) return null;

  // If start has no meridiem and end has pm, infer pm for start if start < end after adding 12h
  if (!startRaw.match(/am|pm/i) && endRaw.match(/pm/i)) {
    const startPm = start + 12 * 60;
    if (startPm <= end) start = startPm;
  }
  return [start, end];
}

/** Expand a day range like "Mon-Fri" into array of day indices. */
function expandDayRange(from: number, to: number): number[] {
  const days: number[] = [];
  if (from <= to) {
    for (let d = from; d <= to; d++) days.push(d);
  } else {
    // Wraps around week, e.g. Fri-Sun
    for (let d = from; d <= 6; d++) days.push(d);
    for (let d = 0; d <= to; d++) days.push(d);
  }
  return days;
}

/** Parse a day expression like "Mon-Fri", "Wed,Fri,Sat", "Tue & Th", "Saturday" into day indices. */
function parseDays(raw: string): number[] {
  const days: number[] = [];
  // Split by comma or "&" or "and"
  const chunks = raw.split(/,|&|\band\b/i).map((s) => s.trim());
  for (const chunk of chunks) {
    // Check if it's a range like "Mon-Fri"
    const rangeParts = chunk.split("-");
    if (rangeParts.length === 2) {
      const from = dayIndex(rangeParts[0]);
      const to = dayIndex(rangeParts[1]);
      if (from !== -1 && to !== -1) {
        days.push(...expandDayRange(from, to));
        continue;
      }
    }
    // Single day
    const d = dayIndex(chunk);
    if (d !== -1) days.push(d);
  }
  return [...new Set(days)];
}

export type OpenStatus = "open" | "closed" | "unknown";

/**
 * Returns "open" | "closed" | "unknown" for the given hours string at a given Date.
 * "unknown" means we couldn't parse the hours (Call, etc).
 */
export function getOpenStatus(hours: string, at: Date = new Date()): OpenStatus {
  if (!hours || hours === "Hours not available") return "unknown";
  const lower = hours.toLowerCase();
  if (/^call|call first|call for/i.test(lower)) return "unknown";

  const nowDay = at.getDay(); // 0=Sun
  const nowMin = at.getHours() * 60 + at.getMinutes();

  // Split on semicolons in case multiple day-time segments are chained
  // Also handle formats like "9am-12pm: 1st and 3rd Fri" (reversed order)
  // Normalise "1st", "2nd", "3rd", "4th" phrases — treat as open (we can't know week of month)
  const segments = hours.split(/;/).map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    // Strip ordinal-week qualifiers: "1st &", "2nd &", "3rd", "4th", "every"
    const cleaned = seg.replace(/\b(1st|2nd|3rd|4th|every)\b/gi, "").replace(/\s+/g, " ").trim();

    // Try to find days and times in the segment
    // Pattern: "<days>: <times>" or "<times>: <days>"
    const colonMatch = cleaned.match(/^(.+?):\s*(.+)$/);
    if (!colonMatch) continue;

    let dayPart = colonMatch[1];
    let timePart = colonMatch[2];

    // Detect which side has times vs days — if first part contains digits it may be time
    if (/\d/.test(dayPart) && !/\d/.test(timePart)) {
      [dayPart, timePart] = [timePart, dayPart];
    }

    const activeDays = parseDays(dayPart);
    if (activeDays.length === 0) continue;
    if (!activeDays.includes(nowDay)) continue;

    // Multiple time slots separated by "/" or ","
    const timeSlots = timePart.split(/\/|,\s*(?=\d)/).map((s) => s.trim());
    for (const slot of timeSlots) {
      const range = parseTimeRange(slot);
      if (!range) continue;
      const [start, end] = range;
      if (nowMin >= start && nowMin <= end) return "open";
    }

    // We matched the day but none of the time slots → closed today
    return "closed";
  }

  return "unknown";
}

/** Returns true if open right now. Treats "unknown" as true (include in emergency results). */
export function isOpenNow(hours: string): boolean {
  const status = getOpenStatus(hours);
  return status === "open" || status === "unknown";
}
