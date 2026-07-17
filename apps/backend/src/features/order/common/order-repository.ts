import type { Order } from "./order.model";

export interface OrderRepository {
	save: (model: Order) => Promise<void>;
}
