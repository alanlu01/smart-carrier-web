/**
 * Local demo state for the end-to-end competition walkthrough.
 *
 * The demo deliberately lives in localStorage so the customer page and the
 * operator page can be opened in two browser tabs without the cloud API.
 * The same shape can later be replaced by the ROS2/task-service adapter.
 */

export type DemoLocation = {
  code: string;
  name: string;
  description: string;
  floor: string;
  x: number;
  y: number;
};

export type DemoSlotStatus = "available" | "empty" | "charging" | "rented";

export type DemoSlot = {
  id: string;
  battery: number;
  status: DemoSlotStatus;
  label: string;
};

export type DemoRobotMode =
  "idle" | "dispatching" | "arrived" | "returning" | "charging" | "patrol" | "manual" | "emergency";

export type DemoStage = "pending" | "assigned" | "moving" | "arrived" | "serving" | "completed";
export type DemoTaskKind = "powerbank" | "return" | "shop" | "nav" | "callbot";

export type DemoTask = {
  id: string;
  kind: DemoTaskKind;
  summary: string;
  locationCode: string;
  status: "pending" | "in_progress" | "done" | "cancelled" | "failed";
  stage: DemoStage;
  robotId: string | null;
  createdAt: string;
  updatedAt: string;
  orderNo: string;
  powerBankId?: string;
  quantity?: number;
  note?: string;
};

export type DemoRobot = {
  id: string;
  mode: DemoRobotMode;
  locationCode: string;
  targetCode: string | null;
  battery: number;
  etaSeconds: number | null;
  online: boolean;
  lastEvent: string;
};

export type DemoLog = {
  id: string;
  at: string;
  level: "info" | "warning" | "error";
  message: string;
};

export type DemoState = {
  locations: DemoLocation[];
  slots: DemoSlot[];
  robot: DemoRobot;
  tasks: DemoTask[];
  logs: DemoLog[];
  updatedAt: string;
};

const STORAGE_KEY = "flowcharge-demo-state-v2";
const EVENT_NAME = "flowcharge-demo-state-change";

export const DEMO_LOCATIONS: DemoLocation[] = [
  { code: "A1", name: "A 區入口", description: "主要入口大廳", floor: "1F", x: 2, y: 4 },
  { code: "F1", name: "美食街", description: "2F 美食街集合點", floor: "2F", x: 14, y: 8 },
  { code: "E1", name: "電梯旁", description: "主電梯右側", floor: "1F", x: 8, y: 12 },
  { code: "S1", name: "服務台", description: "1F 服務中心", floor: "1F", x: 18, y: 3 },
];

function initialState(): DemoState {
  return {
    locations: DEMO_LOCATIONS.map((location) => ({ ...location })),
    slots: [
      { id: "PB-01", battery: 96, status: "available", label: "可租借" },
      { id: "PB-02", battery: 78, status: "available", label: "可租借" },
      { id: "SLOT-03", battery: 0, status: "empty", label: "空槽" },
    ],
    robot: {
      id: "FlowBot #01",
      mode: "idle",
      locationCode: "BASE",
      targetCode: null,
      battery: 86,
      etaSeconds: null,
      online: true,
      lastEvent: "已完成自我檢查，待命中",
    },
    tasks: [],
    logs: [
      {
        id: "log-boot",
        at: new Date().toISOString(),
        level: "info",
        message: "Demo 模式啟動：FlowBot #01 已完成自我檢查",
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

let memoryState: DemoState | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getDemoState(): DemoState {
  if (memoryState) return clone(memoryState);
  if (canUseStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryState = JSON.parse(raw) as DemoState;
        return clone(memoryState);
      }
    } catch {
      // Fall through to the in-memory seed when storage is unavailable.
    }
  }
  memoryState = initialState();
  persist(memoryState);
  return clone(memoryState);
}

function persist(state: DemoState) {
  memoryState = clone(state);
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // The in-memory copy still keeps the current tab usable.
    }
  }
}

export function updateDemoState(mutator: (state: DemoState) => void): DemoState {
  const next = getDemoState();
  mutator(next);
  next.updatedAt = new Date().toISOString();
  persist(next);
  return clone(next);
}

