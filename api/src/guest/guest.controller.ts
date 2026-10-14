import { Controller, Post, Req, Res } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Request, Response } from 'express';

//쿠키에 관한 파일입니다.

@Controller('guest')
export class GuestController{
    @Post('identity')
    createGuestIdentity(
        @Req() req: Request,
        @Res({ passthrough: true}) res: Response,
    ) {
        //cookie-parser가 서명을 확인한 쿠키에서 방문자 ID를 읽는다.
        //쿠키가 없을시 undefined, 서명이 틀릴시 false
        const existingId =req.signedCookies?.guestId;

        //값이 문자열이고, 빈 문자열이 아니다.(이미 방문자 ID가 존재할경우)
        //이게 없으면 새로운 ID가 발급되어버린다.
        if(typeof existingId === 'string' && existingId.length > 0){
            return { message :'기존 방문자 ID를 사용합니다.'}
        }
        const guestId = randomUUID();

        //응답에 쿠키를 담아 보내면 브라우저가 관리한다.
        res.cookie('guestId', guestId, {
            signed: true, //서버의 비밀키로 서명한다.
            httpOnly: true, //프론트 js에서 쿠키를 읽지 못하게 한다.
            secure: process.env.NODE_ENV ==='production',
            sameSite : 'lax',
            path: '/', //모든 경로에서 쿠키 전송
            maxAge: 24 * 60 * 60 * 1000, //1일
        })

        return {message: '방문자 ID 발급.'};
    }
}