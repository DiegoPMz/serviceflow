import { Result } from "@serviceflow/backend/shared/result";
import { Workspace, WorkspaceCompany } from "./common/workspace.model";
import type { WorkspaceRepository } from "./common/workspace-repository";

interface CreateWorkspaceCommand {
	userId: string;
	workspaceName: string;
	companyDetails: {
		name: string;
		phone: string;
		email: string;
		address: string;
	};
}

interface createWorkspaceProps {
	command: CreateWorkspaceCommand;
	repository: WorkspaceRepository;
}

export async function createWorkspace({
	command: { companyDetails, userId, workspaceName },
	repository,
}: createWorkspaceProps): Promise<Result<{ workspaceId: string }>> {
	const company = WorkspaceCompany.create({
		name: companyDetails.name,
		email: companyDetails.email,
		address: companyDetails.address,
		phone: companyDetails.phone,
	});

	if (company.error) {
		return Result.failure(company.error);
	}

	const { isFailure, error, value } = Workspace.create({
		name: workspaceName,
		ownerId: userId,
		workspaceCompany: company.value,
	});

	if (isFailure) return Result.failure(error);

	await repository.save(value);

	return Result.success({ workspaceId: value.id });
}
