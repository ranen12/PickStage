
export type Weekday = "월" | "화" | "수" | "목" | "금" | "토" | "일";
export type DayTimes = [string, string];
export type BaseSchedule = Record<Weekday, DayTimes | null>;

export type ScheduleException = {
  id: string;
  startDate: string;
  endDate: string;
  kind: "CLOSED" | "CUSTOM";
  times: DayTimes | null;
  label: string;
}
