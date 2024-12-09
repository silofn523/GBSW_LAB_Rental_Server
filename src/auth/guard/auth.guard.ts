import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  UnauthorizedException
} from '@nestjs/common'
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt'
import * as jwt from 'jsonwebtoken'
import { RolesEnum } from 'src/util/enum/roles.enum'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException({
        success: false,
        message: 'Authorization header missing'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Token missing'
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number; role: RolesEnum }
      request.user = { id: decoded.id, role: decoded.role }

      return true
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new NotAcceptableException({
          success: false,
          message: `만료된 토큰입니다`
        })
      }

      if (e instanceof JsonWebTokenError) {
        throw new NotAcceptableException({
          success: false,
          message: `잘못된 토큰입니다`
        })
      }
      throw new InternalServerErrorException('JWT_SERVICE_ERROR')
    }
  }
}
