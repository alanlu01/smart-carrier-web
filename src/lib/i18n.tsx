import { Languages } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "zh-TW" | "en";

const STORAGE_KEY = "smart-carrier-language";
let activeLanguage: Language = "zh-TW";

const EN = new Map<string, string>([
  ["室內定位 · QR Code 派發", "Indoor positioning · QR dispatch"],
  ["掃碼即刻", "Scan to instantly"],
  ["呼叫服務機器人", "call a service robot"],
  [
    "顧客掃 QR Code → 選擇需求 → 後端派任務 → 機器人自動導航到達。",
    "Scan a QR code → choose a service → dispatch a task → the robot navigates to you.",
  ],
  [
    "專為商場、餐廳、飯店設計的無 GPS 室內呼叫系統。",
    "A GPS-free indoor service system for malls, restaurants, and hotels.",
  ],
  ["開啟管理後台", "Open admin console"],
  ["預覽顧客呼叫頁", "Preview customer app"],
  ["系統流程", "How it works"],
  ["四個步驟，從顧客到機器人。", "Four steps from request to robot arrival."],
  ["掃 QR Code", "Scan QR code"],
  [
    "每個地點固定一組碼，等同室內座標。",
    "Each location has a fixed code linked to an indoor coordinate.",
  ],
  ["打開網頁", "Open the app"],
  ["自動辨識位置，一鍵呼叫。", "Your location is detected for one-tap service."],
  ["後端派發", "Cloud dispatch"],
  ["任務進入佇列，即時通知。", "Requests enter the queue with live updates."],
  ["機器人導航", "Robot navigation"],
  ["輪詢 API 領取任務並前往。", "The robot claims a task and navigates to it."],
  ["機器人 API", "Robot API"],
  [
    "Raspberry Pi / ROS2 每幾秒 GET 一次，領到任務就導航。",
    "The Raspberry Pi / ROS2 client polls for tasks and starts navigation.",
  ],
  ["管理後台", "Admin console"],
  ["DEMO 模式", "DEMO mode"],
  ["首頁", "Home"],
  ["任務佇列", "Task queue"],
  ["地點管理", "Locations"],
  ["完整 Demo 控制台", "Full demo console"],
  [
    "顧客端與管理端共用本機 Demo 狀態；可開兩個分頁同步展示。",
    "The customer and admin apps share local demo state across browser tabs.",
  ],
  ["重設 Demo 任務、庫存與機器人狀態？", "Reset demo tasks, inventory, and robot state?"],
  ["重設 Demo", "Reset demo"],
  ["確定刪除此任務？", "Delete this task?"],
  ["等待中", "Waiting"],
  ["執行中", "In progress"],
  ["今日完成", "Completed today"],
  ["最近任務", "Recent tasks"],
  ["即時更新中", "Live updates"],
  ["每 5 秒同步後端", "Syncing with the API every 5 seconds"],
  ["無法連線至後端服務，請稍後再試。", "Unable to reach the API. Please try again later."],
  ["目前沒有任務", "No tasks yet"],
  ["手動派發", "Dispatch"],
  ["標記完成", "Mark complete"],
  ["下一個模擬節點", "Next demo stage"],
  ["目前位置", "Current location"],
  ["基地", "Base"],
  ["車載電量", "Robot battery"],
  ["可租借", "Available"],
  ["可歸還槽", "Return slots"],
  [
    "緊急停止：載具不可接收新任務，請確認環境後復原。",
    "Emergency stop: the robot cannot accept tasks. Check the area before recovery.",
  ],
  ["完成", "Completed"],
  ["取消", "Cancelled"],
  ["失敗", "Failed"],
  ["刪除地點 {{code}}？", "Delete location {{code}}?"],
  ["已註冊地點", "Registered locations"],
  ["尚未新增地點", "No locations yet"],
  ["新增地點", "Add location"],
  ["地點代碼會嵌入 QR Code。", "The location code is embedded in its QR code."],
  ["代碼（英數字）", "Code (letters and numbers)"],
  ["名稱", "Name"],
  ["說明（可選）", "Description (optional)"],
  ["新增", "Add"],
  ["無法載入地點資料。", "Unable to load locations."],
  ["正式地點管理", "Production location management"],
  [
    "正式地點為導航資料，新增或刪除需要管理員驗證；公開網頁目前僅提供檢視。",
    "Production locations are navigation data. Adding or deleting them requires administrator authentication; the public site is currently read-only.",
  ],
  ["列印用 QR Code", "Printable QR codes"],
  [
    "每個地點對應一組固定 QR Code。掃描後會開啟顧客呼叫頁。",
    "Each location has a permanent QR code that opens the customer app.",
  ],
  ["A 區入口", "Zone A entrance"],
  ["一樓服務區 A1", "1F service area A1"],
  ["主要入口大廳", "Main entrance lobby"],
  ["美食街", "Food court"],
  ["美食區 F1", "Food area F1"],
  ["2F 美食街集合點", "2F food court meeting point"],
  ["電梯旁", "By the elevator"],
  ["展覽區 E1", "Exhibition area E1"],
  ["主電梯右側", "Right side of the main elevator"],
  ["服務台", "Information desk"],
  ["商店區 S1", "Retail area S1"],
  ["1F 服務中心", "1F service center"],
  ["智慧商場服務", "Smart mall services"],
  ["定位中...", "Locating..."],
  [
    "服務暫時無法連線，請稍後再試。",
    "The service is temporarily unavailable. Please try again later.",
  ],
  ["您目前位置", "Your location"],
  ["機器人待命中", "Robot standing by"],
  ["機器人執行任務中", "Robot handling a task"],
  ["機器人離線", "Robot offline"],
  ["槽位感測異常", "Slot sensor error"],
  ["車況載入中", "Loading robot status"],
  ["車況無法連線", "Robot status unavailable"],
  ["電量", "Battery"],
  ["返回首頁", "Back to services"],
  ["開啟 AI 客服對話", "Open AI assistant"],
  ["您好，需要什麼服務？", "Hello! How can we help?"],
  [
    "FlowCharge 可以協助您租借行動電源、購買飲料與零食、查詢商場路線，以及回答各種問題。",
    "FlowCharge can deliver power banks, drinks, and snacks, guide you through the mall, and answer questions.",
  ],
  ["最推薦", "Recommended"],
  ["租借行動電源", "Rent a power bank"],
  ["手機快沒電了？立即租借。", "Low on battery? Rent one now."],
  ["剩 {{count}} 顆", "{{count}} available"],
  ["NT$ 20 起 / 小時", "From NT$20 / hour"],
  ["歸還行動電源", "Return a power bank"],
  ["掃碼快速歸還", "Scan for a quick return"],
  ["飲料與零食", "Drinks & snacks"],
  ["機器人配送 Demo", "Robot delivery demo"],
  ["商場導航", "Mall navigation"],
  ["尋找店家與設施", "Find stores and facilities"],
  ["AI 智慧客服", "AI assistant"],
  ["即時解答疑問", "Get instant answers"],
  ["呼叫 FlowCharge", "Call FlowCharge"],
  ["讓機器人前往您的位置", "Send the robot to your location"],
  ["目前 {{count}} 顆可租借", "{{count}} currently available"],
  ["電池容量", "Capacity"],
  ["輸出", "Output"],
  ["18W 快充", "18W fast charging"],
  ["接頭", "Connectors"],
  ["租借費用", "Rental fee"],
  ["租借方案", "Rental plan"],
  ["NT$ 20 / 小時起", "From NT$20 / hour"],
  ["NT$ 100 / 日", "NT$100 / day"],
  ["當日上限", "Daily maximum"],
  ["押金", "Deposit"],
  ["NT$ {{amount}}（歸還退還）", "NT$ {{amount}} (refunded on return)"],
  [
    "逾期未還將依租借規則計算；歸還時按下「歸還行動電源」，機器人會前往收取。",
    "Late fees follow the rental policy. Choose “Return a power bank” and the robot will collect it.",
  ],
  ["選擇租借方案", "Choose a rental plan"],
  ["依需求選擇最划算的時段", "Pick the plan that fits your visit"],
  ["選擇行動電源", "Choose a power bank"],
  [
    "目前沒有可租借的行動電源，請稍後再試。",
    "No power banks are available. Please try again later.",
  ],
  ["電量 {{battery}}%", "{{battery}}% battery"],
  ["行動電源", "Power bank"],
  ["押金（歸還退還）", "Refundable deposit"],
  ["確認付款並租借", "Pay and rent"],
  ["訂單摘要", "Order summary"],
  ["總金額", "Total"],
  ["付款方式", "Payment method"],
  ["付款處理中...", "Processing payment..."],
  ["此為示範環境，未實際扣款", "Demo only — no payment will be charged"],
  [
    "將行動電源上的 QR Code 對準掃描區，或呼叫機器人前來收取。",
    "Scan the QR code on the power bank or call the robot to collect it.",
  ],
  ["目前有 {{count}} 個空槽可歸還", "{{count}} return slots are available"],
  ["目前沒有空槽，暫停歸還", "No return slots are currently available"],
  ["📷 相機掃描區（模擬）", "📷 Camera scan area (demo)"],
  ["呼叫中...", "Calling..."],
  ["暫無可用空槽", "No return slot available"],
  ["呼叫機器人前來收回", "Call robot for collection"],
  ["飲料", "Drinks"],
  ["零食", "Snacks"],
  ["冷", "Cold"],
  ["已售完", "Sold out"],
  ["庫存 {{count}}", "{{count}} in stock"],
  ["加入購物車", "Add to cart"],
  ["容量/重量", "Size / weight"],
  ["庫存", "Stock"],
  ["{{count}} 件", "{{count}} items"],
  ["保存方式", "Storage"],
  ["冷藏保存", "Keep refrigerated"],
  ["常溫保存", "Store at room temperature"],
  ["過敏原", "Allergens"],
  ["請詳閱包裝標示", "See package label"],
  ["{{count}} 件商品 · 點擊查看", "{{count}} items · Tap to review"],
  ["前往結帳", "Checkout"],
  ["購物車", "Cart"],
  ["確認付款並下單", "Pay and place order"],
  ["搜尋店家、餐廳、洗手間或設施", "Search stores, restaurants, restrooms, or facilities"],
  ["找不到符合結果", "No matching results"],
  ["· 營業中", "· Open"],
  ["帶路", "Guide me"],
  ["預估到達時間 1~3 分鐘", "Estimated arrival: 1–3 minutes"],
  ["呼叫用途", "Service needed"],
  ["備註（選填）", "Note (optional)"],
  ["例如：我在服務台旁的座位", "Example: I am seated beside the information desk"],
  ["確認呼叫？", "Confirm request?"],
  ["用途", "Purpose"],
  ["備註", "Note"],
  ["確認呼叫", "Confirm"],
  ["FlowCharge AI 客服", "FlowCharge AI assistant"],
  ["● 線上", "● Online"],
  ["聯絡真人客服", "Contact staff"],
  ["輸入問題...", "Type a question..."],
  ["商場幾點關門？", "When does the mall close?"],
  ["洗手間在哪裡？", "Where is the restroom?"],
  ["有哪些餐廳？", "What restaurants are available?"],
  ["最近有什麼活動？", "What events are happening?"],
  ["行動電源如何租借？", "How do I rent a power bank?"],
  ["停車場怎麼走？", "How do I get to the parking lot?"],
  [
    "您好！我是 FlowCharge AI 客服，可以協助您了解行動電源租借、商品購買、賣場位置等問題，請問有什麼可以幫您？",
    "Hello! I’m the FlowCharge AI assistant. I can help with power bank rentals, product orders, and mall directions. How can I help?",
  ],
  [
    "目前有 {{count}} 顆行動電源可租借，方案從 NT$20/小時到 NT$100/日。請到「租借行動電源」選擇即可。",
    "{{count}} power banks are available. Plans range from NT$20/hour to NT$100/day. Choose “Rent a power bank” to continue.",
  ],
  [
    "請進入「歸還行動電源」頁面，掃描電源上的 QR Code，或呼叫機器人前來收取。",
    "Open “Return a power bank,” scan its QR code, or call the robot to collect it.",
  ],
  [
    "我們提供可樂、礦泉水、美式咖啡、檸檬紅茶，售價 NT$20~45。",
    "We offer Coca-Cola, mineral water, Americano, and lemon black tea for NT$20–45.",
  ],
  [
    "零食有洋芋片、巧克力、夾心餅乾、口香糖，NT$25~40。",
    "Snacks include potato chips, chocolate, sandwich cookies, and chewing gum for NT$25–40.",
  ],
  [
    "商場營業時間為每日 11:00 – 22:00，週末延長至 22:30。",
    "The mall is open daily from 11:00 to 22:00, and until 22:30 on weekends.",
  ],
  [
    "廁所位於各樓層電梯旁與服務台附近。使用「商場導航」我讓機器人帶您過去。",
    "Restrooms are near the elevators and information desks on each floor. Use Mall navigation and the robot can guide you.",
  ],
  [
    "地下 B1~B3 為停車場，前 30 分鐘免費，消費滿 NT$500 可折抵 1 小時。",
    "Parking is on B1–B3. The first 30 minutes are free, and purchases over NT$500 include one hour of parking.",
  ],
  [
    "本週美食街 85 折、指定品牌買一送一，詳情請至服務台。",
    "This week the food court is 15% off, with buy-one-get-one offers at selected brands. Ask the information desk for details.",
  ],
  [
    "3F 為美食街，1F 有咖啡與輕食，可用「商場導航」查詢。",
    "The food court is on 3F, while coffee and light meals are on 1F. Use Mall navigation to explore.",
  ],
  [
    "您好！請問需要租借行動電源、購買商品，還是需要導航呢？",
    "Hello! Would you like to rent a power bank, order a product, or get directions?",
  ],
  [
    "這個問題需要真人服務人員協助，是否為您聯絡服務台？",
    "A staff member is best suited to answer this. Would you like me to contact the information desk?",
  ],
  ["已送出需求", "Request sent"],
  ["任務已建立", "Task created"],
  [
    "任務已開始或無法取消，請重新確認狀態。",
    "The task has started or cannot be cancelled. Please check its status.",
  ],
  ["任務已取消", "Task cancelled"],
  ["任務執行失敗", "Task failed"],
  [
    "如仍需要服務，請返回首頁重新建立任務。",
    "If you still need service, return to the home screen and create a new request.",
  ],
  ["已分配機器人", "Robot assigned"],
  ["FlowBot #01 接單", "FlowBot #01 accepted the task"],
  ["機器人前往中", "Robot en route"],
  ["預估 1~2 分鐘抵達", "Estimated arrival: 1–2 minutes"],
  ["機器人已抵達", "Robot arrived"],
  ["請留意周遭", "Please look for the robot"],
  ["服務進行中", "Service in progress"],
  ["請領取物品", "Please collect your item"],
  ["任務完成", "Task completed"],
  ["祝您有愉快的體驗", "Thank you for using FlowCharge"],
  ["商品訂單", "Product order"],
  ["呼叫機器人", "Call robot"],
  ["訂單 #{{number}}", "Order #{{number}}"],
  ["FlowBot 已抵達", "FlowBot has arrived"],
  ["請從機器人取出口拿取行動電源", "Collect the power bank from the robot outlet"],
  ["請從機器人商品出口拿取商品", "Collect your order from the robot outlet"],
  ["請將行動電源放入機器人歸還口", "Insert the power bank into the return slot"],
  ["跟隨機器人前往目的地", "Follow the robot to your destination"],
  ["機器人已到達您的位置", "The robot is at your location"],
  ["請取出物品", "Collect your item"],
  ["出示此 QR Code 歸還", "Show this QR code when returning"],
  ["開始租借", "Rental started"],
  ["服務位置", "Service location"],
  ["目的地", "Destination"],
  ["訂單金額", "Order total"],
  ["取消任務", "Cancel task"],
  [
    "機器人已開始執行，無法取消",
    "The robot has started the task and it can no longer be cancelled.",
  ],
  ["我看到機器人了 · 完成", "I see the robot · Complete"],
  ["1 小時方案", "1-hour plan"],
  ["臨時充電、短暫外出", "Quick charging for a short visit"],
  ["3 小時方案", "3-hour plan"],
  ["熱門", "Popular"],
  ["看場電影或吃頓飯", "Great for a movie or a meal"],
  ["當日方案", "Day pass"],
  ["最划算", "Best value"],
  ["一整天無限使用", "Use it throughout the day"],
  ["可口可樂", "Coca-Cola"],
  ["330ml 冷藏罐裝", "330 ml chilled can"],
  ["礦泉水", "Mineral water"],
  ["600ml 純淨水", "600 ml bottled water"],
  ["美式咖啡", "Americano"],
  ["現煮 350ml", "Freshly brewed, 350 ml"],
  ["檸檬紅茶", "Lemon black tea"],
  ["500ml 冷飲", "500 ml chilled drink"],
  ["洋芋片", "Potato chips"],
  ["原味厚切 60g", "Original thick-cut, 60 g"],
  ["巧克力", "Chocolate"],
  ["牛奶巧克力 40g", "Milk chocolate, 40 g"],
  ["夾心餅乾", "Sandwich cookies"],
  ["香草夾心 8 入", "8 vanilla sandwich cookies"],
  ["口香糖", "Chewing gum"],
  ["薄荷 12 粒", "12 mint pieces"],
  ["洗手間", "Restroom"],
  ["電梯", "Elevator"],
  ["手扶梯", "Escalator"],
  ["出口", "Exit"],
  ["停車場", "Parking"],
  ["育嬰室", "Nursing room"],
  ["無障礙設施", "Accessible facilities"],
  ["信用卡", "Credit card"],
  ["悠遊卡", "EasyCard"],
  ["一卡通", "iPASS"],
  ["租借行動電源", "Rent a power bank"],
  ["購買飲料或零食", "Buy drinks or snacks"],
  ["商場帶路", "Mall guidance"],
  ["AI 客服無法解決", "AI could not resolve my question"],
  ["其他服務", "Other service"],
  ["行動電源租借", "Power bank rental"],
  ["行動電源歸還", "Power bank return"],
  ["使用者歸還行動電源", "Customer returning a power bank"],
  ["商品配送", "Product delivery"],
  ["服務呼叫", "Service request"],
  ["待命", "Idle"],
  ["配送中", "Dispatching"],
  ["已抵達", "Arrived"],
  ["返航", "Returning"],
  ["充電", "Charging"],
  ["自主巡邏", "Autonomous patrol"],
  ["人工操控", "Manual control"],
  ["緊急停止", "Emergency stop"],
  ["空槽", "Empty slot"],
  ["充電中", "Charging"],
  ["使用中", "In use"],
  ["已完成自我檢查，待命中", "Self-check complete; standing by"],
  [
    "Demo 模式啟動：FlowBot #01 已完成自我檢查",
    "Demo started: FlowBot #01 completed its self-check",
  ],
  ["任務已取消，重新待命", "Task cancelled; standing by"],
  ["管理者已手動派發任務", "Task manually dispatched by operator"],
  ["Nav2 路徑規劃完成，載具前往服務點", "Nav2 route ready; robot heading to the service point"],
  ["已抵達服務點，等待使用者操作", "Arrived at the service point; waiting for the user"],
  ["請將行動電源插入空槽", "Insert the power bank into an empty slot"],
  ["請依畫面指示完成取用", "Follow the on-screen instructions to collect your item"],
  ["任務完成，回到待命狀態", "Task complete; returning to idle"],
  ["緊急停止已觸發，等待管理者復原", "Emergency stop activated; waiting for operator recovery"],
  [
    "網址缺少 location 參數，請重新掃描 QR Code。",
    "The location parameter is missing. Please scan the QR code again.",
  ],
  ["呼叫失敗，請再試一次", "Request failed. Please try again."],
]);

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

