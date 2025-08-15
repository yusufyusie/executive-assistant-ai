/**
 * Simplified Task Module - Working Version
 * Simplified module for immediate functionality
 */

import { Module } from '@nestjs/common';
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModuleSimple {}
