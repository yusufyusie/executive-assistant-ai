/**
 * Get Tasks Query - Application Layer
 * Query for retrieving tasks with filters
 */

import { BaseQuery } from '../../common/query.interface';
import { TaskQueryDto } from '../../dtos/task.dto';

export class GetTasksQuery extends BaseQuery {
  constructor(public readonly options?: TaskQueryDto) {
    super();
  }
}
