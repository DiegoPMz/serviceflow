import { useCallback, useEffect, useState } from "react";

const COPY_FEEDBACK_DURATION_MS = 3000;

type CopyState = "idle" | "copied" | "error";

export function useCopyToClipboard() {
	const [copyState, setCopyState] = useState<CopyState>("idle");

	const copy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopyState("copied");
		} catch {
			setCopyState("error");
		}
	}, []);

	useEffect(() => {
		if (copyState === "idle") return;

		const timer = setTimeout(() => {
			setCopyState("idle");
		}, COPY_FEEDBACK_DURATION_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [copyState]);

	return { copyState, copy };
}
