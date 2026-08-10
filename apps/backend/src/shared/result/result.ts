import type { ErrorDetails } from "./error-details";

export class Result<T = void> {
	public readonly isSuccess: boolean;
	public readonly isFailure: boolean;
	private readonly _value?: T;
	private readonly _error?: ErrorDetails;

	private constructor(isSuccess: boolean, value?: T, error?: ErrorDetails) {
		this.isSuccess = isSuccess;
		this.isFailure = !isSuccess;
		this._value = value;
		this._error = error;
	}

	public get value(): T {
		if (this.isFailure) {
			return undefined as T;
		}
		return this._value as T;
	}

	public get error(): ErrorDetails {
		if (this.isSuccess) {
			return undefined as unknown as ErrorDetails;
		}
		return this._error as ErrorDetails;
	}

	public static success(): Result<void>;
	public static success<U>(value: U): Result<U>;
	public static success<U>(value?: U): Result<U> {
		return new Result<U>(true, value, undefined);
	}

	public static failure<U = void>(error: ErrorDetails): Result<U> {
		return new Result<U>(false, undefined, error);
	}
}

export class Created {
	public readonly message: string = "Created";

	static toResult(): Result<Created> {
		return Result.success(new Created());
	}
}

export class Updated {
	public readonly message: string = "Updated";

	static toResult(): Result<Updated> {
		return Result.success(new Updated());
	}
}

export class Deleted {
	public readonly message: string = "Deleted";

	static toResult(): Result<Deleted> {
		return Result.success(new Deleted());
	}
}

export class Success {
	public readonly message: string = "Success";

	static toResult(): Result<Success> {
		return Result.success(new Success());
	}
}
