/**
 * Task Module - Presentation Layer
 * Handles task management functionality with clean architecture
 */

import { Module } from '@nestjs/common';
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';

// Application Layer
import { TaskApplicationService } from '../../application/services/task-application.service';
import { CreateTaskHandler } from '../../application/commands/task/create-task.handler';
import { UpdateTaskHandler } from '../../application/commands/task/update-task.handler';
import { GetTasksHandler } from '../../application/queries/task/get-tasks.handler';

// Domain Layer
import { TaskPrioritizationService } from '../../domain/services/task-prioritization.service';

// Infrastructure Layer
import { InMemoryTaskRepository } from '../../infrastructure/persistence/in-memory/task.repository.impl';
import type { TaskRepository } from '../../domain/repositories/task.repository';

@Module({
  controllers: [TaskController],
  providers: [
    // Legacy service for backward compatibility
    TaskService,

    // Application Services
    TaskApplicationService,

    // Command Handlers
    CreateTaskHandler,
    UpdateTaskHandler,

    // Query Handlers
    GetTasksHandler,

    // Domain Services
    TaskPrioritizationService,

    // Repository Implementation
    {
      provide: 'TaskRepository',
      useClass: InMemoryTaskRepository,
    },
  ],
  exports: [TaskService, TaskApplicationService],
})
export class TaskModule {}
