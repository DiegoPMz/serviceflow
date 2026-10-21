import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchInput } from "@/shared/components/search-input";
import { Field, FieldGroup } from "@/shared/components/ui/field";
import { type OrderTypes, SelectOrderStatus } from "./select-order-status";

export function SearchOrdersForm() {
	const { search: urlSearch, status } = useSearch({
		from: "/_authenticated/workspace/$workspaceId/",
	});

	const navigate = useNavigate({ from: "/workspace/$workspaceId/" });

	const form = useForm({
		asyncAlways: true,
		defaultValues: { search: urlSearch ?? "", status: status ?? "" },
	});

	function handleChange(values: { search: string; status: string }) {
		const searchValue = values.search.trim() || undefined;

		const statusValue = values.status
			? (values.status.trim().toLowerCase() as Lowercase<OrderTypes>)
			: undefined;

		navigate({
			replace: true,
			search: (prev) => ({
				...prev,
				search: searchValue,
				status: statusValue,
				page: 1,
			}),
		});
	}

	return (
		<form
			className="mt-4"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			<FieldGroup className="flex  flex-col gap-2 sm:flex-row">
				<form.Field
					listeners={{
						onChangeDebounceMs: 600,
						onChange: ({ fieldApi }) => {
							handleChange(fieldApi.form.state.values);
						},
					}}
					name="search"
				>
					{(field) => (
						<Field className="min-w-0 flex-1">
							<SearchInput
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
						</Field>
					)}
				</form.Field>

				<form.Field
					listeners={{
						onChangeDebounceMs: 400,
						onChange: ({ fieldApi }) => {
							handleChange(fieldApi.form.state.values);
						},
					}}
					name="status"
				>
					{(field) => (
						<Field className="w-full sm:w-40">
							<SelectOrderStatus
								value={(field.state.value as OrderTypes) ?? ""}
								name={field.name}
								onChange={(value) => field.handleChange(value as OrderTypes)}
							/>
						</Field>
					)}
				</form.Field>
			</FieldGroup>
		</form>
	);
}
