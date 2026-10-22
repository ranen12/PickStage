
export const StageCategory = {
  MUSICAL: '뮤지컬',
  PLAY: '연극',
  CONCERT: '콘서트',
  CLASSICS: '클래식',
  EXHIBITION: '전시',
} as const;

export type StageCategoryValue = (typeof StageCategory)[keyof typeof StageCategory];
export type StageCategoryKey = keyof typeof StageCategory;

export function getCategory(category: keyof typeof StageCategory){
  return StageCategory[category];
}

export const ViewGrade = {
    ALL: '전체관람가',
    MINORS_7: '7세 이상',
    MINORS_12: '12세 이상',
    MINORS_15: '15세 이상',
    ADULT_ONLY: '성인 전용',
} as const;

export type ViewGradeValue = (typeof ViewGrade)[keyof typeof ViewGrade];
export type ViewGradeKey = keyof typeof ViewGrade;

export function getViewGrade(grade: keyof typeof ViewGrade){
  return ViewGrade[grade];
}
