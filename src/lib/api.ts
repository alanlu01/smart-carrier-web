export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled" | "failed";
export type TaskType = "borrow" | "return" | "delivery" | "navigation" | "callbot";

export type ApiLocation = {
  code: string;
  name: string;
  description: string | null;
  floor: string | null;
  x: number | null;
  y: number | null;
  yaw: number | null;
};

export type ApiTask = {
  id: string;
  location_code: string;
  task_type: TaskType;
  status: TaskStatus;
  note: string | null;
  result_note: string | null;
  required_charge: number | null;
  quantity: number;
  robot_id: string | null;
  created_at: string;
  updated_at: string | null;
  assigned_at: string | null;
  completed_at: string | null;
};

export type ApiRobotSlotStatus = {
  slot: number;
  bank_id: string | null;
  status: "empty" | "low" | "ready" | "full" | "unknown";
  voltage: number | null;
  current: number | null;
  charge: number | null;
  sensor_ok: boolean;
  updated_at: string | null;
};

export type ApiRobotStatus = {
  id: string;
  online: boolean;
  mode: string;
  battery: number | null;
  location_code: string | null;
  x: number | null;
  y: number | null;
  yaw: number | null;
  last_seen_at: string;
  current_task_id: string | null;
  slots: ApiRobotSlotStatus[];
};

export type CreateOrderInput = {
  location_code: string;
  task_type: TaskType;
  note?: string;
  required_charge?: number;
  quantity?: number;
};

const DEFAULT_API_BASE_URL = "https://api.138-2-34-203.sslip.io";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Unable to reach the service", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(body?.detail || `Request failed (${response.status})`, response.status);
  }

  return (await response.json()) as T;
}

export function listLocations(): Promise<ApiLocation[]> {
  return request("/api/v1/locations");
}

export function getRobotStatus(robotId = "R1"): Promise<ApiRobotStatus> {
  return request(`/api/v1/robots/${encodeURIComponent(robotId)}/status`);
}

export function listOrders(limit = 200): Promise<ApiTask[]> {
  return request(`/api/v1/orders?limit=${limit}`);
}

export function getOrder(taskId: string): Promise<ApiTask> {
  return request(`/api/v1/orders/${encodeURIComponent(taskId)}`);
}

export function createOrder(input: CreateOrderInput): Promise<ApiTask> {
  return request("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelOrder(taskId: string): Promise<{ ok: boolean }> {
  return request(`/api/v1/orders/${encodeURIComponent(taskId)}/cancel`, { method: "POST" });
}
