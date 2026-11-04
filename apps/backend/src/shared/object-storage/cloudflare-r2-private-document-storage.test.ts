import { describe, expect, test } from "bun:test";
import { S3Client } from "@aws-sdk/client-s3";
import { createR2PrivateDocumentStorage } from "./cloudflare-r2-private-document-storage";

const createStorage = () =>
	createR2PrivateDocumentStorage(
		new S3Client({
			region: "auto",
			endpoint: "https://r2.example.com",
			credentials: {
				accessKeyId: "test-access-key",
				secretAccessKey: "test-secret-key",
			},
		}),
		{ bucketName: "test-bucket" },
	);

const signedUrlParams = async (values: {
	key: string;
	fileName: string;
	expiresIn?: number;
}) => {
	const url = await createStorage().createSignedDownloadUrl(values);
	return new URL(url).searchParams;
};

describe("createR2PrivateDocumentStorage - createSignedDownloadUrl", () => {
	test("should sign an attachment download with the given file name", async () => {
		const params = await signedUrlParams({
			key: "workspaces/ws-1/orders/order-1/document.pdf",
			fileName: "TECFIX-001.pdf",
		});

		expect(params.get("response-content-disposition")).toBe(
			'attachment; filename="TECFIX-001.pdf"',
		);
	});

	test("should force the pdf content type on the download", async () => {
		const params = await signedUrlParams({
			key: "workspaces/ws-1/orders/order-1/document.pdf",
			fileName: "TECFIX-001.pdf",
		});

		expect(params.get("response-content-type")).toBe("application/pdf");
	});

	test("should use the default expiration of 300 seconds", async () => {
		const params = await signedUrlParams({
			key: "workspaces/ws-1/orders/order-1/document.pdf",
			fileName: "TECFIX-001.pdf",
		});

		expect(params.get("X-Amz-Expires")).toBe("300");
	});

	test("should honor a custom expiration", async () => {
		const params = await signedUrlParams({
			key: "workspaces/ws-1/orders/order-1/document.pdf",
			fileName: "TECFIX-001.pdf",
			expiresIn: 60,
		});

		expect(params.get("X-Amz-Expires")).toBe("60");
	});
});
