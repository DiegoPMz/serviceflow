import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./main.css";
import { clerkConfig } from "./shared/config/env";

// biome-ignore lint/style/noNonNullAssertion: <>
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<ClerkProvider
				appearance={{
					theme: shadcn,
				}}
				publishableKey={clerkConfig.publishableKey}
			>
				<App />
			</ClerkProvider>
		</StrictMode>,
	);
}
