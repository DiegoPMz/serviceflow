export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("No se pudo leer el archivo seleccionado."));
		};

		reader.onerror = () => {
			reject(
				reader.error ?? new Error("No se pudo leer el archivo seleccionado."),
			);
		};

		reader.readAsDataURL(file);
	});
}
