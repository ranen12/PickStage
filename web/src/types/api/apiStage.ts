import { StageCategoryKey, ViewGradeKey } from '@/types/enums';


export type CreateStage = {
  id: number;
}

export type StageOneResponse = {
  id: number;
  title: string;
  category: StageCategoryKey;
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  price: number;
  runningTime: number;
  rating: ViewGradeKey;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  schedules: StageScheduleResponse[];
}

export type StageScheduleResponse = {
  id: number;
  stageId: number;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export type StageListOne = {
  id: number;
  title: string;
  category: StageCategoryKey;
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  price: number;
  runningTime: number;
  rating: ViewGradeKey;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    schedules: number;
  };
}

export type StageListResponse = {
  data: StageListOne[],
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
