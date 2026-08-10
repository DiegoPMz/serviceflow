import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { JSX } from "react";

interface WorkspaceInvitationEmailProps {
	workspaceName: string;
	inviterEmail: string;
	role: string;
	acceptUrl: string;
	appName: string;
}

const tokens = {
	canvas: "#ffffff",
	surfaceSoft: "#f8f9fa",
	surfaceCard: "#f5f5f5",
	surfaceDark: "#101010",
	hairline: "#e5e7eb",
	ink: "#111111",
	body: "#374151",
	mutedSoft: "#898989",
	onDark: "#ffffff",
	onDarkSoft: "#a1a1aa",
	readyBg: "#ecfdf5",
	ready: "#047857",
};

export function WorkspaceInvitationEmail({
	workspaceName,
	inviterEmail,
	role,
	acceptUrl,
	appName = "ServiceFlow",
}: WorkspaceInvitationEmailProps): JSX.Element {
	const previewText = `Has sido invitado a unirte a ${workspaceName} en ${appName}`;

	return (
		<Html lang="es">
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								canvas: tokens.canvas,
								"surface-soft": tokens.surfaceSoft,
								"surface-card": tokens.surfaceCard,
								"surface-dark": tokens.surfaceDark,
								hairline: tokens.hairline,
								ink: tokens.ink,
								body: tokens.body,
								"muted-soft": tokens.mutedSoft,
								"on-dark": tokens.onDark,
								"on-dark-soft": tokens.onDarkSoft,
								"ready-bg": tokens.readyBg,
								ready: tokens.ready,
							},
							fontFamily: {
								sans: [
									"Inter",
									"ui-sans-serif",
									"system-ui",
									"-apple-system",
									"Segoe UI",
									"Roboto",
									"Helvetica",
									"Arial",
									"sans-serif",
								],
							},
						},
					},
				}}
			>
				<Body className="m-0 bg-surface-soft py-10 font-sans">
					<Container className="mx-auto w-full max-w-[560px] px-3">
						{/* Brand */}
						<Section className="px-2 pb-5">
							<Row>
								<Column>
									<Text className="m-0 text-[15px] font-semibold tracking-tight text-ink">
										{appName}
									</Text>
								</Column>
							</Row>
						</Section>

						{/* Card */}
						<Section className="rounded-[16px] border border-solid border-hairline bg-canvas">
							{/* Header */}
							<Section className="px-8 pt-8">
								<Section className="mb-5 inline-block rounded-full bg-ready-bg px-3 py-1.5">
									<Text className="m-0 text-[13px] font-medium leading-none text-ready">
										● Invitación de acceso
									</Text>
								</Section>

								<Heading
									as="h1"
									className="m-0 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink"
								>
									Únete a {workspaceName}
								</Heading>
								<Text className="mb-0 mt-3 text-[15px] leading-[1.6] text-body">
									<strong>{inviterEmail}</strong> te ha invitado a colaborar en
									su espacio de trabajo. Al unirte, tendrás acceso a los
									recursos y proyectos compartidos del equipo.
								</Text>
							</Section>

							{/* Workspace summary */}
							<Section className="px-8 pt-7">
								<Section className="rounded-[12px] border border-solid border-hairline bg-surface-soft px-5 py-5">
									<Row>
										<Column>
											<Text className="m-0 text-[13px] font-medium text-muted-soft">
												Espacio de Trabajo
											</Text>
											<Text className="m-0 mt-1 text-[15px] font-semibold text-ink">
												{workspaceName}
											</Text>
										</Column>
										<Column align="right">
											<Text className="m-0 text-[13px] font-medium text-muted-soft">
												Rol asignado
											</Text>
											<Text className="m-0 mt-1 font-mono text-[14px] font-semibold uppercase text-ink">
												{role}
											</Text>
										</Column>
									</Row>
								</Section>
							</Section>

							{/* CTA */}
							<Section className="px-8 pb-8 pt-8 text-center">
								<Button
									href={acceptUrl}
									className="box-border w-full rounded-[10px] bg-ink px-6 py-3.5 text-center text-[15px] font-semibold text-on-dark"
								>
									Aceptar Invitación
								</Button>
								<Text className="m-0 mt-4 text-[13px] text-muted-soft">
									Este enlace es único y seguro. No lo compartas con nadie.
								</Text>
							</Section>
						</Section>

						{/* Footer */}
						<Section className="px-8 pt-6 text-center">
							<Text className="m-0 text-[13px] leading-[1.6] text-muted-soft">
								Recibes este correo porque alguien te ha invitado a unirte a un
								equipo en {appName}.
							</Text>
							<Text className="m-0 mt-2 text-[13px] leading-[1.6] text-muted-soft">
								Si no esperabas esta invitación, puedes ignorar este correo de
								forma segura.
							</Text>
							<Text className="m-0 mt-4 text-[12px] font-medium text-muted-soft">
								{appName} · Seguridad y Accesos
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

WorkspaceInvitationEmail.PreviewProps = {
	workspaceName: "Acme Corp Developers",
	inviterEmail: "admin@acmecorp.com",
	role: "MEMBER",
	acceptUrl: "https://serviceflow.app/invitations/accept?token=tkn_123456789",
	appName: "ServiceFlow",
} as WorkspaceInvitationEmailProps;

export default WorkspaceInvitationEmail;
