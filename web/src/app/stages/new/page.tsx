'use client';

import { useState } from 'react';
import { format } from "date-fns"

import { StageCategory, ViewGrade } from '@/types/enums';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

export default function Stages() {

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <section className="w-full max-w-lg mx-auto">
        <form>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>공연 기본 정보</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">제목<span className="text-destructive">*</span></FieldLabel>
                  <Input id="title" placeholder="제목을 입력하세요" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">카테고리<span className="text-destructive">*</span></FieldLabel>
                  <Select defaultValue={StageCategory.Musical} id="category">
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(StageCategory).map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex flex-col gap-4 md:flex-row">
                  <Field>
                    <FieldLabel htmlFor="start-date">시작일<span className="text-destructive">*</span></FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant={'outline'}
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
                    <FieldLabel htmlFor="end-date">종료일<span className="text-destructive">*</span></FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant={'outline'}
                            data-empty={!startDate}
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
                    <Select defaultValue="pickstage-hall" id="location">
                      <SelectTrigger id="location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="pickstage-hall">
                            PickStage 홀
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="price">가격<span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="price"
                      type="number"
                      placeholder="가격을 입력하세요"
                      required
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                  <Field>
                    <FieldLabel htmlFor="running-time">러닝타임<span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="running-time"
                      type="number"
                      placeholder="러닝타임을 입력하세요"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="rating">등급</FieldLabel>
                    <Select defaultValue="" id="rating">
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(ViewGrade).map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
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
                    id="image"
                    type="file"
                    accept="image/*"
                    placeholder="대표이미지를 선택하세요"
                    required
                  />
                  <FieldDescription>Select a picture to upload.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">설명</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="설명을 입력하세요"
                    className="resize-none h-32"
                    required
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <Field orientation="horizontal" className="justify-center">
              <Button type="submit" className="w-full max-w-sm">
                회차 등록
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
