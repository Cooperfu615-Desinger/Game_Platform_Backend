# 🔬 系統健康檢查報告（Technical Audit Report）

> **稽核日期**：2026-01-23
> **稽核標準**：`QA_PROTOCOLS.md`
> **稽核範圍**：`src/` 目錄全部代碼

---

## 📊 總覽摘要（Executive Summary）

| 類別 | 發現問題數 | 嚴重度分布 |
|------|-----------|-----------|
| QA 協議違規 | 6 項 | 🔴 2 / 🟡 3 / 🔵 1 |
| 型別安全問題 | 50+ 處 | 🟡 中度風險 |
| 內聯樣式違規 | 18 處 | 🔵 低度風險 |
| 硬編碼文字 | 40+ 處 | 🔴 高度風險 |
| i18n 缺漏 | 220+ key | 🟡 中度風險 |

---

## 1. QA 協議合規性（Protocol Compliance）

### 🔴 嚴重違規（Critical Violations）

#### 1.1 `[違反 QA 協議]` Hardcoded Text（硬編碼中文字串）

**違反規則**：QA_PROTOCOLS.md §2-A-2：「是否有寫死的中文字串？(應預留 i18n 結構或集中管理)」

**發現位置與範例**：

| 檔案 | 行號 | 違規內容 |
|------|------|---------|
| `MyInvoices.vue` | L56 | `return '折合約 ${usdt} USDT'` |
| `MyInvoices.vue` | L176 | `message.warning('請輸入有效金額')` |
| `MyInvoices.vue` | L193 | `message.error('提交失敗')` |
| `MyInvoices.vue` | L201 | `message.warning('請輸入交易序號')` |
| `MyInvoices.vue` | L224 | `message.error('提交失敗')` |
| `MyInvoices.vue` | L232 | `message.warning('請輸入有效額度')` |
| `MyInvoices.vue` | L346 | `placeholder="請輸入交易序號"` |
| `MyInvoices.vue` | L349 | `>取消</n-button>` |
| `MyInvoices.vue` | L367 | `placeholder="請輸入區塊鏈交易序號"` |
| `MyInvoices.vue` | L370 | `>上傳圖片 (模擬)</n-button>` |
| `MyInvoices.vue` | L388 | `placeholder="請說明調額理由"` |
| `Dashboard/Index.vue` | L43 | `>前往處理</n-button>` |
| `Configuration.vue` | L41-44 | `title: '警告：重置密鑰'` 等對話框文字 |
| `Configuration.vue` | L62-65 | `title: '警告：切換錢包模式'` 等對話框文字 |
| `Configuration.vue` | L77-80 | `title: '安全性警告'` 等對話框文字 |

**影響範圍**：約 40+ 處硬編碼中文字串，分布於 Merchant 與 Master 後台。

---

#### 1.2 `[違反 QA 協議]` Type Safety - 過多的 `any` 類型

**違反規則**：QA_PROTOCOLS.md §2-A-3：「TypeScript 是否有過多的 `any`？」

**統計數據**：共發現 **50+ 處** `any` 類型使用。

**關鍵違規位置**：

| 分類 | 檔案 | 問題說明 |
|------|------|---------|
| **型別定義** | `types/provider.ts:12` | `[key: string]: any` — API 配置使用開放式 any |
| **型別定義** | `types/system.ts:50` | `details: any` — 審計日誌詳情未定義型別 |
| **Mock 資料** | `mocks/handlers.ts:64` | `mockProviders: any[]` — 供應商 Mock 未使用 Provider 介面 |
| **Mock 資料** | `mocks/system.ts:82,85` | `auditLogs: any[]` 與 `details: any` |
| **Mock 資料** | `mocks/finance.ts:5,98` | `invoices: any[]` 與動態 map |
| **元件邏輯** | `Merchant/Dashboard/Index.vue:73` | `stats = ref<any>({...})` — 統計資料未定義介面 |
| **元件邏輯** | `TransactionDetailDrawer.vue:46,63,70,77` | DataTable render 函式使用 `row: any` |
| **渲染函式** | `config/menu-master.ts:19` | `renderIcon = (icon: any)` |
| **渲染函式** | `config/menu-merchant.ts:17` | `renderIcon = (icon: any)` |
| **錯誤處理** | `composables/*.ts` 全部 | `catch (err: any)` — 錯誤型別未定義 |

---

### 🟡 警告（Warning）

#### 1.3 `[違反 QA 協議]` Magic Styles（內聯樣式）

**違反規則**：QA_PROTOCOLS.md §2-A-1：「是否偷用了 `style="..."` 而非 Tailwind utility？」

**發現數量**：18 處

**高風險範例**：

