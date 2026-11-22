import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt,
  IsNotEmpty, IsString, Matches, MaxLength, Min,
} from 'class-validator';

//좌석을 HOLD 한 사람이 이름과 전화번호를 입력하고 "예매하기"를 누르면 실행

export class ConfirmReservationDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(4)
    @ArrayUnique()
    @IsInt({ each: true })
    @Min(1, { each: true })
    scheduleSeatIds!: number[]; //확정할 좌석 (HoldSeatsDto와 같은 규칙)

    @IsString()
    @IsNotEmpty()
    @MaxLength(100) //스키마 customerName VarChar(100)과 맞춤
    customerName!: string;

    @IsString()
    @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
        message: '휴대폰 번호 형식이 올바르지 않습니다.',
    }) //010-1234-5678 또는 01012345678
    customerPhone!: string;
}