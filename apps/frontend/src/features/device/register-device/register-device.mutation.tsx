import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type RegisterDeviceUseCaseInput,
	registerDevice,
} from "./register-device.use-case";

export function useRegisterDevice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: RegisterDeviceUseCaseInput) =>
			registerDevice(variables),

		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["devices"],
			});

			toast.success("Dispositivo registrado");
		},
	});
}
