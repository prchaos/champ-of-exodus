/** Returns `referenceDate`'s local calendar date as a "YYYY-MM-DD" string, matching the value format of an `<input type="date">`. */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const localTime = new Date(referenceDate.getTime() - referenceDate.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

/** Returns `referenceDate`'s local clock time as a "HH:mm" string, matching the value format of an `<input type="time">`. */
export function getCurrentTimeString(referenceDate: Date = new Date()): string {
  const localTime = new Date(referenceDate.getTime() - referenceDate.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(11, 16);
}
