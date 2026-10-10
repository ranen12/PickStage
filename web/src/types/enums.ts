
export const StageCategory = {
  Musical: '뮤지컬',
  Play: '연극',
  Concert: '콘서트',
  Classics: '클래식',
  Exhibition: '전시',
} as const;

export type StageCategory = (typeof StageCategory)[keyof typeof StageCategory];

export const ViewGrade = {
    ALL: '전체관람가',
    MINORS_7: '7세 이상',
    MINORS_12: '12세 이상',
    MINORS_15: '15세 이상',
    ADULT_ONLY: '성인 전용',
} as const;

export type ViewGrade = (typeof ViewGrade)[keyof typeof ViewGrade];

