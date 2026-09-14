import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { env } from 'process';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return (request?.query?.token as string) || null;
        },
      ]),
      secretOrKey: env.SECRET_TOKEN ?? '',
      ignoreExpiration: false,
    });
  }

  validate(payload: any) {
    return {
      id: payload.id,
      login: payload.sub,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
      name: payload.name,
    };
  }
}
