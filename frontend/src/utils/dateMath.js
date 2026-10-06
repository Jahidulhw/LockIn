// Day difference between two Date objects, counted by calendar date rather
// than elapsed milliseconds. A plain `(to - from) / 86400000` undercounts by
// a day for several months after a "spring forward" DST transition, since
// that day is actually 23 hours long. Anchoring both dates to UTC midnight
// for the same y/m/d sidesteps DST entirely.
export function calendarDaysBetween(from, to) {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / 86400000);
}
