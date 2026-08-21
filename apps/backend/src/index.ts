import cors from "@elysia/cors";
import openapi from "@elysia/openapi";
import Elysia from "elysia";
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
import {
	cloudflareR2StorageService,
	s3Client,
} from "./shared/object-storage/cloudflare-r2-storage-service";

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

const storageService = cloudflareR2StorageService(s3Client, {
	bucketName: r2StorageConfig.bucketName,
	publicDomain: r2StorageConfig.publicDomain,
});

const mailService = createResendMailService({
	resendClient: new Resend(resendConfig.apiKey),
	fromDomain: resendConfig.fromDomain,
	appName: "TecnoFix",
});

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
		userRoutes(auth, {
			userRepository,
			workspaceAuthorization,
		}),
	)
	.use(
		workspaceRoutes(auth, {
			storageService,
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
		orderRoutes(auth, {
			orderRepository,
			clientRepository,
			deviceRepository,
			workspaceRepository,
			userRepository,
			pdfGenerator: PdfMakeOrderPdfGenerator,
			storageService,
			workspaceAuthorization,
		}),
	)
	.listen(3000);

console.log(`🦊 Elysia esta corriendo en http://localhost:3000`);
