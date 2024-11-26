import { Injectable, NotAcceptableException } from '@nestjs/common'
import { CreateLabDto } from './dto/create-lab.dto'
import { UpdateLabDto } from './dto/update-lab.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Lab } from './entities/lab.entity'
import { Repository } from 'typeorm'
import { UserService } from 'src/user/user.service'

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(Lab)
    private readonly lab: Repository<Lab>,
    private readonly userService: UserService
  ) {}

  public async createLab(dto: CreateLabDto): Promise<Lab> {
    const userId = await this.userService.getOneUser(dto.userId)

    if (!userId) {
      throw new NotAcceptableException({
        success: false,
        message: `ID : ${dto.userId}를 가진 해당 유저는 없습니다.`
      })
    }
    const lab = await this.lab.save({
      rentalDate: dto.rentalDate,
      rentalUser: dto.rentalUser,
      rentalUsers: dto.rentalUsers,
      rentalPurpose: dto.rentalPurpose,
      rentalStartTime: dto.rentalStartTime,
      labName: dto.labName,
      userId: dto.userId,
      deletionRental: false,
      approvalRental: false
    })

    return lab
  }

  public async findAll(): Promise<Lab[]> {
    return await this.lab.find()
  }

  public async findApprovalRental(): Promise<Lab[]> {
    return await this.lab.find({
      where: {
        approvalRental: false
      }
    })
  }

  public async findDeletionRental(): Promise<Lab[]> {
    return await this.lab.find({
      where: {
        deletionRental: false
      }
    })
  }

  public async findAllUserLab(id: number): Promise<Lab[]> {
    return await this.lab.find({
      where: {
        userId: id
      }
    })
  }

  public async findOneLab(id: number): Promise<Lab> {
    return await this.lab.findOne({
      where: {
        id
      }
    })
  }

  public async update(id: number, dto: UpdateLabDto): Promise<void> {
    const { ...update } = dto

    if (update.deletionRental) {
      await this.lab.update({ id }, dto)

      await this.deleteLap(id)
    }

    await this.lab.update({ id }, dto)
  }

  public async deleteLap(id: number): Promise<void> {
    const deletionRental = await this.findOneLab(id)

    if (deletionRental.deletionRental == false) {
      throw new NotAcceptableException({
        success: false,
        message: `해당 요청의 삭제가 승인되지않았습니다.`
      })
    }
    await this.lab.delete({ id })
  }

  public async allDelete(): Promise<void> {
    await this.lab.delete({})
  }
}
