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
import { Prisma, User, UserVisibility } from 'generated/prisma';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserService } from './user.service';

@Controller('user')
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number, @CurrentUser() user: User) {
    return this.userService.getUserById({ id, user });
  }

  @Get()
  async getAllUsers(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('cursor') cursor: Prisma.UserWhereUniqueInput,
    @Query('where') where: Prisma.UserWhereInput,
    @Query('orderBy') orderBy: Prisma.UserOrderByWithRelationInput,
  ) {
    return this.userService.getAllUsers({
      skip: Number(skip),
      take: Number(take),
      cursor,
      where,
      orderBy,
    });
  }

  @Get('name/:name')
  async getUsersByName(@Param('name') name: string) {
    return this.userService.getUsersByName(name);
  }

  @Post()
  @ApiBody({
    description: 'User data to create',
    type: Object,
  })
  async createUser(@Body() user: Prisma.UserCreateInput) {
    return this.userService.createUser(user);
  }

  @Put(':id')
  @ApiBody({
    description: 'User data to Update',
    type: Object,
  })
  async updateUser(
    @Param('id') id: number,
    @Body()
    data: { name: string; username: string; visibility: UserVisibility },
    @CurrentUser() user: User,
  ) {
    return this.userService.updateUser({ id, data, user });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number, @CurrentUser() user: User) {
    return this.userService.deleteUser({ id, user });
  }
}
