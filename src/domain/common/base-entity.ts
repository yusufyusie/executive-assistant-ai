/**
 * Base Entity - Domain Layer
 * Provides common functionality for all domain entities
 */

export abstract class BaseEntity {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  public equals(other: BaseEntity): boolean {
    if (!(other instanceof BaseEntity)) {
      return false;
    }
    return this._id === other._id;
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
