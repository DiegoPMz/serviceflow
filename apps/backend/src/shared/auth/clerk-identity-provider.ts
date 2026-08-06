import { ErrorDetails, ErrorDetailsException } from "../result";
import { AuthErrors } from "./auth.errors";
import type {
	AuthUserDetails,
	UserIdentityProvider,
} from "./user-identity-provider";

export interface ClerkUser {
	id: string;
	first_name: string | null;
	last_name: string | null;
	image_url: string;
	primary_email_address_id?: string | null;
	public_metadata?: Record<string, unknown>;
	email_addresses: Array<{
		id: string;
		email_address: string;
	}>;
	external_accounts: Array<{
		provider: string;
		provider_user_id: string;
	}>;
}

export interface ClerkIdentityProviderConfig {
	secretKey: string;
	baseUrl?: string;
}

export const createClerkIdentityProvider = (
	config: ClerkIdentityProviderConfig,
): UserIdentityProvider => {
	const baseUrl = config.baseUrl ?? "https://api.clerk.com/v1";

	const defaultHeaders = {
		Authorization: `Bearer ${config.secretKey}`,
		"Content-Type": "application/json",
	};

	return {
		getUserDetails: async (externalId: string): Promise<AuthUserDetails> => {
			let response: Response;

			try {
				response = await fetch(`${baseUrl}/users/${externalId}`, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${config.secretKey}`,
						"Content-Type": "application/json",
					},
				});
			} catch (fetchError: unknown) {
				throw ErrorDetailsException.of(
					AuthErrors.SERVICE_UNAVAILABLE,
					fetchError,
				);
			}

			if (!response.ok) {
				throw ErrorDetailsException.of(
					new ErrorDetails(
						"CLERK_API_ERROR",
						"El proveedor de identidad devolvió un error.",
						502,
					),
					response,
				);
			}

			const {
				first_name,
				last_name,
				primary_email_address_id,
				email_addresses,
				image_url,
			}: ClerkUser = await response.json();

			const emailAddress =
				email_addresses?.find(
					(email: { id: string }) => email.id === primary_email_address_id,
				)?.email_address ?? email_addresses?.[0]?.email_address;

			if (!emailAddress || !first_name) {
				throw ErrorDetailsException.of(AuthErrors.INCOMPLETE_USER_PROFILE);
			}

			return {
				firstName: first_name,
				lastName: last_name ?? undefined,
				emailAddress,
				imageUrl: image_url,
			};
		},

		updatePublicMetadata: async (
			externalId: string,
			metadata: Record<string, unknown>,
		): Promise<void> => {
			let response: Response;

			try {
				response = await fetch(`${baseUrl}/users/${externalId}`, {
					method: "PATCH",
					headers: defaultHeaders,
					body: JSON.stringify({
						public_metadata: metadata,
					}),
				});
			} catch (fetchError: unknown) {
				throw ErrorDetailsException.of(
					AuthErrors.SERVICE_UNAVAILABLE,
					fetchError,
				);
			}

			if (!response.ok) {
				throw ErrorDetailsException.of(
					new ErrorDetails(
						"CLERK_API_ERROR",
						`Failed to update Clerk user metadata [${response.status}]: ${response.statusText}`,
						502,
					),
					response,
				);
			}
		},
	};
};
