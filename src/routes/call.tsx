import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ApiError,
  cancelOrder,
  createOrder,
  getOrder,
  listLocations,
  type ApiLocation,
  type ApiTask,
  type TaskType,
} from "@/lib/api";
import { LanguageToggle, tr, useLanguage } from "@/lib/i18n";
import {
  advanceDemoTask,
  cancelDemoTask,
  createDemoTask,
  getDemoLocation,
  getDemoState,
  subscribeDemoState,
  type DemoState,
} from "@/lib/demo-mode";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MapPin,
  ArrowLeft,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Coffee,
  Cookie,
  Navigation,
  MessageCircle,
  Plus,
  Minus,
  X,
  Send,
  ShoppingCart,
  BatteryCharging,
  PackageOpen,
  ChevronRight,
  Zap,
  PhoneCall,
  Search,
  CreditCard,
  Smartphone,
  QrCode,
  Clock,
  Sparkles,
  Trash2,
  ArrowRight,
  Wallet,
} from "lucide-react";

const searchSchema = z.object({
  location: z.string().optional(),
  demo: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/call")({
  validateSearch: searchSchema,
  component: CallPage,
  head: () => ({
    meta: [
      { title: "FlowCharge — 智慧商場服務" },
      { name: "description", content: "租借行動電源、購買飲料零食、商場導航與 AI 客服。" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Location = Pick<ApiLocation, "code" | "name" | "description"> &
  Partial<Pick<ApiLocation, "floor" | "x" | "y" | "yaw">>;
type Task = Pick<ApiTask, "id" | "status" | "location_code" | "created_at">;

type PowerBank = { id: string; battery: number };
type ShopItem = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: "drink" | "snack";
  stock: number;
  desc: string;
  temp?: "cold" | "room";
};
type Plan = {
  id: string;
  label: string;
  hours: number | "day";
  price: number;
  tag?: string;
  hint: string;
};

const POWER_BANKS: PowerBank[] = [
  { id: "PB-01", battery: 98 },
  { id: "PB-02", battery: 87 },
  { id: "PB-03", battery: 76 },
  { id: "PB-04", battery: 65 },
  { id: "PB-05", battery: 52 },
  { id: "PB-06", battery: 41 },
  { id: "PB-07", battery: 33 },
  { id: "PB-08", battery: 22 },
];

const PLANS: Plan[] = [
  { id: "p1", label: "1 小時方案", hours: 1, price: 20, hint: "臨時充電、短暫外出" },
  { id: "p3", label: "3 小時方案", hours: 3, price: 50, tag: "熱門", hint: "看場電影或吃頓飯" },
  { id: "pd", label: "當日方案", hours: "day", price: 100, tag: "最划算", hint: "一整天無限使用" },
];
const DEPOSIT = 300;

const SHOP: ShopItem[] = [
  {
    id: "d1",
    category: "drink",
    name: "可口可樂",
    price: 25,
    emoji: "🥤",
    stock: 8,
    desc: "330ml 冷藏罐裝",
    temp: "cold",
  },
  {
    id: "d2",
    category: "drink",
    name: "礦泉水",
    price: 20,
    emoji: "💧",
    stock: 12,
    desc: "600ml 純淨水",
    temp: "cold",
  },
  {
    id: "d3",
    category: "drink",
    name: "美式咖啡",
    price: 45,
    emoji: "☕",
    stock: 5,
    desc: "現煮 350ml",
    temp: "cold",
  },
  {
    id: "d4",
    category: "drink",
    name: "檸檬紅茶",
    price: 30,
    emoji: "🍵",
    stock: 0,
    desc: "500ml 冷飲",
    temp: "cold",
  },
  {
    id: "s1",
    category: "snack",
    name: "洋芋片",
    price: 40,
    emoji: "🍟",
    stock: 6,
    desc: "原味厚切 60g",
  },
  {
    id: "s2",
    category: "snack",
    name: "巧克力",
    price: 35,
    emoji: "🍫",
    stock: 10,
    desc: "牛奶巧克力 40g",
  },
  {
    id: "s3",
    category: "snack",
    name: "夾心餅乾",
    price: 30,
    emoji: "🍪",
    stock: 4,
    desc: "香草夾心 8 入",
  },
  {
    id: "s4",
    category: "snack",
    name: "口香糖",
    price: 25,
    emoji: "🍬",
    stock: 15,
    desc: "薄荷 12 粒",
  },
];

const NAV_TAGS = [
  "洗手間",
  "電梯",
  "手扶梯",
  "出口",
  "服務台",
  "美食街",
  "停車場",
  "ATM",
  "育嬰室",
  "無障礙設施",
];
const QUICK_Q = [
  "商場幾點關門？",
  "洗手間在哪裡？",
  "有哪些餐廳？",
  "最近有什麼活動？",
  "行動電源如何租借？",
  "停車場怎麼走？",
];
const PAYMENTS = [
  { id: "linepay", label: "LINE Pay", icon: Smartphone, color: "hsl(140 70% 45%)" },
  { id: "applepay", label: "Apple Pay", icon: Smartphone, color: "hsl(0 0% 15%)" },
  { id: "googlepay", label: "Google Pay", icon: Smartphone, color: "hsl(220 90% 55%)" },
  { id: "credit", label: "信用卡", icon: CreditCard, color: "hsl(214 95% 55%)" },
  { id: "easycard", label: "悠遊卡", icon: Wallet, color: "hsl(190 85% 45%)" },
  { id: "ipass", label: "一卡通", icon: Wallet, color: "hsl(30 95% 55%)" },
];

type View = "home" | "powerbank" | "return" | "shop" | "nav" | "ai" | "callbot";

// Rich task descriptor -- combines DB task with client-side simulated stage
type RichTask = {
  db: Task;
  kind: "powerbank" | "return" | "shop" | "nav" | "callbot";
  summary: string;
  demo?: boolean;
  demoTaskId?: string;
  extras?: {
    powerBankId?: string;
    plan?: Plan;
    orderNo?: string;
    total?: number;
    destName?: string;
    quantity?: number;
  };
};
type SimStage = "pending" | "assigned" | "moving" | "arrived" | "serving" | "completed";
const STAGES: { key: SimStage; label: string; hint: string }[] = [
  { key: "pending", label: "已送出需求", hint: "任務已建立" },
  { key: "assigned", label: "已分配機器人", hint: "FlowBot #01 接單" },
  { key: "moving", label: "機器人前往中", hint: "預估 1~2 分鐘抵達" },
  { key: "arrived", label: "機器人已抵達", hint: "請留意周遭" },
  { key: "serving", label: "服務進行中", hint: "請領取物品" },
  { key: "completed", label: "任務完成", hint: "祝您有愉快的體驗" },
];

function CallPage() {
  useLanguage();
  const { location: locCode, demo: demoSearch } = Route.useSearch();
  const [loc, setLoc] = useState<Location | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [rich, setRich] = useState<RichTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("home");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const demoMode = Boolean(demoSearch);
  const [demoState, setDemoState] = useState<DemoState | null>(null);

  useEffect(() => {
    if (!locCode) {
      setLocError(tr("網址缺少 location 參數，請重新掃描 QR Code。"));
      return;
    }
    let active = true;
    const loadLocalLocation = () => {
      const local = getDemoLocation(locCode);
      if (!active) return;
      if (local) {
        setLoc(local);
        setLocError(null);
      } else {
        setLocError(tr(`找不到地點代碼「${locCode}」`));
      }
    };
    if (demoSearch) {
      loadLocalLocation();
      return () => {
        active = false;
      };
    }
    void (async () => {
      try {
        const locations = await listLocations();
        if (!active) return;
        const location = locations.find((item) => item.code === locCode.toUpperCase());
        setAllLocations(locations);
        if (!location) setLocError(tr(`找不到地點代碼「${locCode}」`));
        else {
          setLoc(location);
          setLocError(null);
        }
      } catch {
        if (!active) return;
        setLocError(tr("服務暫時無法連線，請稍後再試。"));
      }
    })();
    return () => {
      active = false;
    };
  }, [locCode, demoSearch]);

  useEffect(() => {
    if (!demoMode) return;
    const refresh = () => {
      const next = getDemoState();
      setDemoState(next);
      setAllLocations(next.locations);
    };
    refresh();
    return subscribeDemoState(refresh);
  }, [demoMode]);

  const liveTaskId = rich && !rich.demo ? rich.db.id : null;
  useEffect(() => {
    if (!liveTaskId) return;
    const taskId = liveTaskId;
    let active = true;
    const refresh = async () => {
      try {
        const task = await getOrder(taskId);
        if (active) setRich((current) => (current ? { ...current, db: task } : current));
      } catch {
        // A temporary polling failure should not discard the order shown to the customer.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [liveTaskId]);

  async function createTask(kind: RichTask["kind"], summary: string, extras?: RichTask["extras"]) {
    if (!loc || busy) return;
    setBusy(true);
    if (demoMode) {
      const demoTask = createDemoTask({
        kind,
        summary,
        locationCode: loc.code,
        powerBankId: extras?.powerBankId,
        quantity: extras?.quantity,
      });
      setBusy(false);
      setRich({
        db: {
          id: demoTask.id,
          status: "pending",
          location_code: demoTask.locationCode,
          created_at: demoTask.createdAt,
        },
        kind,
        summary,
        demo: true,
        demoTaskId: demoTask.id,
        extras: { orderNo: demoTask.orderNo, ...extras },
      });
      setCart({});
      return;
    }
    const taskType: Record<RichTask["kind"], TaskType> = {
      powerbank: "borrow",
      return: "return",
      shop: "delivery",
      nav: "navigation",
      callbot: "callbot",
    };
    try {
      const data = await createOrder({
        location_code: loc.code,
        task_type: taskType[kind],
        note: summary,
        quantity: extras?.quantity ?? 1,
      });
      setRich({
        db: data,
        kind,
        summary,
        extras: { orderNo: data.id.slice(0, 8).toUpperCase(), ...extras },
      });
      setCart({});
    } catch {
      alert(tr("呼叫失敗，請再試一次"));
    } finally {
      setBusy(false);
    }
  }

  async function cancelTask() {
    if (!rich) return;
    if (rich.demo && rich.demoTaskId) cancelDemoTask(rich.demoTaskId);
    else {
      try {
        await cancelOrder(rich.db.id);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          try {
            const task = await getOrder(rich.db.id);
            setRich((current) => (current ? { ...current, db: task } : current));
          } catch {
            // Keep the current task visible if the follow-up status refresh also fails.
          }
        }
        alert(tr("任務已開始或無法取消，請重新確認狀態。"));
        return;
      }
    }
    setRich(null);
    setView("home");
  }

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ item: SHOP.find((x) => x.id === id)!, qty: q }))
        .filter((x) => x.item),
    [cart],
  );
  const cartTotal = cartItems.reduce((s, { item, qty }) => s + item.price * qty, 0);
  const cartCount = cartItems.reduce((s, x) => s + x.qty, 0);
  const availableBanks =
    demoMode && demoState
      ? demoState.slots
          .filter((slot) => slot.status === "available")
          .map((slot) => ({ id: slot.id, battery: slot.battery }))
      : POWER_BANKS;
  const emptySlots =
    demoMode && demoState ? demoState.slots.filter((slot) => slot.status === "empty").length : 1;
  const robot = demoState?.robot ?? { battery: 92, lastEvent: "機器人待命中" };

  return (
    <div className="min-h-screen bg-[hsl(220_20%_97%)] text-foreground">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px]"
        style={{
          background:
            "linear-gradient(160deg, hsl(214 95% 55%) 0%, hsl(190 85% 50%) 55%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed left-1/2 top-40 z-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "hsl(275 85% 65%)" }}
      />

      <div className="relative z-10 mx-auto max-w-md px-5 pt-6 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Zap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">FlowCharge</div>
              <div className="text-sm font-bold">{tr("智慧商場服務")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && (
              <span className="rounded-full bg-amber-300/25 px-2 py-1 text-[10px] font-bold text-amber-50">
                DEMO
              </span>
            )}
            <LanguageToggle light />
          </div>
        </div>

        {/* Location + robot */}
        <div className="mt-5 rounded-2xl bg-white/15 p-4 text-white backdrop-blur-md">
          {locError ? (
            <div className="text-sm">{locError}</div>
          ) : !loc ? (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Loader2 className="h-4 w-4 animate-spin" /> {tr("定位中...")}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] opacity-80">
                  <MapPin className="h-3 w-3" /> {tr("您目前位置")}
                </div>
                <div className="truncate text-base font-bold">{tr(loc.name)}</div>
                <div className="font-mono text-[10px] uppercase opacity-70">{loc.code}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-semibold">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />{" "}
                  {tr(demoMode ? robot.lastEvent : "機器人待命中")}
                </div>
                <div className="mt-1 text-[10px] opacity-80">
                  FlowBot #01 · {tr("電量")} {demoMode ? robot.battery : 92}%
                </div>
              </div>
            </div>
          )}
        </div>

        {loc && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="rounded-xl bg-white/80 px-2 py-2 shadow-sm">
              <div className="font-bold text-primary">{availableBanks.length}</div>
              <div className="text-muted-foreground">{tr("可租借")}</div>
            </div>
            <div className="rounded-xl bg-white/80 px-2 py-2 shadow-sm">
              <div className="font-bold text-amber-600">{emptySlots}</div>
              <div className="text-muted-foreground">{tr("可歸還槽")}</div>
            </div>
            <div className="rounded-xl bg-white/80 px-2 py-2 shadow-sm">
              <div className="font-bold text-emerald-600">
                {demoMode ? `${robot.battery}%` : "92%"}
              </div>
              <div className="text-muted-foreground">{tr("車載電量")}</div>
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="mt-4 rounded-3xl border border-white/60 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(20,60,120,0.35)]">
          {rich ? (
            <TaskTracker
              rich={rich}
              loc={loc!}
              demo={demoMode}
              onCancel={cancelTask}
              onDone={() => {
                setRich(null);
                setView("home");
              }}
            />
          ) : view === "home" ? (
            <HomeCards
              onOpen={setView}
              onOpenAI={() => {
                setView("ai");
                setAiOpen(true);
              }}
              availableCount={availableBanks.length}
            />
          ) : (
            <>
              <button
                onClick={() => setView("home")}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {tr("返回首頁")}
              </button>
              {view === "powerbank" && loc && (
                <PowerBankFlow
                  busy={busy}
                  banks={availableBanks}
                  onRent={(pb, plan) =>
                    createTask(
                      "powerbank",
                      `租借 ${pb.id}（電量 ${pb.battery}%）· ${plan.label} NT$${plan.price}`,
                      { powerBankId: pb.id, plan, total: plan.price + DEPOSIT },
                    )
                  }
                />
              )}
              {view === "return" && loc && (
                <ReturnPanel
                  emptySlots={emptySlots}
                  busy={busy}
                  onReturn={() => createTask("return", "使用者歸還行動電源")}
                />
              )}
              {view === "shop" && loc && <ShopPanel cart={cart} setCart={setCart} />}
              {view === "nav" && loc && (
                <NavPanel
                  locations={allLocations}
                  currentCode={loc.code}
                  busy={busy}
                  onGo={(dest) =>
                    createTask("nav", `帶路至 ${dest.name}（${dest.code}）`, {
                      destName: dest.name,
                    })
                  }
                />
              )}
              {view === "callbot" && loc && (
                <CallBotPanel
                  busy={busy}
                  onCall={(purpose, note) =>
                    createTask("callbot", `${purpose}${note ? ` · ${note}` : ""}`)
                  }
                />
              )}
              {view === "ai" && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="mx-auto mb-3 h-10 w-10 text-[hsl(275_85%_60%)]" />
                  <button
                    onClick={() => setAiOpen(true)}
                    className="rounded-xl bg-[hsl(275_85%_60%)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30"
                  >
                    {tr("開啟 AI 客服對話")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky cart bar */}
      {loc && !rich && view === "shop" && cartCount > 0 && (
        <CartBar
          count={cartCount}
          total={cartTotal}
          items={cartItems}
          onSetCart={setCart}
          busy={busy}
          onCheckout={(total) =>
            createTask(
              "shop",
              `${cartItems.map((x) => `${x.item.name}x${x.qty}`).join("、")} · 共 NT$${total}`,
              { total },
            )
          }
        />
      )}

      {aiOpen && (
        <AIChatModal
          onClose={() => setAiOpen(false)}
          onCallService={() => {
            setAiOpen(false);
            setView("callbot");
          }}
        />
      )}
    </div>
  );
}

/* ============= Home ============= */
function HomeCards({
  onOpen,
  onOpenAI,
  availableCount,
}: {
  onOpen: (v: View) => void;
  onOpenAI: () => void;
  availableCount: number;
}) {
  return (
    <div>
      <h1 className="text-2xl font-black leading-tight tracking-tight">
        {tr("您好，需要什麼服務？")}
      </h1>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {tr("FlowCharge 可以協助您租借行動電源、購買飲料與零食、查詢商場路線，以及回答各種問題。")}
      </p>

      <button
        onClick={() => onOpen("powerbank")}
        className="group mt-5 flex w-full items-center gap-4 rounded-2xl p-5 text-left text-white shadow-lg shadow-indigo-500/30 active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, hsl(238 82% 60%) 0%, hsl(268 82% 62%) 100%)",
        }}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <BatteryCharging className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            {tr("最推薦")}
          </div>
          <div className="text-lg font-black">{tr("租借行動電源")}</div>
          <div className="text-xs opacity-90">{tr("手機快沒電了？立即租借。")}</div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px]">
            <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">
              {tr("剩 {{count}} 顆", { count: availableCount })}
            </span>
            <span className="opacity-90">{tr("NT$ 20 起 / 小時")}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 opacity-80 transition group-hover:translate-x-1" />
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <FeatureCard
          onClick={() => onOpen("return")}
          icon={PackageOpen}
          title="歸還行動電源"
          desc="掃碼快速歸還"
          tint="hsl(238 82% 60%)"
        />
        <FeatureCard
          onClick={() => onOpen("shop")}
          icon={Coffee}
          title="飲料與零食"
          desc="機器人配送 Demo"
          tint="hsl(30 95% 55%)"
        />
        <FeatureCard
          onClick={() => onOpen("nav")}
          icon={Navigation}
          title="商場導航"
          desc="尋找店家與設施"
          tint="hsl(150 70% 42%)"
        />
        <FeatureCard
          onClick={onOpenAI}
          icon={MessageCircle}
          title="AI 智慧客服"
          desc="即時解答疑問"
          tint="hsl(275 85% 60%)"
        />
      </div>

      <button
        onClick={() => onOpen("callbot")}
        className="group mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[hsl(190_85%_45%)]/40 bg-[hsl(190_85%_50%)]/5 p-4 text-left hover:bg-[hsl(190_85%_50%)]/10 active:scale-[0.99]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(190_85%_50%)]/15 text-[hsl(190_85%_38%)]">
          <PhoneCall className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{tr("呼叫 FlowCharge")}</div>
          <div className="text-[11px] text-muted-foreground">{tr("讓機器人前往您的位置")}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
      </button>
    </div>
  );
}

function FeatureCard({
  onClick,
  icon: Icon,
  title,
  desc,
  tint,
  badge,
  disabled,
}: {
  onClick: () => void;
  icon: typeof Coffee;
  title: string;
  desc: string;
  tint: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-white p-4 text-left transition active:scale-[0.98] ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-transparent hover:shadow-md"
      }`}
    >
      {badge && (
        <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {tr(badge)}
        </span>
      )}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in oklab, ${tint} 12%, transparent)`, color: tint }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-bold">{tr(title)}</div>
      <div className="-mt-1 text-[11px] text-muted-foreground">{tr(desc)}</div>
    </button>
  );
}

/* ============= Power Bank Rent Flow ============= */
type PBStep = "info" | "plan" | "pick" | "pay";
function PowerBankFlow({
  busy,
  banks,
  onRent,
}: {
  busy: boolean;
  banks: PowerBank[];
  onRent: (pb: PowerBank, plan: Plan) => void;
}) {
  const [step, setStep] = useState<PBStep>("info");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pb, setPb] = useState<PowerBank | null>(null);

  if (step === "info") {
    return (
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(238_82%_60%)]/12 text-[hsl(238_82%_60%)]">
            <BatteryCharging className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{tr("租借行動電源")}</h2>
            <p className="text-[11px] text-muted-foreground">
              {tr("目前 {{count}} 顆可租借", { count: banks.length })}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <SpecCell k="電池容量" v="10,000 mAh" />
          <SpecCell k="輸出" v="18W 快充" />
          <SpecCell k="接頭" v="USB-C · Lightning · Micro USB" />
          <SpecCell k="租借費用" v="NT$ 20 / 小時起" />
          <SpecCell k="當日上限" v="NT$ 100 / 日" />
          <SpecCell k="押金" v={tr("NT$ {{amount}}（歸還退還）", { amount: DEPOSIT })} />
        </dl>
        <div className="mt-3 rounded-xl bg-[hsl(238_82%_60%)]/6 p-3 text-[11px] leading-relaxed text-muted-foreground">
          {tr("逾期未還將依租借規則計算；歸還時按下「歸還行動電源」，機器人會前往收取。")}
        </div>
        <button
          onClick={() => setStep("plan")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(238_82%_60%)] py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30"
        >
          {tr("選擇租借方案")} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (step === "plan") {
    return (
      <div>
        <StepHead title="選擇租借方案" sub="依需求選擇最划算的時段" />
        <div className="mt-3 space-y-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPlan(p);
                setStep("pick");
              }}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-border p-4 text-left transition hover:border-[hsl(238_82%_60%)] hover:bg-[hsl(238_82%_60%)]/5"
            >
              <Clock className="h-8 w-8 text-[hsl(238_82%_60%)]" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">{tr(p.label)}</div>
                  {p.tag && (
                    <span className="rounded-full bg-[hsl(30_95%_55%)] px-2 py-0.5 text-[10px] font-bold text-white">
                      {tr(p.tag)}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{tr(p.hint)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-[hsl(238_82%_60%)]">NT$ {p.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div>
        <StepHead
          title="選擇行動電源"
          sub={`${tr("租借方案")}：${tr(plan?.label ?? "")} · NT$ ${plan?.price}`}
        />
        <div className="mt-3 space-y-2">
          {banks.length === 0 ? (
            <div className="rounded-xl bg-amber-50 p-4 text-center text-xs text-amber-800">
              {tr("目前沒有可租借的行動電源，請稍後再試。")}
            </div>
          ) : (
            banks.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setPb(b);
                  setStep("pay");
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-primary"
              >
                <BatteryIcon pct={b.battery} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{b.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {tr("電量 {{battery}}%", { battery: b.battery })}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // pay
  return (
    <PaymentSheet
      summary={[
        { k: "租借方案", v: tr(plan!.label) },
        { k: "行動電源", v: `${pb!.id}（${pb!.battery}%）` },
        { k: "租借費用", v: `NT$ ${plan!.price}` },
        { k: "押金（歸還退還）", v: `NT$ ${DEPOSIT}` },
      ]}
      total={plan!.price + DEPOSIT}
      cta={tr("確認付款並租借")}
      busy={busy}
      onPay={() => onRent(pb!, plan!)}
    />
  );
}

function SpecCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <dt className="text-[10px] text-muted-foreground">{tr(k)}</dt>
      <dd className="mt-0.5 text-xs font-semibold">{tr(v)}</dd>
    </div>
  );
}
function StepHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{tr(title)}</h2>
      {sub && <p className="text-[11px] text-muted-foreground">{tr(sub)}</p>}
    </div>
  );
}
function BatteryIcon({ pct }: { pct: number }) {
  if (pct >= 70) return <BatteryFull className="h-5 w-5 text-success" />;
  if (pct >= 35) return <BatteryMedium className="h-5 w-5 text-warning" />;
  return <BatteryLow className="h-5 w-5 text-destructive" />;
}

/* ============= Payment sheet ============= */
function PaymentSheet({
  summary,
  total,
  cta,
  busy,
  onPay,
}: {
  summary: { k: string; v: string }[];
  total: number;
  cta: string;
  busy: boolean;
  onPay: () => void;
}) {
  const [method, setMethod] = useState(PAYMENTS[0].id);
  const [processing, setProcessing] = useState(false);
  function pay() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay();
    }, 900); // simulate
  }
  return (
    <div>
      <StepHead title="訂單摘要" />
      <div className="mt-3 space-y-1.5 rounded-xl bg-secondary p-3 text-sm">
        {summary.map((r) => (
          <div key={r.k} className="flex justify-between">
            <span className="text-muted-foreground">{tr(r.k)}</span>
            <span className="font-medium">{tr(r.v)}</span>
          </div>
        ))}
        <div className="my-1 border-t border-border" />
        <div className="flex justify-between text-base font-bold">
          <span>{tr("總金額")}</span>
          <span>NT$ {total}</span>
        </div>
      </div>
      <div className="mt-4 text-xs font-semibold text-muted-foreground">{tr("付款方式")}</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {PAYMENTS.map((p) => {
          const I = p.icon;
          const active = method === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setMethod(p.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-[11px] font-medium transition ${
                active ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <I className="h-5 w-5" style={{ color: p.color }} />
              {tr(p.label)}
            </button>
          );
        })}
      </div>
      <button
        disabled={busy || processing}
        onClick={pay}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-blue-500/30 disabled:opacity-60"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {tr("付款處理中...")}
          </>
        ) : (
          cta
        )}
      </button>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {tr("此為示範環境，未實際扣款")}
      </p>
    </div>
  );
}

/* ============= Return ============= */
function ReturnPanel({
  emptySlots,
  busy,
  onReturn,
}: {
  emptySlots: number;
  busy: boolean;
  onReturn: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(238_82%_60%)]/10 text-[hsl(238_82%_60%)]">
        <PackageOpen className="h-8 w-8" />
      </div>
      <h2 className="mt-3 text-xl font-bold">{tr("歸還行動電源")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {tr("將行動電源上的 QR Code 對準掃描區，或呼叫機器人前來收取。")}
      </p>
      <div
        className={`mt-3 rounded-xl px-3 py-2 text-xs ${emptySlots > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
      >
        {emptySlots > 0
          ? tr("目前有 {{count}} 個空槽可歸還", { count: emptySlots })
          : tr("目前沒有空槽，暫停歸還")}
      </div>
      <div className="mt-5 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="text-center">
          <QrCode className="mx-auto h-10 w-10 opacity-50" />
          <div className="mt-2">{tr("📷 相機掃描區（模擬）")}</div>
        </div>
      </div>
      <button
        disabled={busy || emptySlots === 0}
        onClick={onReturn}
        className="mt-4 w-full rounded-xl bg-[hsl(238_82%_60%)] py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? tr("呼叫中...") : emptySlots === 0 ? tr("暫無可用空槽") : tr("呼叫機器人前來收回")}
      </button>
    </div>
  );
}

/* ============= Shop ============= */
function ShopPanel({
  cart,
  setCart,
}: {
  cart: Record<string, number>;
  setCart: (c: Record<string, number>) => void;
}) {
  const [tab, setTab] = useState<"drink" | "snack">("drink");
  const [detail, setDetail] = useState<ShopItem | null>(null);
  function change(id: string, delta: number) {
    setCart({ ...cart, [id]: Math.max(0, (cart[id] ?? 0) + delta) });
  }
  const items = SHOP.filter((x) => x.category === tab);
  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        <TabBtn
          active={tab === "drink"}
          onClick={() => setTab("drink")}
          icon={Coffee}
          label="飲料"
        />
        <TabBtn
          active={tab === "snack"}
          onClick={() => setTab("snack")}
          icon={Cookie}
          label="零食"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((it) => {
          const qty = cart[it.id] ?? 0;
          const out = it.stock === 0;
          return (
            <div
              key={it.id}
              className={`rounded-xl border border-border bg-white p-3 ${out ? "opacity-50" : ""}`}
            >
              <button onClick={() => setDetail(it)} className="block w-full text-left">
                <div className="text-3xl">{it.emoji}</div>
                <div className="mt-1 text-sm font-semibold">{tr(it.name)}</div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-bold text-[hsl(30_95%_45%)]">NT$ {it.price}</span>
                  {it.temp === "cold" && (
                    <span className="rounded-full bg-blue-100 px-1.5 text-[9px] text-blue-700">
                      {tr("冷")}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {out ? tr("已售完") : tr("庫存 {{count}}", { count: it.stock })}
                </div>
              </button>
              {out ? (
                <button
                  disabled
                  className="mt-2 w-full rounded-lg bg-muted py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {tr("已售完")}
                </button>
              ) : qty === 0 ? (
                <button
                  onClick={() => change(it.id, 1)}
                  className="mt-2 w-full rounded-lg bg-[hsl(30_95%_55%)] py-1.5 text-xs font-semibold text-white"
                >
                  {tr("加入購物車")}
                </button>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-secondary p-1">
                  <button
                    onClick={() => change(it.id, -1)}
                    className="rounded-md bg-background p-1"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold">{qty}</span>
                  <button onClick={() => change(it.id, 1)} className="rounded-md bg-background p-1">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {detail && (
        <ProductDetailModal
          item={detail}
          qty={cart[detail.id] ?? 0}
          onChange={(d) => change(detail.id, d)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Coffee;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
        active ? "bg-white text-foreground shadow" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {tr(label)}
    </button>
  );
}
function ProductDetailModal({
  item,
  qty,
  onChange,
  onClose,
}: {
  item: ShopItem;
  qty: number;
  onChange: (d: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center">
          <div className="text-7xl">{item.emoji}</div>
          <div className="mt-2 text-lg font-bold">{tr(item.name)}</div>
          <div className="text-2xl font-black text-[hsl(30_95%_45%)]">NT$ {item.price}</div>
        </div>
        <dl className="mt-4 space-y-1.5 rounded-xl bg-secondary p-3 text-xs">
          <Row k="容量/重量" v={item.desc} />
          <Row k="庫存" v={item.stock > 0 ? tr("{{count}} 件", { count: item.stock }) : "已售完"} />
          <Row k="保存方式" v={item.temp === "cold" ? "冷藏保存" : "常溫保存"} />
          <Row k="過敏原" v="請詳閱包裝標示" />
        </dl>
        {item.stock > 0 &&
          (qty === 0 ? (
            <button
              onClick={() => onChange(1)}
              className="mt-4 w-full rounded-xl bg-[hsl(30_95%_55%)] py-3 text-sm font-bold text-white"
            >
              {tr("加入購物車")}
            </button>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-2">
              <button onClick={() => onChange(-1)} className="rounded-lg bg-background p-2">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-base font-bold">{qty}</span>
              <button onClick={() => onChange(1)} className="rounded-lg bg-background p-2">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{tr(k)}</span>
      <span className="font-medium">{tr(v)}</span>
    </div>
  );
}

/* ============= Cart Bar with drawer ============= */
function CartBar({
  count,
  total,
  items,
  onSetCart,
  busy,
  onCheckout,
}: {
  count: number;
  total: number;
  items: { item: ShopItem; qty: number }[];
  onSetCart: (c: Record<string, number>) => void;
  busy: boolean;
  onCheckout: (total: number) => void;
}) {
  const [open, setOpen] = useState(false);
  function set(id: string, qty: number) {
    const next: Record<string, number> = {};
    items.forEach(({ item, qty: q }) => {
      next[item.id] = q;
    });
    next[id] = Math.max(0, qty);
    onSetCart(next);
  }
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button onClick={() => setOpen(true)} className="flex-1 text-left">
            <div className="text-xs text-muted-foreground">
              {tr("{{count}} 件商品 · 點擊查看", { count })}
            </div>
            <div className="text-lg font-bold">NT$ {total}</div>
          </button>
          <button
            disabled={busy}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[hsl(30_95%_55%)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" /> {tr("前往結帳")}
          </button>
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{tr("購物車")}</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {items.map(({ item, qty }) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="text-2xl">{item.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{tr(item.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      NT$ {item.price} × {qty}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                    <button
                      onClick={() => set(item.id, qty - 1)}
                      className="rounded-md bg-background p-1"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => set(item.id, qty + 1)}
                      className="rounded-md bg-background p-1"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => set(item.id, 0)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <PaymentSheet
                summary={items.map(({ item, qty }) => ({
                  k: `${tr(item.name)} × ${qty}`,
                  v: `NT$ ${item.price * qty}`,
                }))}
                total={total}
                cta={tr("確認付款並下單")}
                busy={busy}
                onPay={() => {
                  setOpen(false);
                  onCheckout(total);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============= Nav ============= */
function NavPanel({
  locations,
  currentCode,
  busy,
  onGo,
}: {
  locations: Location[];
  currentCode: string;
  busy: boolean;
  onGo: (l: Location) => void;
}) {
  const [q, setQ] = useState("");
  const dests = locations.filter((l) => l.code !== currentCode);
  const filtered = q
    ? dests.filter(
        (l) =>
          l.name.toLowerCase().includes(q.toLowerCase()) ||
          tr(l.name).toLowerCase().includes(q.toLowerCase()) ||
          l.code.toLowerCase().includes(q.toLowerCase()),
      )
    : dests;
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("搜尋店家、餐廳、洗手間或設施")}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {NAV_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setQ(tr(t))}
            className="rounded-full border border-border bg-white px-3 py-1 text-[11px] hover:border-[hsl(150_70%_42%)] hover:text-[hsl(150_70%_35%)]"
          >
            {tr(t)}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {tr("找不到符合結果")}
          </div>
        )}
        {filtered.map((l) => (
          <div
            key={l.code}
            className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(150_70%_42%)]/10 text-[hsl(150_70%_35%)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{tr(l.name)}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono uppercase">{l.code}</span>
                <span>{tr("· 營業中")}</span>
              </div>
            </div>
            <button
              disabled={busy}
              onClick={() => onGo(l)}
              className="flex items-center gap-1 rounded-lg bg-[hsl(150_70%_42%)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Navigation className="h-3 w-3" /> {tr("帶路")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============= CallBot ============= */
function CallBotPanel({
  busy,
  onCall,
}: {
  busy: boolean;
  onCall: (purpose: string, note: string) => void;
}) {
  const purposes = ["租借行動電源", "購買飲料或零食", "商場帶路", "AI 客服無法解決", "其他服務"];
  const [purpose, setPurpose] = useState(purposes[0]);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(190_85%_50%)]/15 text-[hsl(190_85%_38%)]">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{tr("呼叫 FlowCharge")}</h2>
          <p className="text-[11px] text-muted-foreground">{tr("預估到達時間 1~3 分鐘")}</p>
        </div>
      </div>
      <div className="mt-4 text-xs font-semibold text-muted-foreground">{tr("呼叫用途")}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {purposes.map((p) => (
          <button
            key={p}
            onClick={() => setPurpose(p)}
            className={`rounded-xl border p-2.5 text-xs font-medium transition ${
              purpose === p
                ? "border-[hsl(190_85%_45%)] bg-[hsl(190_85%_50%)]/10 text-[hsl(190_85%_35%)]"
                : "border-border"
            }`}
          >
            {tr(p)}
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs font-semibold text-muted-foreground">{tr("備註（選填）")}</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder={tr("例如：我在服務台旁的座位")}
        className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring"
      />
      <button
        disabled={busy}
        onClick={() => setConfirm(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(190_85%_45%)] py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 disabled:opacity-60"
      >
        <Bot className="h-4 w-4" /> {tr("呼叫 FlowCharge")}
      </button>
      {confirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-bold">{tr("確認呼叫？")}</div>
            <div className="mt-2 rounded-xl bg-secondary p-3 text-sm">
              <Row k="用途" v={purpose} />
              {note && <Row k="備註" v={note} />}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium"
              >
                {tr("取消")}
              </button>
              <button
                onClick={() => {
                  setConfirm(false);
                  onCall(purpose, note);
                }}
                className="flex-1 rounded-xl bg-[hsl(190_85%_45%)] py-2.5 text-sm font-bold text-white"
              >
                {tr("確認呼叫")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============= AI Chat ============= */
type ChatMsg = { role: "user" | "bot"; text: string; suggestStaff?: boolean };
function AIChatModal({
  onClose,
  onCallService,
}: {
  onClose: () => void;
  onCallService: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "您好！我是 FlowCharge AI 客服，可以協助您了解行動電源租借、商品購買、賣場位置等問題，請問有什麼可以幫您？",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [msgs]);

  function ask(q: string) {
    q = q.trim();
    if (!q) return;
    const { text, suggestStaff } = fakeReply(q);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text, suggestStaff }]);
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(275_85%_60%)]/15 text-[hsl(275_85%_60%)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">{tr("FlowCharge AI 客服")}</div>
              <div className="text-[11px] text-success">{tr("● 線上")}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i}>
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user" ? "bg-[hsl(275_85%_60%)] text-white" : "bg-secondary"
                  }`}
                >
                  {m.role === "bot" ? tr(m.text) : m.text}
                </div>
              </div>
              {m.suggestStaff && (
                <div className="mt-2 flex flex-col gap-2">
                  <button className="rounded-xl border border-border bg-white py-2 text-xs font-medium">
                    {tr("聯絡真人客服")}
                  </button>
                  <button
                    onClick={onCallService}
                    className="rounded-xl bg-[hsl(190_85%_45%)] py-2 text-xs font-bold text-white"
                  >
                    {tr("呼叫服務機器人")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex gap-1.5 overflow-x-auto">
            {QUICK_Q.map((q) => (
              <button
                key={q}
                onClick={() => ask(tr(q))}
                className="shrink-0 rounded-full bg-secondary px-3 py-1 text-[11px] hover:bg-secondary/70"
              >
                {tr(q)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder={tr("輸入問題...")}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
            <button
              onClick={() => ask(input)}
              className="rounded-xl bg-[hsl(275_85%_60%)] px-3 text-white"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function fakeReply(q: string): { text: string; suggestStaff?: boolean } {
  if (/(電源|充電|power|電池)/i.test(q))
    return {
      text: tr(
        "目前有 {{count}} 顆行動電源可租借，方案從 NT$20/小時到 NT$100/日。請到「租借行動電源」選擇即可。",
        { count: POWER_BANKS.length },
      ),
    };
  if (/(歸還|還|return)/i.test(q))
    return { text: tr("請進入「歸還行動電源」頁面，掃描電源上的 QR Code，或呼叫機器人前來收取。") };
  if (/(飲料|水|咖啡|drink|coffee|water)/i.test(q))
    return { text: tr("我們提供可樂、礦泉水、美式咖啡、檸檬紅茶，售價 NT$20~45。") };
  if (/(零食|洋芋片|巧克力|餅乾|snack|chips|chocolate)/i.test(q))
    return { text: tr("零食有洋芋片、巧克力、夾心餅乾、口香糖，NT$25~40。") };
  if (/(關門|營業|幾點|open|close|hours)/i.test(q))
    return { text: tr("商場營業時間為每日 11:00 – 22:00，週末延長至 22:30。") };
  if (/(廁所|洗手間|toilet)/i.test(q))
    return { text: tr("廁所位於各樓層電梯旁與服務台附近。使用「商場導航」我讓機器人帶您過去。") };
  if (/(停車|parking)/i.test(q))
    return { text: tr("地下 B1~B3 為停車場，前 30 分鐘免費，消費滿 NT$500 可折抵 1 小時。") };
  if (/(活動|優惠|折扣|event|sale|discount)/i.test(q))
    return { text: tr("本週美食街 85 折、指定品牌買一送一，詳情請至服務台。") };
  if (/(餐廳|吃|美食|restaurant|food)/i.test(q))
    return { text: tr("3F 為美食街，1F 有咖啡與輕食，可用「商場導航」查詢。") };
  if (/(hi|hello|你好|哈囉)/i.test(q))
    return { text: tr("您好！請問需要租借行動電源、購買商品，還是需要導航呢？") };
  return {
    text: tr("這個問題需要真人服務人員協助，是否為您聯絡服務台？"),
    suggestStaff: true,
  };
}

/* ============= Task Tracker (local Demo state or live API status) ============= */
function TaskTracker({
  rich,
  loc,
  onCancel,
  onDone,
}: {
  rich: RichTask;
  loc: Location;
  demo: boolean;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { language } = useLanguage();
  const demo = rich.demo === true;
  const [demoStage, setDemoStage] = useState<SimStage>("pending");

  useEffect(() => {
    if (!demo || !rich.demoTaskId) return;
    const refresh = () => {
      const task = getDemoState().tasks.find((item) => item.id === rich.demoTaskId);
      if (task) setDemoStage(task.stage);
    };
    refresh();
    const unsubscribe = subscribeDemoState(refresh);
    const timer = window.setInterval(() => advanceDemoTask(rich.demoTaskId!), 2200);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [demo, rich.demoTaskId]);

  const liveStage: SimStage =
    rich.db.status === "done"
      ? "completed"
      : rich.db.status === "in_progress"
        ? "moving"
        : "pending";
  const activeStage = demo ? demoStage : liveStage;
  const current = STAGES.find((stage) => stage.key === activeStage) ?? STAGES[0];
  const currentStageIndex = Math.max(
    0,
    STAGES.findIndex((stage) => stage.key === activeStage),
  );
  const finished =
    current.key === "completed" || rich.db.status === "cancelled" || rich.db.status === "failed";
  const terminalError = rich.db.status === "cancelled" || rich.db.status === "failed";
  const canCancel = demo || rich.db.status === "pending";
  const executing = !demo && rich.db.status === "in_progress";
  const arrived = currentStageIndex >= 3;

  const kindLabel = {
    powerbank: "行動電源租借",
    return: "歸還行動電源",
    shop: "商品訂單",
    nav: "商場導航",
    callbot: "呼叫機器人",
  }[rich.kind];

  return (
    <div>
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> {tr(kindLabel)}
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {tr("訂單 #{{number}}", { number: rich.extras?.orderNo ?? "—" })}
        </div>
        <h2 className="mt-1 text-xl font-black">
          {tr(
            rich.db.status === "cancelled"
              ? "任務已取消"
              : rich.db.status === "failed"
                ? "任務執行失敗"
                : current.label,
          )}
        </h2>
        <p className="text-xs text-muted-foreground">
          {tr(terminalError ? "如仍需要服務，請返回首頁重新建立任務。" : current.hint)}
        </p>
      </div>

      {/* Robot animation */}
      <div className="mt-5 flex justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-primary/5">
          {!arrived && currentStageIndex >= 1 && (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
              <span className="absolute inline-flex h-24 w-24 animate-pulse rounded-full bg-primary/10" />
            </>
          )}
          {arrived && !finished && (
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[hsl(30_95%_55%)]/30" />
          )}
          {terminalError ? (
            <X className="relative h-16 w-16 text-destructive" />
          ) : finished && current.key === "completed" ? (
            <CheckCircle2 className="relative h-16 w-16 text-success" />
          ) : (
            <Bot className="relative h-14 w-14 text-primary" />
          )}
        </div>
      </div>

      {/* Progress timeline */}
      <div className="mt-6 space-y-2">
        {STAGES.map((s, i) => {
          const done = i < currentStageIndex;
          const active = i === currentStageIndex;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className="flex-1">
                <div
                  className={`text-xs font-semibold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {tr(s.label)}
                </div>
              </div>
              {active && !finished && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
          );
        })}
      </div>

      {/* Kind-specific info panel */}
      {arrived && !finished && (
        <div className="mt-5 rounded-2xl border-2 border-[hsl(30_95%_55%)]/40 bg-[hsl(30_95%_55%)]/8 p-4 text-center">
          <div className="text-sm font-bold text-[hsl(30_95%_35%)]">{tr("FlowBot 已抵達")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {rich.kind === "powerbank" && tr("請從機器人取出口拿取行動電源")}
            {rich.kind === "shop" && tr("請從機器人商品出口拿取商品")}
            {rich.kind === "return" && tr("請將行動電源放入機器人歸還口")}
            {rich.kind === "nav" && tr("跟隨機器人前往目的地")}
            {rich.kind === "callbot" && tr("機器人已到達您的位置")}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[hsl(30_95%_45%)]">
            <ArrowRight className="h-5 w-5 animate-pulse" />
            <span className="text-xs font-bold">{tr("請取出物品")}</span>
          </div>
        </div>
      )}

      {/* Completed order QR */}
      {finished && current.key === "completed" && rich.kind === "powerbank" && (
        <div className="mt-5 rounded-2xl bg-secondary p-4 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl border-2 border-border bg-white">
            <QrCode className="h-16 w-16" />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">{tr("出示此 QR Code 歸還")}</div>
          {rich.extras?.plan && (
            <div className="mt-2 text-xs">
              <div>
                {rich.extras.powerBankId} · {tr(rich.extras.plan.label)}
              </div>
              <div className="text-muted-foreground">
                {new Date().toLocaleTimeString(language === "en" ? "en-US" : "zh-TW")} ·{" "}
                {tr("開始租借")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div className="mt-4 rounded-xl bg-secondary p-3 text-xs">
        <Row k="服務位置" v={loc.name} />
        {rich.extras?.destName && <Row k="目的地" v={rich.extras.destName} />}
        {rich.extras?.total !== undefined && <Row k="訂單金額" v={`NT$ ${rich.extras.total}`} />}
      </div>

      {/* Actions */}
      {!finished && canCancel ? (
        <button
          onClick={onCancel}
          className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-secondary"
        >
          {tr("取消任務")}
        </button>
      ) : executing ? (
        <div className="mt-4 rounded-xl bg-secondary px-3 py-3 text-center text-xs font-medium text-muted-foreground">
          {tr("機器人已開始執行，無法取消")}
        </div>
      ) : (
        <button
          onClick={onDone}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          {tr(terminalError ? "返回首頁" : "我看到機器人了 · 完成")}
        </button>
      )}
    </div>
  );
}
