import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { User } from 'generated/prisma';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateTripDto, UpdateTripDto } from './dto/trip';
import { TripService } from './trip.service';

@Controller('trip')
@ApiBearerAuth('access-token')
export class TripController {
  constructor(private readonly tripService: TripService) {}
  @Get('public')
  async getPublicTrips(
    @Query('orderBy') orderBy = 'createdAt',
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.tripService.getPublicTrips({
      orderBy: { [orderBy]: 'desc' },
      skip,
      take,
    });
  }

  @Get(':id')
  async getTrip(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tripService.getTrip({ id, user });
  }

  @Get()
  async getMyTrips(
    @Query('orderBy') orderBy = 'createdAt',
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @CurrentUser() user: User,
  ) {
    return this.tripService.getMyTrips({
      orderBy: { [orderBy]: 'desc' },
      skip,
      take,
      user,
    });
  }

  @Post()
  @ApiBody({
    description: 'Trip data to create',
    type: CreateTripDto,
  })
  createTrip(@Body() body: CreateTripDto, @CurrentUser() user: User) {
    return this.tripService.createTrip({ data: body, user });
  }

  @Delete(':id')
  deleteTrip(@Param('id') id: number, @CurrentUser() user: User) {
    return this.tripService.deleteTrip({ id, user });
  }

  @Put(':id')
  @ApiBody({
    description: 'Trip data to update',
    type: UpdateTripDto,
  })
  updateTrip(
    @Param('id') id: number,
    @Body() data: UpdateTripDto,
    @CurrentUser() user: User,
  ) {
    return this.tripService.updateTrip({ id: +id, data, user });
  }
}
