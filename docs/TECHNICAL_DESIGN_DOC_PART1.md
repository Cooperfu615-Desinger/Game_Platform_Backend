# 📋 技術設計文件 (TDD) - Part 1: 核心架構與資料模型

> **文件狀態**: Draft
> **撰寫日期**: 2026-01-23
> **目標讀者**: 後端開發人員、前端接手人員
> **專案版本**: 0.0.1 (Phase 10.1 Completed)

---

## 1. 系統架構與規範 (System Architecture)

### 1.1 技術棧 (Tech Stack)

本專案採用 **Vue 3 + Vite** 為核心，強調高效能與開發體驗，並透過 **MSW** 實現前後端分離開發模式。

| 領域 | 技術/庫 | 版本 | 用途描述 |
|------|--------|------|----------|
| **Core** | Vue 3 (Script Setup) | ^3.5.24 | 核心框架，全面採用 Composition API。 |
| **Build** | Vite | ^6.0.1 | 極速建置工具與開發伺服器。 |
| **Language** | TypeScript | ~5.6.3 | 強型別語言，保障大型專案的可維護性。 |
| **UI** | Naive UI | ^2.40.3 | 企業級 UI 元件庫，支援動態主題 (Dark/Light)。 |
| **Styling** | Tailwind CSS | ^3.4.15 | Utility-first CSS，負責佈局與響應式設計。 |
| **State** | Pinia | ^2.3.0 | 輕量化狀態管理，取代 Vuex。 |
| **Routing** | Vue Router | ^4.5.0 | 單頁應用 (SPA) 路由管理與權限守衛。 |
| **i18n** | Vue I18n | ^10.0.5 | 國際化支援 (zh-TW, en)。 |
| **Charts** | ECharts | ^5.5.1 | 用於繪製高性能數據報表 (營收趨勢、遊戲佔比)。 |
| **Mock** | MSW (Mock Service Worker) | ^2.6.4 | 攔截網路請求，模擬真實後端 API 回應。 |

### 1.2 目錄結構設計 (Directory Structure)

專案採用 **雙後台 (Dual-Portal)** 架構，將總控端 (Master) 與商戶端 (Merchant) 的視圖與邏輯清晰分離，但共用底層元件與型別。

```text
src/
├── components/          # 全域共用元件
│   ├── Common/          # 基礎 UI 封裝 (如狀態標籤、金額顯示)
│   └── ...
├── layouts/             # 應用程式佈局
│   ├── MasterLayout.vue   # 總控端佈局 (深色主題，強調監控)
│   ├── MerchantLayout.vue # 商戶端佈局 (淺色主題，強調操作)
│   └── AppMenu.vue        # 遞迴式側邊選單
├── views/               # 頁面視圖 (Views)
│   ├── Master/            # 👑 總控後台頁面 (商戶管理、風控、系統設定)
│   └── Merchant/          # 💼 商戶後台頁面 (營收報表、下級代理、財務)
├── types/               # TypeScript 型別定義 (核心合約)
│   ├── merchant.ts        # 商戶、錢包模式定義
│   ├── provider.ts        # 遊戲供應商與合約配置
│   ├── finance.ts         # 帳單、資金記錄、發票
│   ├── table.ts           # DataTable 通用列定義 (Row Types)
│   └── system.ts          # RBAC、審計日誌、系統設定
├── mocks/               # MSW API 模擬
│   ├── handlers.ts        # Master API 主要處理器
│   ├── agent.ts           # Merchant API 處理器
│   ├── finance.ts         # 財務相關 API
│   └── system.ts          # 系統權限與日誌 API
├── locales/             # 語系檔 (zh-TW, en)
└── stores/              # Pinia 狀態 Store (Auth, etc.)
```

### 1.3 核心共用元件 (Shared Components)

位於 `src/components/Common/`，是統一 UI 風格的關鍵。

1. **`StatusBadge.vue`**
    * **用途**: 顯示狀態標籤 (Active/Inactive/Pending)。
    * **特色**: 自動映射狀態碼至顏色 (Green/Red/Orange)，支援 i18n。
2. **`MoneyText.vue`**
    * **用途**: 統一金額顯示格式。
    * **特色**: 支援千分位、貨幣符號、正負數自動著色 (盈虧紅綠)。
3. **`CopyableText.vue`**
    * **用途**: 顯示並允許一鍵複製 (如 UUID, TxID)。
    * **特色**: 整合 icon 與 tooltip 提示。
4. **`PageFilterBar.vue`**
    * **用途**: 標準化列表頁面的搜尋與篩選區塊。

---

## 2. 核心資料模型 (Data Models)

### 2.1 Merchant (商戶設定)

定義於 `src/types/merchant.ts`。

```typescript
interface Merchant {
    id: number;
    display_id: string;        // 顯示 ID (如 OP-1001)
    site_code: string;         // 站點代碼 (唯一，如 GP1)
    secretKey?: string;        // API 金鑰 (用於簽章)
    walletMode?: 'seamless' | 'transfer'; // 錢包模式 (單一錢包/轉帳錢包)
    currency_type: string;     // 結算貨幣 (USD, CNY, TWD)
    revenue_share?: number;    // 平台抽成比例 (%)
    ipWhitelist?: string[];    // API 呼叫白名單
    account: string;           // 管理員帳號
    state: number;             // 狀態 (1: 啟用, 0: 停用)
}
```

### 2.2 Provider (供應商配置)

定義於 `src/types/provider.ts`。

