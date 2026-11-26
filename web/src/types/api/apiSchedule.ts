export type ScheduleResponse = {
  stageId: number;
  title: string;
  startDate: string;
  endDate: string;
  runningTime: number;
  schedules: ScheduleListResponse[];
};

export type ScheduleListResponse = {
  id: number;
  startAt: string;
  endAt: string;
};

export type ScheduleCreateRequest = {
  schedules: {
    startAt: string;
    endAt: string;
  }[];
};