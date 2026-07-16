import { describe, expect, test } from "bun:test";
import { DeviceErrors } from "./device.errors";
import { type ComponentType, Device, DeviceComponent } from "./device.model";

const validDeviceData = () => ({
	workspaceId: "workspace-123",
	clientId: "client-123",
	serialNumber: "SN-ABC123",
	brand: "Samsung",
	model: "Galaxy S21",
});

const validComponent = () => ({
	name: "Batería",
	partNumber: "BAT-001",
	type: "supply" as ComponentType,
});

describe("Device.create", () => {
	test("Should create a device with valid data", () => {
		const result = Device.create(validDeviceData());

		expect(result.isSuccess).toBe(true);

		const device = result.value;
		expect(device.workspaceId).toBe("workspace-123");
		expect(device.clientId).toBe("client-123");
		expect(device.serialNumber).toBe("SN-ABC123");
		expect(device.brand).toBe("Samsung");
		expect(device.model).toBe("Galaxy S21");
		expect(device.id).toBeTruthy();
		expect(device.components.length).toBe(0);
		expect(device.createdAt).toBeInstanceOf(Date);
		expect(device.updatedAt).toBeInstanceOf(Date);
		expect(device.createdAt.getTime()).toBe(device.updatedAt.getTime());
	});

	test("Should trim device fields", () => {
		const result = Device.create({
			...validDeviceData(),
			workspaceId: "  workspace-123  ",
			clientId: "  client-123  ",
			serialNumber: "  SN-ABC123  ",
			brand: "  Samsung  ",
			model: "  Galaxy S21  ",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.workspaceId).toBe("workspace-123");
		expect(result.value.clientId).toBe("client-123");
		expect(result.value.serialNumber).toBe("SN-ABC123");
		expect(result.value.brand).toBe("Samsung");
		expect(result.value.model).toBe("Galaxy S21");
	});

	test("Should fail when workspaceId is empty", () => {
		const result = Device.create({ ...validDeviceData(), workspaceId: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_WORKSPACE_ID_REQUIRED.code,
		);
	});

	test("Should fail when workspaceId is whitespace only", () => {
		const result = Device.create({ ...validDeviceData(), workspaceId: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_WORKSPACE_ID_REQUIRED.code,
		);
	});

	test("Should fail when clientId is empty", () => {
		const result = Device.create({ ...validDeviceData(), clientId: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_CLIENT_ID_REQUIRED.code);
	});

	test("Should fail when clientId is whitespace only", () => {
		const result = Device.create({ ...validDeviceData(), clientId: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_CLIENT_ID_REQUIRED.code);
	});

	test("Should fail when serialNumber is empty", () => {
		const result = Device.create({ ...validDeviceData(), serialNumber: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_SERIAL_NUMBER_REQUIRED.code,
		);
	});

	test("Should fail when serialNumber is whitespace only", () => {
		const result = Device.create({ ...validDeviceData(), serialNumber: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_SERIAL_NUMBER_REQUIRED.code,
		);
	});

	test("Should fail when serialNumber exceeds 200 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			serialNumber: "S".repeat(201),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_SERIAL_NUMBER_TOO_LONG.code,
		);
	});

	test("Should succeed when serialNumber is exactly 200 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			serialNumber: "S".repeat(200),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when brand is empty", () => {
		const result = Device.create({ ...validDeviceData(), brand: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_BRAND_REQUIRED.code);
	});

	test("Should fail when brand is whitespace only", () => {
		const result = Device.create({ ...validDeviceData(), brand: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_BRAND_REQUIRED.code);
	});

	test("Should fail when brand exceeds 50 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			brand: "a".repeat(51),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_BRAND_TOO_LONG.code);
	});

	test("Should succeed when brand is exactly 50 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			brand: "a".repeat(50),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when model is empty", () => {
		const result = Device.create({ ...validDeviceData(), model: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_MODEL_REQUIRED.code);
	});

	test("Should fail when model is whitespace only", () => {
		const result = Device.create({ ...validDeviceData(), model: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_MODEL_REQUIRED.code);
	});

	test("Should fail when model exceeds 100 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			model: "a".repeat(101),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(DeviceErrors.DEVICE_MODEL_TOO_LONG.code);
	});

	test("Should succeed when model is exactly 100 characters", () => {
		const result = Device.create({
			...validDeviceData(),
			model: "a".repeat(100),
		});
		expect(result.isSuccess).toBe(true);
	});
});

describe("Device.addComponent", () => {
	test("Should add a valid component", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent(validComponent());

		expect(result.isSuccess).toBe(true);
		expect(device.components.length).toBe(1);

		expect(device.components[0]?.name).toBe("Batería");
		expect(device.components[0]?.partNumber).toBe("BAT-001");
		expect(device.components[0]?.type).toBe("supply");
		expect(device.components[0]?.id).toBeTruthy();
		expect(device.components[0]?.createdAt).toBeInstanceOf(Date);
		expect(device.components[0]?.updatedAt).toBeInstanceOf(Date);
	});

	test("Should trim component name and partNumber", () => {
		const device = Device.create(validDeviceData()).value;

		device.addComponent({
			name: "  Batería  ",
			partNumber: "  BAT-001  ",
			type: "supply",
		});

		const component = device.components[0];
		expect(component?.name).toBe("Batería");
		expect(component?.partNumber).toBe("BAT-001");
	});

	test("Should accumulate multiple components", () => {
		const device = Device.create(validDeviceData()).value;

		device.addComponent(validComponent());
		device.addComponent({
			name: "Pantalla",
			partNumber: "SCR-001",
			type: "replacement_part",
		});

		expect(device.components.length).toBe(2);
		expect(device.components[1]?.type).toBe("replacement_part");
	});

	test("Should fail when component name is empty", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent({ ...validComponent(), name: "" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_NAME_REQUIRED.code,
		);
		expect(device.components.length).toBe(0);
	});

	test("Should fail when component partNumber is empty", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent({ ...validComponent(), partNumber: "" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_PART_NUMBER_REQUIRED.code,
		);
		expect(device.components.length).toBe(0);
	});

	test("Should fail when component type is empty", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent({
			...validComponent(),
			type: "" as ComponentType,
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_TYPE_REQUIRED.code,
		);
		expect(device.components.length).toBe(0);
	});

	test("Should fail when component name exceeds 150 characters", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent({
			...validComponent(),
			name: "a".repeat(151),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_NAME_TOO_LONG.code,
		);
	});

	test("Should fail when component partNumber exceeds 100 characters", () => {
		const device = Device.create(validDeviceData()).value;

		const result = device.addComponent({
			...validComponent(),
			partNumber: "a".repeat(101),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_PART_NUMBER_TOO_LONG.code,
		);
	});
});

describe("DeviceComponent.create", () => {
	test("Should create a component with valid data", () => {
		const result = DeviceComponent.create(validComponent());

		expect(result.isSuccess).toBe(true);

		const component = result.value;
		expect(component.name).toBe("Batería");
		expect(component.partNumber).toBe("BAT-001");
		expect(component.type).toBe("supply");
		expect(component.id).toBeTruthy();
		expect(component.createdAt).toBeInstanceOf(Date);
		expect(component.updatedAt).toBeInstanceOf(Date);
		expect(component.createdAt.getTime()).toBe(component.updatedAt.getTime());
	});

	test("Should fail when name exceeds 150 characters", () => {
		const result = DeviceComponent.create({
			...validComponent(),
			name: "a".repeat(151),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_NAME_TOO_LONG.code,
		);
	});

	test("Should succeed when name is exactly 150 characters", () => {
		const result = DeviceComponent.create({
			...validComponent(),
			name: "a".repeat(150),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when partNumber exceeds 100 characters", () => {
		const result = DeviceComponent.create({
			...validComponent(),
			partNumber: "a".repeat(101),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			DeviceErrors.DEVICE_COMPONENT_PART_NUMBER_TOO_LONG.code,
		);
	});

	test("Should succeed when partNumber is exactly 100 characters", () => {
		const result = DeviceComponent.create({
			...validComponent(),
			partNumber: "a".repeat(100),
		});
		expect(result.isSuccess).toBe(true);
	});
});
