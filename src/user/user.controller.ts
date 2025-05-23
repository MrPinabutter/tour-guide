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
import { UserService } from './user.service';
import { Prisma, User } from 'generated/prisma';
import { ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    this.userService.getProfile(user);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    return this.userService.getUserById(id);
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
  async updateUser(@Param('id') id: number, @Body('name') name: string) {
    return this.userService.updateUser(id, name);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    return this.userService.deleteUser(id);
  }
}
