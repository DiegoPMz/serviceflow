import pdfmake from "pdfmake";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { WorkspaceCompany } from "../../workspace/common/workspace.model";
import type { Order, OrderComponentType } from "./order.model";
import type { PdfGenerator, PdfGeneratorImages } from "./pdf-generator";

const fonts = {
	Helvetica: {
		normal: "Helvetica",
		bold: "Helvetica-Bold",
		italics: "Helvetica-Oblique",
		bolditalics: "Helvetica-BoldOblique",
	},
};

pdfmake.addFonts(fonts);

export const PdfMakeOrderPdfGenerator: PdfGenerator = {
	generate: async (
		order: Order,
		company: WorkspaceCompany,
		images: PdfGeneratorImages,
	): Promise<Uint8Array> => {
		// ==========================================
		// 1. PREPARAR IMÁGENES Y DATOS
		// ==========================================
		const logoBase64 = images.companyLogoImageBase64 ?? null;
		const deviceImageBase64 = images.deviceImageBase64;
		const signatureBase64 = images.signatureImageBase64;

		const createdDate =
			order.createdAt instanceof Date
				? order.createdAt
				: new Date(order.createdAt);
		const formattedDate = `${createdDate.getDate()}/${
			createdDate.getMonth() + 1
		}/${createdDate.getFullYear()}`;

		// Agrupar supplies por tipo
		const suppliesGroup =
			order.orderComponents?.filter((c) => c.type === "supply") || [];
		const replacementGroup =
			order.orderComponents?.filter((c) => c.type === "replacement_part") || [];
		const othersGroup =
			order.orderComponents?.filter((c) => c.type === "other") || [];

		const buildSupplyRows = (
			title: string,
			items: OrderComponentType[],
		): pdfmake.TableCell[][] => {
			if (items.length === 0) return [];
			return [
				[
					{
						text: title,
						style: "groupTitle",
						colSpan: 2,
						margin: [0, 4, 0, 2],
					},
					{},
				],
				...items.map((item) => [
					{ text: item.componentNameSnapshot, style: "tableItem" },
					{
						text: String(item.quantity),
						style: "tableItem",
						alignment: "center" as const,
					},
				]),
			];
		};

		const createBanner = (title: string): Content => ({
			table: {
				widths: ["*"],
				body: [
					[
						{
							text: title.toUpperCase(),
							fillColor: "#008CFF",
							color: "#FFFFFF",
							bold: true,
							fontSize: 9.5,
							border: [false, false, false, false],
							margin: [6, 3, 6, 3],
						},
					],
				],
			},
			margin: [0, 10, 0, 8],
		});

		// ==========================================
		// 2. DEFINICIÓN DEL DOCUMENTO (DOC DEFINITION)
		// ==========================================
		const docDefinition: TDocumentDefinitions = {
			pageSize: "A4",
			pageMargins: [40, 40, 40, 40],
			defaultStyle: {
				font: "Helvetica",
				fontSize: 9,
				color: "#1A1A1A",
			},
			content: [
				// ------------------------------------------
				// ENCABEZADO (Logo Opcional | Info | Folio)
				// ------------------------------------------
				{
					columns: [
						...(logoBase64
							? [
									{
										width: 120 as const,
										stack: [
											{
												image: logoBase64,
												width: 120,
												alignment: "center" as const,
											},
										],
									},
								]
							: []),

						// Columna 2: Info de la Empresa
						{
							width: "*",
							// Si no hay logo, quitamos el margen izquierdo para que se alinee bien
							margin: [logoBase64 ? 10 : 0, 0, 10, 0],
							stack: [
								{
									text: "ORDEN DE SERVICIO",
									fontSize: 16,
									bold: true,
									margin: [0, 0, 0, 4],
								},
								{
									table: {
										widths: ["*"],
										body: [
											[
												{
													text: company.name,
													fillColor: "#008CFF",
													color: "#FFFFFF",
													bold: true,
													fontSize: 9.5,
													border: [false, false, false, false],
													margin: [4, 2, 4, 2],
												},
											],
										],
									},
									margin: [0, 0, 0, 4],
								},
								{ text: company.address, color: "#666666", fontSize: 8 },
								{
									text: `Tel: ${company.phone} | ${company.email}`,
									color: "#666666",
									fontSize: 8,
									marginTop: 5,
								},
							],
						},

						// Columna 3: Fecha y Folio
						{
							width: 110,
							stack: [
								// Cuadro Fecha
								{
									table: {
										widths: ["*"],
										body: [
											[
												{
													text: "FECHA",
													fillColor: "#008CFF",
													color: "#FFFFFF",
													bold: true,
													alignment: "center",
													border: [false, false, false, false],
												},
											],
											[
												{
													text: formattedDate,
													bold: true,
													alignment: "center",
													margin: [0, 2, 0, 2],
												},
											],
										],
									},
									margin: [0, 0, 0, 6],
								},
								// Cuadro Folio
								{
									table: {
										widths: ["*"],
										body: [
											[
												{
													text: "FOLIO",
													fillColor: "#008CFF",
													color: "#FFFFFF",
													bold: true,
													alignment: "center",
													border: [false, false, false, false],
												},
											],
											[
												{
													text: order.folio,
													bold: true,
													alignment: "center",
													margin: [0, 2, 0, 2],
												},
											],
										],
									},
								},
							],
						},
					],
				},

				// ------------------------------------------
				// DATOS DEL CLIENTE Y EQUIPO
				// ------------------------------------------
				createBanner("Datos del Cliente y Equipo"),
				{
					columns: [
						// Cliente
						{
							width: "50%",
							stack: [
								{
									text: [
										{ text: "Nombre contacto: ", bold: true },
										order.clientNameSnapshot,
									],
								},
								{
									text: [
										{ text: "Email Cliente: ", bold: true },
										order.clientEmailSnapshot,
									],
									margin: [0, 5, 0, 0],
								},
								{
									text: [
										{ text: "Teléfono: ", bold: true },
										order.clientPhoneSnapshot,
									],
									margin: [0, 5, 0, 0],
								},
								{
									text: [
										{ text: "Técnico Asignado: ", bold: true },
										order.userNameSnapshot,
									],
									margin: [0, 5, 0, 0],
								},
							],
						},
						// Equipo
						{
							width: "50%",
							stack: [
								{
									text: [
										{ text: "Marca del Equipo: ", bold: true },
										order.deviceBrandSnapshot,
									],
								},
								{
									text: [
										{ text: "Modelo: ", bold: true },
										order.deviceModelSnapshot,
									],
									margin: [0, 5, 0, 0],
								},
								{
									text: [
										{ text: "Número de Serie: ", bold: true },
										order.deviceSerialNumberSnapshot,
									],
									margin: [0, 5, 0, 0],
								},
							],
						},
					],
					margin: [5, 0, 5, 0],
				},

				// ------------------------------------------
				// DETALLES DEL SERVICIO (TABLA)
				// ------------------------------------------
				createBanner("Detalles del Servicio"),

				{
					table: {
						headerRows: 1,
						widths: ["*", 100],
						body: [
							[
								{ text: "Descripción", bold: true, color: "#008CFF" },
								{
									text: "Cantidad",
									bold: true,
									color: "#008CFF",
									alignment: "center",
								},
							],
							// Filas agrupadas automáticamente
							...buildSupplyRows("CONSUMIBLES", suppliesGroup),
							...buildSupplyRows("PIEZAS DE REEMPLAZO", replacementGroup),
							...buildSupplyRows("OTROS", othersGroup),
						],
					},
					layout: {
						hLineWidth: (i, node) => (i === 1 ? 1.5 : 0.5),
						vLineWidth: () => 0,
						hLineColor: (i) => (i === 1 ? "#008CFF" : "#E0E0E0"),
					},
					margin: [5, 0, 5, 0],
				},

				// ------------------------------------------
				// IMAGÉN DEL DISPOSITIVO
				// ------------------------------------------
				createBanner("Imagen del Dispositivo"),
				{
					table: {
						widths: ["*"],
						body: [
							[
								{
									fillColor: "#F5F5F5",
									borderColor: ["#008CFF", "#008CFF", "#008CFF", "#008CFF"],
									stack: [
										{
											image: deviceImageBase64,
											width: 150,
											alignment: "center",
										},
									],
									margin: [0, 5, 0, 5],
								},
							],
						],
					},
					margin: [100, 0, 100, 0], // Centramos la caja de la imagen
				},

				// ------------------------------------------
				// OBSERVACIONES
				// ------------------------------------------
				{ text: "Observaciones:", bold: true, margin: [0, 12, 0, 4] },
				{
					table: {
						widths: ["*"],
						body: [
							[
								{
									fillColor: "#F5F5F5",
									borderColor: ["#CCCCCC", "#CCCCCC", "#CCCCCC", "#CCCCCC"],
									stack: [
										order.observations
											? { text: `${order.observations}\n\n`, fontSize: 8.5 }
											: ({} as Content),
										{
											text: "Recibimos equipo en las condiciones antes descritas para inspección, diagnóstico y cotización de servicio.",
											fontSize: 6,
											color: "#333333",
										},
									],
									margin: [4, 4, 4, 4],
								},
							],
						],
					},
				},

				// ------------------------------------------
				// FIRMA DEL CLIENTE (Se acomoda sola al final)
				// ------------------------------------------
				{
					margin: [0, 25, 0, 0],
					unbreakable: true,
					stack: [
						{
							image: signatureBase64,
							fit: [140, 80],
							alignment: "center",
						},
						{
							canvas: [
								{
									type: "line",
									x1: 150,
									y1: 5,
									x2: 370,
									y2: 5,
									lineWidth: 1,
									lineColor: "#1A1A1A",
								},
							],
						},
						{
							text: "Firma del cliente",
							bold: true,
							alignment: "center",
							margin: [0, 4, 0, 0],
						},
					],
				},
			],
			styles: {
				groupTitle: {
					fontSize: 8.5,
					bold: true,
					color: "#008CFF",
				},
				tableItem: {
					fontSize: 8.5,
				},
			},
		};

		const pdfDoc = pdfmake.createPdf(docDefinition);
		return pdfDoc.getBuffer();
	},
};
