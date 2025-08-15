/**
 * Command Interfaces - Application Layer
 * CQRS Command pattern definitions
 */

export interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export interface CommandBus {
  execute<TCommand extends Command, TResult = void>(
    command: TCommand
  ): Promise<TResult>;
}

export abstract class BaseCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = this.generateCommandId();
    this.timestamp = new Date();
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
