/**
 * Query Interfaces - Application Layer
 * CQRS Query pattern definitions
 */

export interface Query {
  readonly queryId: string;
  readonly timestamp: Date;
}

export interface QueryHandler<TQuery extends Query, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

export interface QueryBus {
  execute<TQuery extends Query, TResult>(query: TQuery): Promise<TResult>;
}

export abstract class BaseQuery implements Query {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = this.generateQueryId();
    this.timestamp = new Date();
  }

  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
