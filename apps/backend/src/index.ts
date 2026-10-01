import cors from "@elysia/cors";
import openapi from "@elysia/openapi";
import Elysia from "elysia";
import type { Server } from "elysia/universal";
import { Resend } from "resend";
import { clientRoutes } from "./features/client";
import { clientDrizzleRepository } from "./features/client/common/client-drizzle-repository";
import { deviceRoutes } from "./features/device";
import { deviceDrizzleRepository } from "./features/device/common/device-drizzle-repository";
import { orderRoutes } from "./features/order";
import { OrderDrizzleRepository } from "./features/order/common/order-drizzle-repository";
import { PdfMakeOrderPdfGenerator } from "./features/order/common/pdfMake-pdf-generator";
import { userRoutes } from "./features/user";
import { userDrizzleRepository } from "./features/user/common/user-drizzle-repository";
import { userSyncServiceImp } from "./features/user/user-sync.service.impl";
import { workspaceRoutes } from "./features/workspace";
import { createResendMailService } from "./features/workspace/common/resend-mail.service";
import { workspaceAuthorization as workspaceAuthorizationFactory } from "./features/workspace/common/workspace-authorization";
import { workspaceMemberDrizzleRepository } from "./features/workspace/common/workspace-drizzle-member-repository";
import { workspaceDrizzleRepository } from "./features/workspace/common/workspace-drizzle-repository";
import { workspaceInvitationDrizzleRepository } from "./features/workspace/common/workspace-invitation-drizzle-repository";
import { createDrizzleWorkspacesUnitOfWork } from "./features/workspace/common/workspaces-drizzle.unit-of-work";
import { createClerkIdentityProvider } from "./shared/auth/clerk-identity-provider";
import { clerkTokenVerifier } from "./shared/auth/clerk-token-verifier";
import {
    appConfig,
    clerkConfig,
    r2StorageConfig,
    resendConfig,
} from "./shared/config";
import { db } from "./shared/database/client";
import { createAuthPlugin } from "./shared/http/auth-plugin";
import { errorPlugin } from "./shared/http/error-handler-plugin";
import { createR2PrivateDocumentStorage } from "./shared/object-storage/cloudflare-r2-private-document-storage";
import { createR2PublicAssetStorage } from "./shared/object-storage/cloudflare-r2-public-asset-storage";
import { s3Client } from "./shared/object-storage/s3-client";
import { BunWebSocketAdapter } from "./shared/realtime/bun-websocket";
import { realtimeRouter } from "./shared/realtime/realtime.routes";

const userRepository = userDrizzleRepository(db);

const auth = createAuthPlugin({
	tokenVerifier: clerkTokenVerifier,
	userSyncService: userSyncServiceImp({
		userRepository,
		userIdentityProvider: createClerkIdentityProvider({
			secretKey: clerkConfig.secretKey,
		}),
	}),
});

const clientRepository = clientDrizzleRepository(db);
const deviceRepository = deviceDrizzleRepository(db);
const orderRepository = OrderDrizzleRepository(db);
const workspaceRepository = workspaceDrizzleRepository(db);
const memberRepository = workspaceMemberDrizzleRepository(db);
const workspaceInvitationRepository = workspaceInvitationDrizzleRepository(db);
const unitOfWork = createDrizzleWorkspacesUnitOfWork(db);
const workspaceAuthorization = workspaceAuthorizationFactory({
	membersRepository: memberRepository,
});

const publicAssetStorage = createR2PublicAssetStorage(s3Client, {
	bucketName: r2StorageConfig.publicBucketName,
	publicDomain: r2StorageConfig.publicDomain,
});

const privateDocumentStorage = createR2PrivateDocumentStorage(s3Client, {
	bucketName: r2StorageConfig.privateBucketName,
});

const mailService = createResendMailService({
	resendClient: new Resend(resendConfig.apiKey),
	fromDomain: resendConfig.fromDomain,
	appName: "TecnoFix",
});

let serverInstance: Server | undefined;

const realtimePublisher = new BunWebSocketAdapter(() => serverInstance);

export const app = new Elysia()
	.use(openapi())
	.use(
		cors({
			origin: appConfig.url,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
	.use(errorPlugin)
	.use(
		realtimeRouter(auth, {
			workspaceAuthorization,
		}),
	)
	.use(
		userRoutes(auth, {
			userRepository,
			memberRepository,
			workspaceAuthorization,
		}),
	)
	.use(
		workspaceRoutes(auth, {
			publicAssetStorage,
			mailService,
			workspaceRepository,
			workspaceInvitationRepository,
			memberRepository,
			workspaceAuthorization,
			unitOfWork,
			userRepository,
			appUrl: appConfig.url,
			db,
		}),
	)
	.use(
		clientRoutes(auth, {
			clientRepository,
			workspaceAuthorization,
		}),
	)
	.use(
		deviceRoutes(auth, {
			deviceRepository,
			workspaceAuthorization,
		}),
	)
	.use(
		orderRoutes(
			auth,
			{
				orderRepository,
				clientRepository,
				deviceRepository,
				workspaceRepository,
				userRepository,
				pdfGenerator: PdfMakeOrderPdfGenerator,
				publicAssetStorage,
				privateDocumentStorage,
				workspaceAuthorization,
			},
			realtimePublisher,
		),
	);

// biome-ignore lint/style/noNonNullAssertion: <>
serverInstance = app.listen(appConfig.appPort).server!;

export type App = typeof app;

console.log(
	`🦊 Elysia esta corriendo en http://localhost:${appConfig.appPort}`,
);
