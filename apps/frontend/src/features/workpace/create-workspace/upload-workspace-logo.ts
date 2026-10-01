export interface UploadWorkspaceLogoResult {
	ok: boolean;
	status: number;
}

interface UploadWorkspaceLogoInput {
	logo: File;
	url: string;
}

export async function uploadWorkspaceLogo({
	logo,
	url,
}: UploadWorkspaceLogoInput): Promise<UploadWorkspaceLogoResult> {
	try {
		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": logo.type,
			},
			body: logo,
		});

		return {
			ok: response.ok,
			status: response.status,
		};
	} catch (error) {
		console.error("Workspace logo upload request failed", error);

		return {
			ok: false,
			status: 0,
		};
	}
}

export function getFileExtension(file: File): "jpeg" | "png" {
	switch (file.type) {
		case "image/jpeg":
			return "jpeg";

		case "image/png":
			return "png";

		default:
			throw new Error(`Unsupported image type: ${file.type}`);
	}
}
