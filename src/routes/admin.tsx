import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import {
  getRobotStatus,
  listLocations,
  listOrders,
  type ApiRobotStatus,
  type ApiTask,
} from "@/lib/api";
import { LanguageToggle, tr, useLanguage } from "@/lib/i18n";
import {
  advanceAllDemoTasks,
  getDemoState,
  removeDemoTask,
  resetDemoState,
  setDemoRobotMode,
  setDemoTaskStatus,
  subscribeDemoState,
  updateDemoState,
  robotModeLabel,
  type DemoLocation,
  type DemoRobotMode,
  type DemoState,
} from "@/lib/demo-mode";
import {
  Bot,
  ArrowLeft,
  Plus,
  Trash2,
  MapPin,
  QrCode,
  ListChecks,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  BatteryCharging,
  CarFront,
  AlertTriangle,
  RotateCcw,
  Play,
  PackageOpen,
} from "lucide-react";

const searchSchema = z.object({ demo: z.coerce.boolean().optional() });

export const Route = createFileRoute("/admin")({
  validateSearch: searchSchema,
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "管理後台 — RoboCall" },
      { name: "description", content: "任務佇列、地點管理與 QR Code 產生器。" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Task = Pick<
  ApiTask,
  "id" | "location_code" | "status" | "note" | "robot_id" | "created_at" | "updated_at"
>;
type Location = { code: string; name: string; description: string | null };

function AdminPage() {
  useLanguage();
  const { demo: demoMode } = Route.useSearch();
  const [tab, setTab] = useState<"tasks" | "locations" | "qr">("tasks");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">RoboCall</div>
              <div className="text-xs text-muted-foreground">{tr("管理後台")}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {demoMode && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                {tr("DEMO 模式")}
              </span>
            )}
            <LanguageToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {tr("首頁")}
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-6">
          {[
            { k: "tasks", label: "任務佇列", icon: ListChecks },
            { k: "locations", label: "地點管理", icon: MapPin },
            { k: "qr", label: "QR Code", icon: QrCode },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === t.k
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {tr(t.label)}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {demoMode && <DemoBanner />}
        {tab === "tasks" && <TasksPanel demoMode={Boolean(demoMode)} />}
        {tab === "locations" && <LocationsPanel demoMode={Boolean(demoMode)} />}
        {tab === "qr" && <QRPanel demoMode={Boolean(demoMode)} />}
      </main>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <div>
        <div className="text-sm font-bold">{tr("完整 Demo 控制台")}</div>
        <div className="mt-0.5 text-xs">
          {tr("顧客端與管理端共用本機 Demo 狀態；可開兩個分頁同步展示。")}
        </div>
      </div>
      <button
        onClick={() => {
          if (confirm(tr("重設 Demo 任務、庫存與機器人狀態？"))) resetDemoState();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-amber-100"
      >
        <RotateCcw className="h-3.5 w-3.5" /> {tr("重設 Demo")}
      </button>
    </div>
  );
}

function TasksPanel({ demoMode }: { demoMode: boolean }) {
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [locs, setLocs] = useState<Record<string, Location>>({});
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [robotStatus, setRobotStatus] = useState<ApiRobotStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [robotLoadError, setRobotLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (demoMode) {
      const state = getDemoState();
      setDemoState(state);
      setTasks(
        state.tasks.map((task) => ({
          id: task.id,
          location_code: task.locationCode,
          status: task.status,
          note: task.summary,
          robot_id: task.robotId,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        })),
      );
      setLocs(Object.fromEntries(state.locations.map((x) => [x.code, x as Location])));
      setRobotStatus(null);
      setLoadError(null);
      setRobotLoadError(null);
      return;
    }

    const tasksAndLocationsPromise = Promise.all([listOrders(200), listLocations()]);
    const robotStatusPromise = getRobotStatus("R1");
    try {
      const [tasksData, locationsData] = await tasksAndLocationsPromise;
      setTasks(tasksData);
      setLocs(Object.fromEntries(locationsData.map((x) => [x.code, x])));
      setLoadError(null);
    } catch {
      setLoadError(tr("無法連線至後端服務，請稍後再試。"));
      setTasks((current) => current ?? []);
    }
    try {
      setRobotStatus(await robotStatusPromise);
      setRobotLoadError(null);
    } catch {
      setRobotStatus(null);
      setRobotLoadError(tr("無法讀取機器人狀態。"));
    }
  }, [demoMode]);

  useEffect(() => {
    void reload();
    if (demoMode) return subscribeDemoState(reload);
    const timer = window.setInterval(reload, 5000);
    return () => window.clearInterval(timer);
  }, [demoMode, reload]);

  async function update(id: string, status: Task["status"]) {
    if (demoMode) {
      setDemoTaskStatus(id, status);
      return;
    }
    // Live task state is owned by the authenticated robot API.
  }
  async function remove(id: string) {
    if (!confirm(tr("確定刪除此任務？"))) return;
    if (demoMode) {
      removeDemoTask(id);
      return;
    }
    // Destructive live operations require an authenticated admin API.
  }

  const pending = tasks?.filter((t) => t.status === "pending").length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const doneToday =
    tasks?.filter(
      (t) =>
        t.status === "done" &&
        new Date(t.updated_at ?? t.created_at).toDateString() === new Date().toDateString(),
    ).length ?? 0;

  return (
    <div>
      {demoMode && demoState && <DemoRobotPanel state={demoState} />}
      {!demoMode && <LiveRobotPanel status={robotStatus} error={robotLoadError} />}
      {loadError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label={tr("等待中")} value={pending} icon={Clock} tint="warning" />
        <Stat label={tr("執行中")} value={inProgress} icon={Radio} tint="primary" />
        <Stat label={tr("今日完成")} value={doneToday} icon={CheckCircle2} tint="success" />
      </div>

      <div
        className="mt-6 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">{tr("最近任務")}</h2>
          <span className="text-xs text-muted-foreground">
            {tr(demoMode ? "即時更新中" : "每 5 秒同步後端")}
          </span>
        </div>
        {tasks === null ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {tr("目前沒有任務")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-muted/30">
                <StatusBadge status={t.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {tr(locs[t.location_code]?.name ?? t.location_code)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.location_code}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString(language === "en" ? "en-US" : "zh-TW", {
                      hour12: false,
                    })}
                    {t.robot_id && ` · 🤖 ${t.robot_id}`}
                    {t.note && ` · ${tr(t.note)}`}
                  </div>
                </div>
                {demoMode && (
                  <div className="flex flex-wrap items-center gap-2">
                    {t.status === "pending" && (
                      <button
                        onClick={() => update(t.id, "in_progress")}
                        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        {tr("手動派發")}
                      </button>
                    )}
                    {t.status === "in_progress" && (
                      <button
                        onClick={() => update(t.id, "done")}
                        className="rounded-lg bg-success/15 px-3 py-1.5 text-xs font-medium text-success-foreground hover:bg-success/25"
                      >
                        {tr("標記完成")}
                      </button>
                    )}
                    <button
                      onClick={() => remove(t.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveRobotPanel({
  status,
  error,
}: {
  status: ApiRobotStatus | null;
  error: string | null;
}) {
  if (!status) {
    return (
      <div className="mb-6 flex min-h-28 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        {error ?? <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
    );
  }

  const available = status.slots.filter(
    (slot) => slot.sensor_ok && (slot.status === "ready" || slot.status === "full"),
  ).length;
  const empty = status.slots.filter((slot) => slot.sensor_ok && slot.status === "empty").length;
  const location = status.location_code
    ? status.location_code
    : status.x !== null && status.y !== null
      ? `${status.x.toFixed(2)}, ${status.y.toFixed(2)}`
      : "—";
  const lastSeen = new Date(status.last_seen_at).toLocaleString(undefined, { hour12: false });

  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CarFront className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              {status.id}
              <span
                className={`h-2 w-2 rounded-full ${status.online ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              <span className={status.online ? "text-emerald-700" : "text-muted-foreground"}>
                {tr(status.online ? "線上" : "離線")}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {tr("模式")}：{liveModeLabel(status.mode)} · {tr("最後回報")}：{lastSeen}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs">
          <span className="text-muted-foreground">{tr("目前任務")}：</span>{" "}
          <span className="font-mono font-semibold">
            {status.current_task_id ? status.current_task_id.slice(0, 8).toUpperCase() : "—"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-4">
        <MiniMetric label={tr("目前位置")} value={location} icon={MapPin} />
        <MiniMetric
          label={tr("車載電量")}
          value={status.battery === null ? "—" : `${status.battery}%`}
          icon={BatteryCharging}
        />
        <MiniMetric
          label={tr("可租借")}
          value={`${available} / ${status.slots.length}`}
          icon={Bot}
        />
        <MiniMetric
          label={tr("可歸還槽")}
          value={`${empty} / ${status.slots.length}`}
          icon={PackageOpen}
        />
      </div>

      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3">
        {status.slots.map((slot) => (
          <div key={slot.slot} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">
                {tr("槽位")} {slot.slot}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${slotStatusClass(slot.status, slot.sensor_ok)}`}
              >
                {tr(slotStatusLabel(slot.status, slot.sensor_ok))}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold">{slot.bank_id ?? "—"}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {tr("電量")} {slot.charge === null ? "—" : `${slot.charge}%`} ·{" "}
              {slot.voltage === null ? "—" : `${slot.voltage.toFixed(3)} V`} ·{" "}
              {slot.current === null ? "—" : `${slot.current.toFixed(3)} A`}
            </div>
          </div>
        ))}
      </div>

      {!status.online && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4" /> {tr("機器人 heartbeat 已逾時，請檢查車端服務。")}
        </div>
      )}
    </div>
  );
}

function liveModeLabel(mode: string) {
  const labels: Record<string, string> = {
    idle: "待命",
    dispatching: "執行任務",
    navigation: "導航中",
    charging: "充電中",
    emergency: "緊急停止",
    error: "異常",
  };
  return tr(labels[mode] ?? mode);
}

function slotStatusLabel(status: ApiRobotStatus["slots"][number]["status"], sensorOk: boolean) {
  if (!sensorOk || status === "unknown") return "感測異常";
  const labels = {
    empty: "空槽",
    low: "低電量",
    ready: "可租借",
    full: "已充滿",
  } as const;
  return labels[status];
}

function slotStatusClass(status: ApiRobotStatus["slots"][number]["status"], sensorOk: boolean) {
  if (!sensorOk || status === "unknown") return "bg-red-100 text-red-700";
  if (status === "empty") return "bg-slate-100 text-slate-600";
  if (status === "low") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function DemoRobotPanel({ state }: { state: DemoState }) {
  const modeOptions: DemoRobotMode[] = ["idle", "patrol", "charging", "manual", "emergency"];
  const activeTask = state.tasks.find(
    (task) => task.status === "pending" || task.status === "in_progress",
  );
  const available = state.slots.filter((slot) => slot.status === "available").length;
  const empty = state.slots.filter((slot) => slot.status === "empty").length;
  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CarFront className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              {state.robot.id}
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs text-muted-foreground">
              {tr(robotModeLabel(state.robot.mode))} · {tr(state.robot.lastEvent)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!activeTask}
            onClick={() => advanceAllDemoTasks()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" /> {tr("下一個模擬節點")}
          </button>
          {modeOptions.map((mode) => (
            <button
              key={mode}
              onClick={() => setDemoRobotMode(mode)}
              className={`rounded-lg border px-2.5 py-2 text-[11px] font-medium ${state.robot.mode === mode ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
            >
              {tr(robotModeLabel(mode))}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-4">
        <MiniMetric
          label={tr("目前位置")}
          value={state.robot.locationCode === "BASE" ? tr("基地") : state.robot.locationCode}
          icon={MapPin}
        />
        <MiniMetric
          label={tr("車載電量")}
          value={`${state.robot.battery}%`}
          icon={BatteryCharging}
        />
        <MiniMetric label={tr("可租借")} value={`${available} / 3`} icon={Bot} />
        <MiniMetric label={tr("可歸還槽")} value={`${empty} / 3`} icon={PackageOpen} />
      </div>
      {state.robot.mode === "emergency" && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertTriangle className="h-4 w-4" />{" "}
          {tr("緊急停止：載具不可接收新任務，請確認環境後復原。")}
        </div>
      )}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tint: string;
}) {
  const tints: Record<string, string> = {
    warning: "bg-warning/15 text-warning-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success-foreground",
  };
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const map: Record<Task["status"], { label: string; cls: string; Icon: React.ElementType }> = {
    pending: {
      label: "等待中",
      cls: "bg-warning/15 text-warning-foreground border-warning/30",
      Icon: Clock,
    },
    in_progress: {
      label: "執行中",
      cls: "bg-primary/10 text-primary border-primary/30",
      Icon: Radio,
    },
    done: {
      label: "完成",
      cls: "bg-success/15 text-success-foreground border-success/30",
      Icon: CheckCircle2,
    },
    cancelled: {
      label: "取消",
      cls: "bg-muted text-muted-foreground border-border",
      Icon: XCircle,
    },
    failed: {
      label: "失敗",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
      Icon: XCircle,
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      <s.Icon className="h-3 w-3" />
      {tr(s.label)}
    </span>
  );
}

function LocationsPanel({ demoMode }: { demoMode: boolean }) {
  const [locs, setLocs] = useState<Location[] | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (demoMode) {
      setLocs(getDemoState().locations as Location[]);
      return;
    }
    try {
      setLocs(await listLocations());
      setLoadError(null);
    } catch {
      setLocs([]);
      setLoadError(tr("無法載入地點資料。"));
    }
  }, [demoMode]);
  useEffect(() => {
    reload();
    if (demoMode) return subscribeDemoState(reload);
  }, [demoMode, reload]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    if (demoMode) {
      const nextCode = code.trim().toUpperCase();
      updateDemoState((state) => {
        if (state.locations.some((item) => item.code === nextCode)) return;
        state.locations.push({
          code: nextCode,
          name: name.trim(),
          description: desc.trim(),
          floor: "1F",
          x: 0,
          y: 0,
        });
      });
      setCode("");
      setName("");
      setDesc("");
      return;
    }
    return;
  }
  async function remove(c: string) {
    if (!confirm(tr("刪除地點 {{code}}？", { code: c }))) return;
    if (demoMode) {
      updateDemoState((state) => {
        state.locations = state.locations.filter((location) => location.code !== c);
      });
      return;
    }
    return;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div
        className="overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">{tr("已註冊地點")}</h2>
        </div>
        {loadError && (
          <div className="border-b border-border px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}
        {!locs ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : locs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {tr("尚未新增地點")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {locs.map((l) => (
              <div key={l.code} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                  {l.code}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{tr(l.name)}</div>
                  {l.description && (
                    <div className="text-xs text-muted-foreground">{tr(l.description)}</div>
                  )}
                </div>
                {demoMode && (
                  <button
                    onClick={() => remove(l.code)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {demoMode ? (
        <form
          onSubmit={add}
          className="h-fit rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="font-semibold">{tr("新增地點")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{tr("地點代碼會嵌入 QR Code。")}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium">{tr("代碼（英數字）")}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="A1"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium">{tr("名稱")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("A 區入口")}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium">{tr("說明（可選）")}</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={tr("主要入口大廳")}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> {tr("新增")}
          </button>
        </form>
      ) : (
        <div
          className="h-fit rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="font-semibold">{tr("正式地點管理")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("正式地點為導航資料，新增或刪除需要管理員驗證；公開網頁目前僅提供檢視。")}
          </p>
        </div>
      )}
    </div>
  );
}

function QRPanel({ demoMode }: { demoMode: boolean }) {
  const [locs, setLocs] = useState<Location[]>([]);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (demoMode) {
      setLocs(getDemoState().locations as Location[]);
      setOrigin(window.location.origin);
      return subscribeDemoState((state) => setLocs(state.locations as Location[]));
    }
    void listLocations()
      .then(setLocs)
      .catch(() => setLocs([]));
    setOrigin(window.location.origin);
  }, [demoMode]);

  return (
    <div>
      <div
        className="rounded-2xl border border-border bg-card p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="font-semibold">{tr("列印用 QR Code")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("每個地點對應一組固定 QR Code。掃描後會開啟顧客呼叫頁。")}
        </p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {locs.map((l) => {
          const url = `${origin}${import.meta.env.BASE_URL}#/call?location=${encodeURIComponent(l.code)}${demoMode ? "&demo=true" : ""}`;
          return (
            <div
              key={l.code}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={url} size={160} level="M" />
              </div>
              <div className="mt-4 font-mono text-xs text-muted-foreground">{l.code}</div>
              <div className="text-lg font-semibold">{tr(l.name)}</div>
              {l.description && (
                <div className="text-xs text-muted-foreground">{tr(l.description)}</div>
              )}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 truncate text-xs text-primary hover:underline"
              >
                {url}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
