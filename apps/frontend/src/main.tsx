/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./main.css";
import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { clerkConfig } from "./shared/config/env";

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
