type ImageExtension = "jpg" | "jpeg" | "png";

type StorageKeys = {
	workspaceLogo: (workspaceId: string, extension: ImageExtension) => string;
	orderDocument: (workspaceId: string, orderId: string) => string;
};

export const storageKeys = {
	workspaceLogo: (workspaceId, extension) => {
		const timestamp = Date.now();
		return `workspaces/${workspaceId}/logo-${timestamp}.${extension}`;
	},

	orderDocument: (workspaceId, orderId) =>
		`workspaces/${workspaceId}/orders/${orderId}/document.pdf`,
} satisfies StorageKeys;
