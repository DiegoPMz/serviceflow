import type { ActivityMetadata, ActivityType } from "./activity.model";

export interface ActivityReadModelData {
	id: string;
	type: ActivityType;
	actorNameSnapshot: string;
	entityLabel: string;
	metadata: ActivityMetadata | null;
	createdAt: Date;
}

/**
 * Representación de una actividad lista para mostrarse en la línea de tiempo.
 * Conserva la información descriptiva del momento en que ocurrió el evento.
 */
export class ActivityReadModel {
	private constructor(
		public readonly id: string,
		public readonly type: ActivityType,
		public readonly actorName: string,
		public readonly entityLabel: string,
		public readonly metadata: ActivityMetadata | null,
		public readonly occurredAt: string,
	) {}

	public static create(data: ActivityReadModelData): ActivityReadModel {
		return new ActivityReadModel(
			data.id,
			data.type,
			data.actorNameSnapshot,
			data.entityLabel,
			data.metadata,
			data.createdAt.toISOString(),
		);
	}
}
