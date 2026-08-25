import type { Server } from "elysia/universal";
import type {
	PublishMessageInput,
	RealtimePublisher,
} from "./realtime-publisher";

export class BunWebSocketAdapter implements RealtimePublisher {
	constructor(private readonly getServer: () => Server | undefined) {}

	public async publish<TData>({
		topic,
		event,
		data,
	}: PublishMessageInput<TData>): Promise<void> {
		const server = this.getServer();

		if (!server) {
			console.warn(
				"[WebSocket] Intentando publicar sin instancia de servidor activa.",
			);
			return;
		}

		server.publish(
			topic,
			JSON.stringify({
				event,
				data,
			}),
		);
	}
}
