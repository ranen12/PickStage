'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

import { CreateStage } from '@/types/api/apiStage';
import {
  getCategory,
  getViewGrade,
  StageCategory,
  StageCategoryKey,
  ViewGrade,
  ViewGradeKey,
} from '@/types/enums';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import PageHeader from '@/components/layout/page-header';

export default function NewStages() {
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [category, setCategory] = useState<StageCategoryKey>('MUSICAL');
  const [rating, setRating] = useState<ViewGradeKey>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSumit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!startDate || !endDate) {
      setError('공연 시작일과 종료일을 선택해 주세요.');
      return;
    }

    if (endDate < startDate) {
      setError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    const poster = formData.get('poster');
    const file = poster instanceof File && poster.size > 0 ? poster : undefined;

    setIsSubmitting(true);

    try {
      const stage = await apiFetch<CreateStage>({
        path: '/stage',
        method: 'POST',
        body: {
          title: String(formData.get('title')),
          category,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          // venueName: String(formData.get('venueName')),
          price: Number(formData.get('price')),
          runningTime: Number(formData.get('runningTime')),
          rating,
          description: String(formData.get('description') ?? ''),
        },
        file,
      });

      if (stage?.id == null) {
        throw new Error('공연은 등록됐지만 응답에 공연 ID가 없습니다');
      }

      router.push(`/admin/schedules/${stage.id}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '공연 등록에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="공연 등록" />
      <div className="flex flex-col gap-4 px-4 py-8">
        <section className="w-full max-w-lg mx-auto">
          <form onSubmit={handleSumit}>
            <FieldGroup>
              <FieldSet>
                <FieldLegend>공연 기본 정보</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">
                      제목<span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      name="title"
                      id="title"
                      placeholder="제목을 입력하세요"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="category">
                      카테고리<span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={getCategory(category)}
                      onValueChange={(value) => {
                        if (value && value in StageCategory) {
                          setCategory(value as StageCategoryKey);
                        }
                      }}
                    >
                      <SelectTrigger id="category" aria-label="카테고리">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(StageCategory).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex flex-col gap-4 md:flex-row">
                    <Field>
                      <FieldLabel htmlFor="start-date">
                        시작일<span className="text-destructive">*</span>
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id="start-date"
                              type="button"
                              variant="outline"
                              data-empty={!startDate}
                              className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                            >
                              {startDate ? (
                                format(startDate, 'yyyy.MM.dd')
                              ) : (
                                <span>시작일 선택</span>
                              )}
                              <ChevronDownIcon data-icon="inline-end" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            defaultMonth={startDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="end-date">
                        종료일<span className="text-destructive">*</span>
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id="end-date"
                              variant="outline"
                              data-empty={!endDate}
                              className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                            >
                              {endDate ? (
                                format(endDate, 'yyyy.MM.dd')
                              ) : (
                                <span>종료일 선택</span>
                              )}
                              <ChevronDownIcon data-icon="inline-end" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            defaultMonth={endDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </div>
                  <div className="flex flex-col gap-4 md:flex-row">
                    <Field>
                      <FieldLabel htmlFor="location">장소</FieldLabel>
                      <Select defaultValue="PickStage 홀" id="location">
                        <SelectTrigger id="location">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="PickStage 홀">
                              PickStage 홀
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="price">
                        가격<span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        name="price"
                        id="price"
                        type="number"
                        min="0"
                        placeholder="가격을 입력하세요"
                        required
                      />
                    </Field>
                  </div>
                  <div className="flex flex-col gap-4 md:flex-row">
                    <Field>
                      <FieldLabel htmlFor="running-time">
                        러닝타임(분)<span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        name="runningTime"
                        id="running-time"
                        type="number"
                        min="1"
                        placeholder="러닝타임을 입력하세요"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="rating">등급</FieldLabel>
                      <Select
                        value={getViewGrade(rating)}
                        onValueChange={(value) => {
                          if (value && value in ViewGrade) {
                            setRating(value as ViewGradeKey);
                          }
                        }}
                      >
                        <SelectTrigger id="rating">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(ViewGrade).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="image">대표이미지</FieldLabel>
                    <Input
                      name="poster"
                      id="poster"
                      type="file"
                      accept="image/*"
                      required
                    />
                    <FieldDescription>
                      이미지 파일을 선택해 주세요.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="description">설명</FieldLabel>
                    <Textarea
                      name="description"
                      id="description"
                      placeholder="설명을 입력하세요"
                      className="resize-none h-32"
                      required
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
              <FieldSeparator />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Field orientation="horizontal" className="justify-center">
                <Button
                  type="submit"
                  className="w-full max-w-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '등록 중...' : '공연 등록 후 회차 등록'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </section>
      </div>
    </>
  );
}
