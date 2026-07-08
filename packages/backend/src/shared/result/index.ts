export type ErrorDetails = {
	code: string;
	message: string;
	metadata?: Record<string, unknown>;
};

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
			throw new Error("No se puede obtener el valor de un resultado fallido.");
		}
		return this._value as T;
	}

	public get error(): ErrorDetails {
		if (this.isSuccess) {
			throw new Error(
				"No se pueden obtener los detalles de error de un resultado exitoso.",
			);
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
		metadata?: Record<string, unknown>,
	): Result<U>;
	public static failure<U = void>(
		errorOrCode: ErrorDetails | string,
		message?: string,
		metadata?: Record<string, unknown>,
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
