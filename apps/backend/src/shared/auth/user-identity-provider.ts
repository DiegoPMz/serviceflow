export interface AuthUserDetails {
	firstName: string;
	lastName?: string;
	imageUrl: string;
	emailAddress: string;
}

export interface UserIdentityProvider {
	getUserDetails(externalId: string): Promise<AuthUserDetails>;
	updatePublicMetadata(
		externalId: string,
		metadata: Record<string, unknown>,
	): Promise<void>;
}
