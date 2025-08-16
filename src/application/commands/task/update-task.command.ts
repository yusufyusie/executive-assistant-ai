/**
 * Update Task Command - Application Layer
 * Command for updating existing tasks
 */

import { BaseCommand } from '../../common/command.interface';
import { UpdateTaskDto } from '../../dtos/task.dto';

export class UpdateTaskCommand extends BaseCommand {
  constructor(
    public readonly taskId: string,
    public readonly data: UpdateTaskDto,
  ) {
    super();
  }
}
