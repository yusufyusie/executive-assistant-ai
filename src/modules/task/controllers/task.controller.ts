/**
 * Task Controller - Presentation Layer
 * Handles HTTP requests for task management
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TaskApplicationService } from '../../../application/services/task-application.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskListResponseDto,
  TaskQueryDto,
  PrioritizeTasksDto,
  TaskPrioritizationResponseDto,
} from '../../../application/dtos/task.dto';

@ApiTags('Tasks')
@Controller('api/tasks')
export class TaskController {
  constructor(
    private readonly taskApplicationService: TaskApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getTasks(@Query() query: TaskQueryDto): Promise<TaskListResponseDto> {
    const result = await this.taskApplicationService.getTasks(query);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(@Param('id') id: string): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.getTaskById(id);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid task data' })
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.createTask(createTaskDto);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const result = await this.taskApplicationService.updateTask(
      id,
      updateTaskDto,
    );
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('id') id: string): Promise<{ message: string }> {
    const result = await this.taskApplicationService.deleteTask(id);
    if (result.isSuccess) {
      return { message: 'Task deleted successfully' };
    }
    throw new Error(result.error);
  }

  @Post('prioritize')
  @ApiOperation({ summary: 'Prioritize tasks using AI' })
  @ApiResponse({ status: 200, description: 'Tasks prioritized successfully' })
  async prioritizeTasks(
    @Body() prioritizeDto: PrioritizeTasksDto,
  ): Promise<TaskPrioritizationResponseDto> {
    const result =
      await this.taskApplicationService.prioritizeTasks(prioritizeDto);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Get tasks by priority' })
  @ApiParam({ name: 'priority', description: 'Task priority' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getTasksByPriority(
    @Param('priority') priority: string,
  ): Promise<TaskResponseDto[]> {
    const result =
      await this.taskApplicationService.getTasksByPriority(priority);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get tasks by status' })
  @ApiParam({ name: 'status', description: 'Task status' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getTasksByStatus(
    @Param('status') status: string,
  ): Promise<TaskResponseDto[]> {
    const result = await this.taskApplicationService.getTasksByStatus(status);
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({
    status: 200,
    description: 'Overdue tasks retrieved successfully',
  })
  async getOverdueTasks(): Promise<TaskResponseDto[]> {
    const result = await this.taskApplicationService.getOverdueTasks();
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get task analytics' })
  @ApiResponse({
    status: 200,
    description: 'Task analytics retrieved successfully',
  })
  async getTaskAnalytics(): Promise<any> {
    const result = await this.taskApplicationService.getTaskAnalytics();
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(result.error);
  }
}