export function tr(source: string, values?: Record<string, string | number>): string {
  const template = activeLanguage === "en" ? (EN.get(source) ?? source) : source;
  if (activeLanguage === "en") {
    const rental = source.match(/^租借 (.+)（電量 (\d+)%）· (.+) NT\$(\d+)$/);
    if (rental) {
      return `Rent ${rental[1]} (${rental[2]}% battery) · ${tr(rental[3])} NT$${rental[4]}`;
    }
    const guidance = source.match(/^帶路至 (.+)（(.+)）$/);
    if (guidance) return `Guide to ${tr(guidance[1])} (${guidance[2]})`;
    const shopOrder = source.match(/^(.+) · 共 NT\$(\d+)$/);
    if (shopOrder) {
      const items = shopOrder[1]
        .split("、")
        .map((item) => {
          const match = item.match(/^(.+)x(\d+)$/);
          return match ? `${tr(match[1])} × ${match[2]}` : tr(item);
        })
        .join(", ");
      return `${items} · Total NT$${shopOrder[2]}`;
    }
    const received = source.match(/^收到(.+)：(.+)$/);
    if (received) return `New ${tr(received[1])}: ${tr(received[2])}`;
    const modeChanged = source.match(/^管理者切換至(.+)模式$/);
    if (modeChanged) return `Operator switched to ${tr(modeChanged[1])} mode`;
    const patterns: Array<[RegExp, string]> = [
      [/^找不到地點代碼「(.+)」$/, "Location code “$1” was not found"],
      [/^已接單，前往 (.+)$/, "Task accepted; heading to $1"],
      [/^任務 (.+) 已取消$/, "Task $1 cancelled"],
      [/^任務 (.+) 已完成，庫存與訂單同步更新$/, "Task $1 completed; inventory updated"],
    ];
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(template))
        return interpolate(template.replace(pattern, replacement), values);
    }
  }
  return interpolate(template, values);
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "zh-TW";
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh-TW";
  });
  activeLanguage = language;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "en" ? "en" : "zh-Hant";
    document.title =
      language === "en" ? "Smart Carrier — Smart Energy Delivery" : "Smart Carrier — 智慧能源配送";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "en" ? "zh-TW" : "en")),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function LanguageToggle({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "en" ? "切換成中文" : "Switch to English"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        light
          ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
          : "border border-border bg-card text-foreground hover:bg-muted"
      } ${className}`}
    >
      <Languages className="h-3.5 w-3.5" />
      {language === "en" ? "中文" : "EN"}
    </button>
  );
}
