import type { WorkspaceCompany } from "../../workspace/common/workspace.model";
import type { Order } from "./order.model";

export interface PdfGeneratorImages {
	deviceImageBase64: string;
	signatureImageBase64: string;
	companyLogoImageBase64?: string;
}

export interface PdfGenerator {
	generate(
		order: Order,
		company: WorkspaceCompany,
		images: PdfGeneratorImages,
	): Promise<Uint8Array>;
}