```typescript
interface Provider {
    code: string;              // 供應商代碼 (如 pg, evo)
    name: string;              // 顯示名稱 (PG Soft)
    status: 'active' | 'maintenance'; // 全域狀態
    apiConfig: {
        merchantCode?: string; // 供應商分配的商戶號
        secretKey?: string;    // 對接金鑰
        currency?: string;     // 介接貨幣
    };
    contractConfig?: {         // 平台與供應商的合約
        rules: {
            slot_free_spin: { enabled: boolean; provider_share: number }; // 成本分攤規則
        };
    };
}
```

### 2.3 Invoice (帳單)

定義於 `src/types/finance.ts`。

```typescript
interface Invoice {
    id: string;                // 帳單號 (INV-YYYYMM-XXXX)
    merchant_id: string;
    period: string;            // 帳期 (YYYY-MM)
    total_ggr: number;         // 總殺數 (Gross Game Revenue)
    commission_rate: number;   // 抽成費率 (%)
    amount_due: number;        // 應繳金額 (GGR * Rate)
    status: 'pending' | 'paid' | 'verifying';
    breakdown?: InvoiceBreakdown[]; // 依供應商拆分細項
}
```

### 2.4 FundRecord (資金與調帳)

定義於 `src/types/finance.ts`。

```typescript
interface FundRecord {
    id: string;
    type: 'top-up' | 'credit-limit' | 'manual-adjust'; // 充值 | 調額 | 人工對帳
    amount: number;            // 金額
    status: 'pending' | 'approved' | 'rejected';
    proof?: string;            // 匯款證明 (URL)
    reason?: string;           // 申請或拒絕理由
    reviewer?: string;         //審核人員
}
```

---

## 3. 後端 API 對接清單 (API Endpoint Spec)

以下 API 目前由 `src/mocks/*.ts` 模擬，後端需依此規格實作。

### 3.1 Master Admin (總控端) - 核心

| Method | Endpoint | 描述 | 對應前端 Views |
|--------|----------|------|----------------|
| `POST` | `/api/login` | 管理員/商戶登入 (回傳 JWT 與 Role) | `Auth/Login.vue` |
| `GET` | `/api/v2/report/dashboard` | 取得全域戰情數據 (KPI, 7日趨勢, 佔比) | `Master/Dashboard/Index.vue` |
| `POST` | `/api/v2/agent/management/agents` | 建立新商戶 (開站) | `Master/Merchant/List.vue` (Modal) |
| `GET` | `/api/v2/merchant/:id/providers` | 取得指定商戶的遊戲開通狀態 | `Master/Merchant/Detail.vue` |
| `POST` | `/api/v2/merchant/:id/providers` | 設定商戶的遊戲開通與抽成 | `Master/Merchant/Detail.vue` |

### 3.2 System & Config (系統設定)

| Method | Endpoint | 描述 | 對應前端 Views |
|--------|----------|------|----------------|
| `GET` | `/api/admin/job-levels` | 取得職級列表與權限 | `Master/System/JobLevelList.vue` |
| `POST` | `/api/admin/job-levels` | 新增/修改職級 | `Master/System/JobLevelList.vue` |
| `GET` | `/api/v2/system/staff` | 取得員工列表 | `Master/System/StaffList.vue` |
| `POST` | `/api/v2/system/staff` | 新增/修改員工帳號 | `Master/System/StaffList.vue` |
| `GET` | `/api/v2/system/audit-logs` | 查詢系統審計日誌 | `Master/System/AuditLogs.vue` |
| `GET` | `/api/v2/system/settings` | 取得全域設定 (維護模式, IP 白名單) | `Master/System/SystemSettings.vue` |
| `POST` | `/api/v2/system/settings` | 更新全域設定 | `Master/System/SystemSettings.vue` |

### 3.3 Merchant Portal (商戶端)

| Method | Endpoint | 描述 | 對應前端 Views |
|--------|----------|------|----------------|
| `GET` | `/api/v2/agent/stats` | 取得商戶個人儀表板數據 | `Merchant/Dashboard/Index.vue` |
| `GET` | `/api/v2/agent/credentials` | 取得 API Key 與 IP 白名單 | `Merchant/Developer/Index.vue` |
| `POST` | `/api/v2/agent/white-list` | 更新 IP 白名單 | `Merchant/Developer/Index.vue` |
| `POST` | `/api/v2/agent/regenerate-key`| 重置 Secret Key (危險操作) | `Merchant/Developer/Index.vue` |
| `POST` | `/api/v2/agent/report/daily` | 查詢每日營收報表 | `Merchant/Reports/RevenueReport.vue` |
| `POST` | `/api/v2/agent/invoices` | 查詢歷史帳單 | `Merchant/Finance/MyInvoices.vue` |
| `GET` | `/api/v2/merchant/funds` | 查詢資金變動記錄 (充值/額度) | `Merchant/Finance/FundManagement.vue` |

### 3.4 Finance & Funds (財務中心)

| Method | Endpoint | 描述 | 對應前端 Views |
|--------|----------|------|----------------|
| `GET` | `/api/admin/funds` | **[Master]** 審核資金請求列表 | `Master/Finance/FundManagement.vue` |
| `POST` | `/api/admin/funds/:id/review` | **[Master]** 通過或拒絕資金請求 | `Master/Finance/FundManagement.vue` |
| `POST` | `/api/admin/funds/adjust` | **[Master]** 人工調帳 (加減款) | `Master/Finance/FundManagement.vue` |
| `POST` | `/api/v2/finance/invoices/preview` | **[Master]** 生成本期帳單預覽 | `Master/Finance/InvoiceManager.vue` |
| `POST` | `/api/v2/finance/invoices/generate`| **[Master]** 確認生成帳單 | `Master/Finance/InvoiceManager.vue` |
