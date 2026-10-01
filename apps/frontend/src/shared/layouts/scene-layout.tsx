interface SceneLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export function SceneLayout({ children, className = "" }: SceneLayoutProps) {
	return (
		<div
			className={`relative min-h-screen overflow-hidden bg-background font-body text-foreground antialiased ${className}`}
		>
			{/* Círculo superior izquierdo */}
			<div
				className="pointer-events-none absolute -left-28 -top-28 size-110 rounded-full bg-primary/10 blur-3xl opacity-70"
				style={{ animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite" }}
			/>
			{/* Círculo intermedio derecho */}
			<div
				className="pointer-events-none absolute right-0 top-1/3 size-90 rounded-full bg-success/5 blur-3xl opacity-70"
				style={{
					animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite",
					animationDelay: "-7s",
				}}
			/>

			{children}
		</div>
	);
}
