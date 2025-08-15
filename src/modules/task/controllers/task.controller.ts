/**
 * Task Controller - Presentation Layer
 * RESTful API endpoints for task management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaskApplicationService } from '../../../application/services/task-application.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  PrioritizeTasksDto,
  TaskResponseDto,
  TaskListResponseDto,
  TaskPrioritizationResponseDto,
  TaskAnalyticsResponseDto,
} from '../../../application/dtos/task.dto';

@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskApplicationService: TaskApplicationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getTasks(@Query(ValidationPipe) query: TaskQueryDto): Promise<TaskListResponseDto> {
    const result = await this.taskApplicationService.getTasks(query);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.getTaskById(id);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body(ValidationPipe) createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.createTask(createTaskDto);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto
  ): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.updateTask(id, updateTaskDto);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.taskApplicationService.deleteTask(id);

    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  @Post('prioritize')
  @HttpCode(HttpStatus.OK)
  async prioritizeTasks(@Body(ValidationPipe) prioritizeDto: PrioritizeTasksDto): Promise<TaskPrioritizationResponseDto> {
    const result = await this.taskApplicationService.prioritizeTasks(prioritizeDto);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('priority/:priority')
  @HttpCode(HttpStatus.OK)
  async getTasksByPriority(@Param('priority') priority: string): Promise<TaskResponseDto[]> {
    const result = await this.taskApplicationService.getTasksByPriority(priority);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('status/:status')
  @HttpCode(HttpStatus.OK)
  async getTasksByStatus(@Param('status') status: string): Promise<TaskResponseDto[]> {
    const result = await this.taskApplicationService.getTasksByStatus(status);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('overdue')
  @HttpCode(HttpStatus.OK)
  async getOverdueTasks(): Promise<TaskResponseDto[]> {
    const result = await this.taskApplicationService.getOverdueTasks();

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics(): Promise<TaskAnalyticsResponseDto> {
    const result = await this.taskApplicationService.getTaskAnalytics();

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }
}