| 檔案 | 行號 | 違規內容 |
|------|------|---------|
| `MerchantLayout.vue` | L91 | `style="background-color: #18181c;"` |
| `MasterLayout.vue` | L82 | `style="background-color: #001428;"` |
| `BetLog.vue` | L249 | `style="height: calc(100vh - 80px);"` |
| `MyInvoices.vue` | L336,358,382 | `style="width: 400px/450px;"` — Modal 寬度 |
| `SubAgentList.vue` | L296 | `style="width: 600px"` |
| `MaintenanceSettingsModal.vue` | L75 | `style="width: 500px"` |

**建議**：應使用 Tailwind 的 `w-[]` 或 `max-w-[]` 類替代固定寬度內聯樣式。

---

#### 1.4 多語系同步不一致

**問題**：`zh-TW.json` (794 行) 與 `en.json` (573 行) 結構不對稱。

**缺失項目分析**：

| 缺失 Key（en.json） | 說明 |
|---------------------|------|
| `login.appName`, `login.placeholderUsername`, `login.placeholderPassword`, `login.quickLogin`, `login.masterAdmin`, `login.merchant`, `login.authenticating` | 登入頁缺失 7 個 key |
| `agent.account`, `agent.balance`, `agent.state` | 代理模組缺失 3 個 key |
| `invoices.financeCenter` ~ `invoices.requestPending` | 發票模組缺失 16+ 個 key |
| `merchantDashboard.welcome` ~ `merchantDashboard.quickActions.*` | 商戶儀表板缺失 12+ 個 key |
| `myGames.*` 整個 namespace | 完全缺失 |
| `betQuery.*` 整個 namespace | 完全缺失 |
| `subAgents.*` 整個 namespace | 完全缺失 |
| `dateRange.*` 整個 namespace | 完全缺失 |
| `audit.*` 整個 namespace | 完全缺失 |
| `finance.funds.*` 整個 namespace | 完全缺失 |
| `system.settingsUpdated`, `system.maintenanceDesc`, `system.perm.*` 多項 | 系統模組缺失 10+ 個 key |

**估計缺失**：`en.json` 相較 `zh-TW.json` 缺少約 **220+ key**。

---

#### 1.5 Mock 資料型別一致性問題

**問題**：Mock 資料結構與 TypeScript Interface 定義存在不一致。

**範例**：

| Mock 檔案 | Interface | 差異說明 |
|-----------|-----------|---------|
| `handlers.ts` L64 | `types/provider.ts` | `mockProviders: any[]` 未使用 `Provider` 介面 |
| `finance.ts` L5 | 未定義 | `invoices: any[]` 無對應介面 |
| `system.ts` L82 | `types/system.ts` | `auditLogs` 使用 any[] 而非 `AuditLog[]` |

---

### 🔵 建議（Suggestion）

#### 1.6 元件層級備註語言混用

**發現**：部分 Vue 元件中的 HTML 註解使用中文，應統一使用英文或移至 i18n。

**範例**：

- `MyInvoices.vue` L280: `<!-- 錢包看板 -->`
- `BetLog.vue` L260, L265, L287: `<!-- Row 1: 時間選擇器... -->`

---

## 2. 系統架構與型別安全（Architecture & Type Safety）

### 2.1 雙邊後台型別定義評估

| 維度 | 評估結果 | 說明 |
|------|----------|------|
| **重複定義** | ⚠️ 中度風險 | `Merchant` 與 `Agent` 介面有部分欄位重疊（如 `balance`, `state`, `account`），但目前分開定義，合理 |
| **共用介面** | ✅ 良好 | `BetLog`, `FinancialReportItem` 等報表型別可跨後台共用 |
| **`any` 使用** | ❌ 需改善 | 50+ 處 any 使用，違反 Tech Standards |

### 2.2 元件共用性評估

| 共用元件 | 使用情況 | 建議 |
|----------|----------|------|
| `MoneyText.vue` | ✅ 雙邊共用 | 良好 |
| `DateRangePicker.vue` | ✅ 雙邊共用 | 良好 |
| `CopyableText.vue` | ✅ 雙邊共用 | 良好 |
| `JsonViewer.vue` | ⚠️ 使用 any | 需定義 `data` prop 型別 |
| `RTPSelector.vue` | ⚠️ catch(e: any) | 需改善錯誤處理型別 |

---

## 3. 資料流與 Mock 一致性（Data Integrity & Mocking）

### 3.1 Master vs Merchant 資料同步評估

| 功能模組 | 同步狀態 | 問題說明 |
|----------|----------|---------|
| **遊戲列表** | ✅ 一致 | `mockGames` 統一來源 |
| **供應商** | ✅ 一致 | `mockProviders` 統一來源 |
| **錢包餘額** | ⚠️ 潛在不一致 | Master 的 `FundManagement` 與 Merchant 的 `MyInvoices` 分別維護 wallet mock |
| **帳單資料** | ⚠️ 潛在不一致 | `finance.ts` 中 `invoices` 與 agent mock 的帳單可能不同步 |

