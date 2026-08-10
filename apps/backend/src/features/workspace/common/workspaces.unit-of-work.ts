import type { Transactional } from "@serviceflow/backend/shared/database";
import type { WorkspaceInvitationRepository } from "./workspace-invitation-repository";
import type { WorkspaceMemberRepository } from "./workspace-member.repository";

export interface WorkspacesRepositories {
	invitations: WorkspaceInvitationRepository;
	members: WorkspaceMemberRepository;
}

export interface WorkspacesUnitOfWork
	extends Transactional<WorkspacesRepositories> {}
