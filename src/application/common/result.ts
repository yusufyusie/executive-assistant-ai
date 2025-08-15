/**
 * Result Pattern - Application Layer
 * Type-safe error handling without exceptions
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  public static success<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  public static failure<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  public get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.success(fn(this._value!));
    }
    return Result.failure(this._error!);
  }

  public mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.success(this._value!);
    }
    return Result.failure(fn(this._error!));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value!);
    }
    return Result.failure(this._error!);
  }

  public match<U>(
    onSuccess: (value: T) => U,
    onFailure: (error: E) => U
  ): U {
    if (this._isSuccess) {
      return onSuccess(this._value!);
    }
    return onFailure(this._error!);
  }

  public getValueOrDefault(defaultValue: T): T {
    return this._isSuccess ? this._value! : defaultValue;
  }

  public getValueOrThrow(): T {
    if (!this._isSuccess) {
      throw this._error;
    }
    return this._value!;
  }
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Helper functions for common patterns
export const success = <T, E = Error>(value: T): Result<T, E> => Result.success(value);
export const failure = <T, E = Error>(error: E): Result<T, E> => Result.failure(error);

// Utility functions for working with arrays of results
export const combineResults = <T, E = Error>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isFailure) {
      return Result.failure(result.error);
    }
    values.push(result.value);
  }
  
  return Result.success(values);
};

export const firstSuccess = <T, E = Error>(results: Result<T, E>[]): Result<T, E> => {
  for (const result of results) {
    if (result.isSuccess) {
      return result;
    }
  }
  
  return results.length > 0 ? results[results.length - 1] : Result.failure('No results provided' as any);
};