export function subscribeDemoState(listener: (state: DemoState) => void) {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => listener(getDemoState());
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      memoryState = null;
      onChange();
    }
  };
  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function resetDemoState() {
  memoryState = null;
  if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
  getDemoState();
  if (canUseStorage()) window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getDemoLocation(code: string) {
  return getDemoState().locations.find((location) => location.code === code) ?? null;
}

export function createDemoTask(input: {
  kind: DemoTaskKind;
  summary: string;
  locationCode: string;
  powerBankId?: string;
  quantity?: number;
  note?: string;
}) {
  const now = new Date().toISOString();
  const suffix = String(Date.now()).slice(-6);
  const task: DemoTask = {
    id: `demo-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    kind: input.kind,
    summary: input.summary,
    locationCode: input.locationCode,
    status: "pending",
    stage: "pending",
    robotId: null,
    createdAt: now,
    updatedAt: now,
    orderNo: `FC${suffix}`,
    powerBankId: input.powerBankId,
    quantity: input.quantity,
    note: input.note,
  };
  updateDemoState((state) => {
    state.tasks.unshift(task);
    if (task.kind === "powerbank" && task.powerBankId) {
      const slot = state.slots.find(
        (item) => item.id === task.powerBankId && item.status === "available",
      );
      if (slot) {
        slot.status = "rented";
        slot.label = "配送中";
      }
    }
    state.logs.unshift({
      id: `log-${task.id}`,
      at: now,
      level: "info",
      message: `收到${kindLabel(task.kind)}：${task.summary}`,
    });
  });
  return task;
}

export function cancelDemoTask(taskId: string) {
  return updateDemoState((state) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task || task.status === "done") return;
    task.status = "cancelled";
    task.updatedAt = new Date().toISOString();
    if (task.kind === "powerbank" && task.powerBankId) {
      const slot = state.slots.find(
        (item) => item.id === task.powerBankId && item.status === "rented",
      );
      if (slot) {
        slot.status = "available";
        slot.label = "可租借";
      }
    }
    state.robot.mode = "idle";
    state.robot.targetCode = null;
    state.robot.etaSeconds = null;
    state.robot.lastEvent = "任務已取消，重新待命";
    state.logs.unshift({
      id: `log-cancel-${task.id}-${Date.now()}`,
      at: new Date().toISOString(),
      level: "warning",
      message: `任務 ${task.orderNo} 已取消`,
    });
  });
}

export function setDemoTaskStatus(taskId: string, status: DemoTask["status"]) {
  return updateDemoState((state) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.status = status;
    task.stage =
      status === "done" ? "completed" : status === "in_progress" ? "assigned" : task.stage;
    task.updatedAt = new Date().toISOString();
    if (status === "in_progress") {
      task.robotId = state.robot.id;
      state.robot.mode = "dispatching";
      state.robot.targetCode = task.locationCode;
      state.robot.etaSeconds = 90;
      state.robot.lastEvent = "管理者已手動派發任務";
    }
  });
}

export function removeDemoTask(taskId: string) {
  return updateDemoState((state) => {
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
  });
}

export function advanceDemoTask(taskId: string) {
  return updateDemoState((state) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (
      !task ||
      task.status === "cancelled" ||
      task.status === "failed" ||
      task.stage === "completed"
    )
      return;

    const stages: DemoStage[] = [
      "pending",
      "assigned",
      "moving",
      "arrived",
      "serving",
      "completed",
    ];
    const nextStage = stages[Math.min(stages.indexOf(task.stage) + 1, stages.length - 1)];
    task.stage = nextStage;
    task.updatedAt = new Date().toISOString();

    if (nextStage === "assigned") {
      task.status = "in_progress";
      task.robotId = state.robot.id;
      state.robot.mode = "dispatching";
      state.robot.targetCode = task.locationCode;
      state.robot.etaSeconds = 90;
      state.robot.lastEvent = `已接單，前往 ${task.locationCode}`;
    } else if (nextStage === "moving") {
      state.robot.mode = "dispatching";
      state.robot.etaSeconds = 45;
      state.robot.battery = Math.max(0, state.robot.battery - 1);
      state.robot.lastEvent = "Nav2 路徑規劃完成，載具前往服務點";
    } else if (nextStage === "arrived") {
      state.robot.mode = "arrived";
      state.robot.etaSeconds = 0;
      state.robot.locationCode = task.locationCode;
      state.robot.lastEvent = "已抵達服務點，等待使用者操作";
    } else if (nextStage === "serving") {
      state.robot.mode = "arrived";
      state.robot.lastEvent =
        task.kind === "return" ? "請將行動電源插入空槽" : "請依畫面指示完成取用";
    } else if (nextStage === "completed") {
      task.status = "done";
      state.robot.mode = "idle";
      state.robot.targetCode = null;
      state.robot.etaSeconds = null;
      state.robot.lastEvent = "任務完成，回到待命狀態";
      if (task.kind === "powerbank" && task.powerBankId) {
        const slot = state.slots.find((item) => item.id === task.powerBankId);
        if (slot) {
          slot.status = "rented";
          slot.label = "使用中";
        }
      }
      if (task.kind === "return") {
        const empty = state.slots.find((slot) => slot.status === "empty");
        if (empty) {
          empty.status = "charging";
          empty.battery = 18;
          empty.label = "充電中";
        }
      }
      state.logs.unshift({
        id: `log-done-${task.id}`,
        at: new Date().toISOString(),
        level: "info",
        message: `任務 ${task.orderNo} 已完成，庫存與訂單同步更新`,
      });
    }
  });
}

export function advanceAllDemoTasks() {
  const state = getDemoState();
  const active = state.tasks.find(
    (task) => task.status === "pending" || task.status === "in_progress",
  );
  if (active) return advanceDemoTask(active.id);
  return state;
}

export function setDemoRobotMode(mode: DemoRobotMode) {
  return updateDemoState((state) => {
    state.robot.mode = mode;
    state.robot.lastEvent =
      mode === "emergency"
        ? "緊急停止已觸發，等待管理者復原"
        : `管理者切換至${robotModeLabel(mode)}模式`;
    if (mode === "emergency" || mode === "charging" || mode === "patrol" || mode === "manual") {
      state.robot.targetCode = null;
      state.robot.etaSeconds = null;
    }
    state.logs.unshift({
      id: `log-mode-${Date.now()}`,
      at: new Date().toISOString(),
      level: mode === "emergency" ? "error" : "info",
      message: state.robot.lastEvent,
    });
  });
}

export function kindLabel(kind: DemoTaskKind) {
  return {
    powerbank: "行動電源租借",
    return: "行動電源歸還",
    shop: "商品配送",
    nav: "商場導航",
    callbot: "服務呼叫",
  }[kind];
}

export function robotModeLabel(mode: DemoRobotMode) {
  return {
    idle: "待命",
    dispatching: "配送中",
    arrived: "已抵達",
    returning: "返航",
    charging: "充電",
    patrol: "自主巡邏",
    manual: "人工操控",
    emergency: "緊急停止",
  }[mode];
}
