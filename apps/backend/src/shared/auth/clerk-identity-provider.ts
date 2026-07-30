import { clerkConfig } from "../config";
import { ErrorDetails } from "../result";
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
	email_addresses: Array<{
		id: string;
		email_address: string;
	}>;
	external_accounts: Array<{
		provider: string;
		provider_user_id: string;
	}>;
}

export const clerkIdentityProvider: UserIdentityProvider = {
	getUserDetails: async (externalId: string): Promise<AuthUserDetails> => {
		let response: Response;

		try {
			response = await fetch(`https://api.clerk.com/v1/users/${externalId}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${clerkConfig.secretKey}`,
					"Content-Type": "application/json",
				},
			});
		} catch (fetchError: unknown) {
			throw AuthErrors.SERVICE_UNAVAILABLE.toException(fetchError);
		}

		if (!response.ok) {
			throw new ErrorDetails(
				"CLERK_API_ERROR",
				"El proveedor de identidad devolvió un error.",
				502,
			).toException();
		}

		const { first_name, last_name, email_addresses, image_url }: ClerkUser =
			await response.json();

		const email_address = email_addresses[0]?.email_address;

		if (!email_address || !first_name) {
			throw AuthErrors.INCOMPLETE_USER_PROFILE.toException();
		}

		return {
			firstName: first_name,
			lastName: last_name ?? undefined,
			emailAddress: email_address,
			imageUrl: image_url,
		};
	},
};
