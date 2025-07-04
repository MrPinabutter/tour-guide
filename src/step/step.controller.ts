import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Prisma, User } from 'generated/prisma';
import { StepService } from './step.service';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateStepDto, UpdateStepDto } from './dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('step')
@ApiBearerAuth('access-token')
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Post()
  @ApiBody({
    description: 'Step data to create',
    type: CreateStepDto,
  })
  create(@Body() step: CreateStepDto, @CurrentUser() user: User) {
    return this.stepService.create({ step, user });
  }

  @Get()
  findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('cursor') cursor: Prisma.StepWhereUniqueInput,
    @Query('where') where: Prisma.StepWhereInput,
    @Query('orderBy') orderBy: Prisma.StepOrderByWithRelationInput,
  ) {
    return this.stepService.findAll({
      skip: Number(skip),
      take: Number(take),
      cursor,
      where,
      orderBy,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stepService.findOne(+id);
  }

  @Patch(':id')
  @ApiBody({
    description: 'Step data to create',
    type: UpdateStepDto,
  })
  update(
    @Param('id') id: string,
    @Body() step: UpdateStepDto,
    @CurrentUser() user: User,
  ) {
    return this.stepService.update({ id: +id, step, user });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.stepService.remove({ id: +id, user });
  }

  @Post(':id/comment')
  addComment(@Param('id') id: number, @Body('text') text: string) {
    return this.stepService.addComment({
      id,
      text,
    });
  }

  @Patch('/comment/:id') // Move for another resource
  updateComment(@Param('id') id: number, @Body('text') text: string) {
    return this.stepService.updateComment({
      id,
      text,
    });
  }

  @Delete('/comment/:id')
  deleteComment(@Param(':id') id: number) {
    return this.stepService.deleteComment(id);
  }
}
