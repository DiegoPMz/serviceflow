export class Cursor {
	static encode<T extends object>(value: T): string {
		return Buffer.from(JSON.stringify(value)).toString("base64");
	}

	static decode<T>(value: string): T | null {
		try {
			return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
		} catch {
			return null;
		}
	}
}