### 3.2 財務相關資料結構隱憂

| 隱憂項目 | 風險等級 | 說明 |
|----------|----------|------|
| **幣種處理** | 🟡 中度 | `Merchant.currency_type` 為 `'TWD' \| 'CNY' \| 'USD'`，但 Mock 中有些使用 `'EUR'` |
| **金額精度** | 🟡 中度 | 使用 `toFixed(2)` 處理，但無 Decimal 庫保護精度 |
| **匯率計算** | 🔵 低度 | 目前 Mock 中 `exchangeRate` 固定為 `1.0`，缺乏多幣種測試資料 |

---

## 4. 多國語系與介面體驗（i18n & UI/UX Consistency）

### 4.1 語系檔缺漏分析

```
zh-TW.json: 794 行
en.json:    573 行
差異:       ~220 key 缺失
```

**主要缺失區塊**：

1. `login.*` — 7 key
2. `merchantDashboard.*` — 12+ key
3. `myGames.*` — 完整 namespace（22 key）
4. `betQuery.*` — 完整 namespace（12 key）
5. `subAgents.*` — 完整 namespace（5 key）
6. `dateRange.*` — 完整 namespace（4 key）
7. `audit.*` — 完整 namespace（18 key）
8. `finance.funds.*` — 完整子 namespace（17 key）
9. `invoices.*` 擴展欄位 — 16+ key
10. `provider.rules.*`, `provider.addProvider` — 10+ key

### 4.2 i18n Key 命名一致性問題

| 問題類型 | 範例 | 建議 |
|----------|------|------|
| **Namespace 重複** | `common.betLog.*` vs `betLog.*` | 應統一，移除 `common.betLog` |
| **命名不一致** | `merchantReports.title` vs `report.title` | 應統一命名規則 |
| **嵌套過深** | `merchant.fundRecord.types.topUp` | 考慮扁平化 |

---

## 5. 重構行動清單（Refactoring Action Items）

### 🏆 Top 3 優先重構模組

#### #1 🔴 `src/views/Merchant/Finance/MyInvoices.vue`

**優先級**：P0（立即處理）
**問題數量**：15+ 項違規
**理由**：

- 硬編碼中文字串最密集的檔案
- 多處 `style=""` 內聯樣式
- 財務模組屬於核心功能，品質要求最高

**建議修復**：

1. 將所有硬編碼字串移至 `zh-TW.json`
2. 將 Modal 寬度改為 Tailwind `max-w-md` 或 `w-[450px]`
3. 新增對應 `en.json` 翻譯

---

#### #2 🟡 `src/mocks/*.ts` 型別定義

**優先級**：P1（本週處理）
**問題數量**：10+ 項 `any` 使用
**理由**：

- Mock 資料直接影響前端開發與測試
- 型別不一致會導致執行時期錯誤
- 違反 QA_PROTOCOLS.md §4 驗收標準：「模擬資料結構符合 TypeScript Interface」

**建議修復**：

1. `handlers.ts:64` — `mockProviders: any[]` → `mockProviders: Provider[]`
2. `finance.ts:5` — 建立 `Invoice` 介面並套用
3. `system.ts:82` — 使用 `AuditLog[]` 替代 `any[]`

---

#### #3 🟡 `src/locales/en.json` 多語系補齊

**優先級**：P1（本週處理）
**問題數量**：220+ 缺失 key
**理由**：

- 國際化為產品擴展基礎
- 缺失 key 會導致介面顯示 raw key（如 `betQuery.title`）
- 影響非中文用戶體驗

**建議修復**：

1. 以 `zh-TW.json` 為基準逐一補齊
2. 確保所有 namespace 結構對稱
3. 移除 `common.betLog` 重複 namespace

---

## 📝 附錄：QA 協議對照表

| 協議規則 | 對應章節 | 合規狀態 |
|----------|----------|----------|
| §2-A-1 Magic Styles | 1.3 | ⚠️ 18 處違規 |
| §2-A-2 Hardcoded Text | 1.1 | ❌ 40+ 處違規 |
| §2-A-3 Type Safety | 1.2 | ❌ 50+ 處違規 |
| §2-A-4 Component Usage | N/A | ✅ Naive UI 使用正確 |
| §4 驗收標準: No Console Errors | N/A | ⏳ 未測試 |
| §4 驗收標準: Mock 符合 Interface | 3.1 | ⚠️ 部分不符 |

---

> **報告完成時間**：2026-01-23 08:57 (UTC+8)
> **稽核員**：QA Sentinel / Tech Lead
