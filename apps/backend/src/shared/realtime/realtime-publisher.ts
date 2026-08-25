export type RealtimeEventType =
	| "ORDER_CREATED"
	| "ORDER_UPDATED"
	| "STATUS_CHANGED";

export interface PublishMessageInput<TData = unknown> {
	topic: string;
	event: RealtimeEventType;
	data: TData;
}

export interface RealtimePublisher {
	publish<TData>(input: PublishMessageInput<TData>): Promise<void>;
}
