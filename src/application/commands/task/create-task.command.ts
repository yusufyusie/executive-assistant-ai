/**
 * Create Task Command - Application Layer
 * Command for creating new tasks
 */

import { BaseCommand } from '../../common/command.interface';
import { CreateTaskDto } from '../../dtos/task.dto';

export class CreateTaskCommand extends BaseCommand {
  constructor(public readonly data: CreateTaskDto) {
    super();
  }
}
