export class ErrorDetails {
	constructor(
		public readonly code: string,
		public readonly message: string,
		public readonly metadata?: Map<string, unknown>,
	) {}
}

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

	public static failure<U = void>(error: ErrorDetails): Result<U>;
	public static failure<U = void>(
		code: string,
		message: string,
		metadata?: Map<string, unknown>,
	): Result<U>;
	public static failure<U = void>(
		errorOrCode: ErrorDetails | string,
		message?: string,
		metadata?: Map<string, unknown>,
	): Result<U> {
		if (typeof errorOrCode === "string") {
			return new Result<U>(false, undefined, {
				code: errorOrCode,
				message: message ?? "",
				metadata,
			});
		}
		return new Result<U>(false, undefined, errorOrCode);
	}
}

export class Created {
	static toResult(): Result<Created> {
		return Result.success(new Created());
	}
}

export class Updated {
	static toResult(): Result<Updated> {
		return Result.success(new Updated());
	}
}
