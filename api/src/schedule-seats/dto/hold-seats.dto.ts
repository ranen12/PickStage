import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, Min } from "class-validator";

export class HoldSeatsDto{
    @IsArray()//배열이여야함
    @ArrayMinSize(1)//최소 1좌석
    @ArrayMaxSize(4)//최대 4좌석
    @ArrayUnique()//중복 선택 불가
    @IsInt({each:true})//각각 정수여야함
    @Min(1, {each:true})//각각1이상
    scheduleSeatIds! :number[];

}