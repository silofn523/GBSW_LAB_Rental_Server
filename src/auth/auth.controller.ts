import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  UnauthorizedException,
  UseGuards,
  Req
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/Login.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from './guard/auth.guard'
import { Request } from 'express'
import { UserService } from 'src/user/user.service'
import { User } from 'src/user/entities/user.entity'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userServic: UserService
  ) {}

  @ApiOperation({
    summary: '로그인'
  })
  @Post('login')
  public async loginUser(@Body(ValidationPipe) dto: LoginDto): Promise<{
    success: boolean
    accessToken?: string
    refreshToken?: string
  }> {
    return await this.authService.loginWithUsername(dto)
  }

  @ApiOperation({
    summary: '토큰 재 발급',
    description: 'access토큰을 재 발급 합니다.'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('token/access')
  public async createTokenAccess(@Req() req: Request): Promise<{
    success: boolean
    message: string
    token: { newAccessToken: string }
  }> {
    const authHeader = req.headers.authorization

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
    await this.authService.verifyToken(token)

    return await this.authService.rotateToken(token, false) // falses는 access토큰 발급
  }

  @ApiOperation({
    summary: '유저 확인',
    description: '로그인한(토큰의 주인) 유저가 누군지 확인.'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('check_token')
  public async checkToken(@Req() req: Request): Promise<{
    success: boolean
    body: { userId: { id: number; type: 'refresh' | 'access' }; userStatus: User; token: string }
  }> {
    const authHeader = req.headers.authorization

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
    const userId = await this.authService.verifyToken(token)
    const userStatus = await this.userServic.getOneUser(userId.id)

    return {
      success: true,
      body: {
        userId,
        userStatus,
        token
      }
    }
  }
}
