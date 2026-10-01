import { S3Client } from "@aws-sdk/client-s3";
import { r2Config } from "../config";

export const s3Client = new S3Client({
	region: "auto",
	endpoint: r2Config.endpoint,
	credentials: {
		accessKeyId: r2Config.accessKeyId,
		secretAccessKey: r2Config.secretAccessKey,
	},
});
