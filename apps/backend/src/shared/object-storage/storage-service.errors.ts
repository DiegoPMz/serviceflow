import { ErrorDetails } from "../result";

export const storageErrors = {
	INVALID_FILE_TYPE: new ErrorDetails(
		"INVALID_FILE_TYPE",
		"El tipo de archivo proporcionado no es permitido. Solo se aceptan JPG y PNG.",
	),
};
