# Project Manifest: Antigravity Aggregator (GGAP)

> **Type**: Global Game Aggregator Platform (B2B Hub)
> **Role**: 流量與資金的中樞 (The Clearing House)
> **Target Audience**:
>   1. **Downstream**: 運營商/包網平台 (Operators/Merchants)
>   2. **Upstream**: 遊戲供應商 (Providers: 自研 GP, PG, Evolution)
> **Tech Stack**: Golang/Node.js, PostgreSQL (OLTP), ClickHouse (OLAP), Redis Cluster
> **Last Updated**: 2026-01-18

---

## 1. 核心定位 (Mission)

本系統為 **B2B 博弈遊戲聚合系統 (Aggregator)**。
我們的核心職責不是製造遊戲，而是 **「連接」** 與 **「清算」**。

- **One-Stop Solution**: 提供單一 API 閘道，讓運營商一次接入全球主流遊戲。
- **The Middleman**: 處理上游 (GP) 與下游 (Operator) 之間的 **錢包轉譯**、**幣別轉換** 與 **數據清洗**。
- **Data Intelligence**: 提供跨廠商的統一報表與即時數據分析。

---

## 2. 系統架構視圖 (Architecture View)

系統採用 DDD (Domain-Driven Design) 分層架構。

### A. 核心實體映射 (Entity Mapping)
為了適配聚合商業務，我們對現有資料庫結構進行邏輯重定義：

| 聚合商角色 | 對應 DB 表格與欄位 | 邏輯定義 |
| :--- | :--- | :--- |
| **Operator (運營商)** | `agents` (Level = 1) | 下游客戶 (如 Bet365)。需分配 `SecretKey` 與 `IP Whitelist`。 |
| **Sub-Agent (子代理)** | `agents` (Level > 1) | 運營商內部的推廣層級 (可選功能，視運營商需求開放)。 |
| **Provider (供應商)** | `providers` (New) | 上游遊戲源。需設定 API Endpoint, 分潤成本 (Cost%)。 |
| **Player (玩家)** | `players` | 歸屬於特定 Operator 的終端用戶。 |

### B. 雙向介接模組 (Dual-Interface)
1.  **Unified API Gateway (向下)**:
    * 提供標準化接口供 Operator 呼叫 (Login, Balance, Transfer)。
    * 實作 `HMAC-SHA256` 簽章驗證與 IP 白名單。
2.  **Provider Integration Layer (向上)**:
    * 負責對接不同 GP (PG, PP, Evolution) 的異質 API。
    * 將外部遊戲的 Error Code 統一轉譯為我方標準錯誤碼。

---

## 3. 關鍵業務流程 (Business Rules)

### 3.1 錢包模式 (Wallet Modes)
系統必須同時支援兩種模式，依據 Operator 設定切換：

1.  **Seamless Wallet (單一錢包) [核心]**:
    * **流程**: 玩家進遊戲 -> 聚合商 API -> Operator API (扣款) -> 回傳餘額。
    * **特性**: `players.balance` 僅作為快照或不使用，資金實時在 Operator 端變動。
    * **防呆**: 必須實作 **冪等性 (Idempotency)**，防止超時重試導致的重複扣款。

2.  **Transfer Wallet (轉帳錢包) [相容]**:
    * **流程**: Operator 呼叫 `/credit` 轉入 -> 聚合商 DB (`players.balance`) 增加 -> 玩家進遊戲扣除聚合商餘額。
    * **特性**: 需使用 `cash_operations` 表記錄轉入/轉出，並進行 ACID 事務控制。

### 3.2 匯率與清算 (Currency & Settlement)
1.  **基準幣別 (Base Currency)**:
    * 所有交易 (`bet_logs`) 寫入時，除記錄 `OriginalAmount` (如 THB)，需同時轉換並記錄 `BaseAmount` (如 USD)。
    * 報表生成以 `BaseAmount` 為準，規避匯率波動風險。
2.  **帳務公式**:
    * `Operator Payable` = (GGR × 商戶分潤%) - 活動費用 + 技術服務費。
    * 需透過 ClickHouse `daily_agent_report` 產出對帳單。

---

## 4. 功能模組規劃 (Module Scope)

### 🟢 Phase 1: 核心建置 (Core & Gateway)
* **API Gateway**: 實作 Platform API (Login, Balance, Bet, Win)。
* **Integration**: 完成首批上游對接 (自研 GP, PG Soft, Evolution)。
* **Wallet Core**: 實作 Seamless Wallet 的冪等性邏輯與 Transfer Wallet 的事務邏輯。
* **Database**: 建立 PostgreSQL (`agents`, `bet_logs`) 與 ClickHouse 基礎 Schema。

### 🔵 Phase 2: 運營商接入 (Operator Onboarding)
*(本階段重點：完成商戶後台 Merchant Back-office)*
* **Dashboard (儀表板)**:
    * **實時監控**: 在線人數 (Online Users)、今日 GGR、即時投注筆數。
    * **趨勢圖表**: 每小時盈虧 (P&L) 走勢圖。
* **Game Management (遊戲管理)**:
    * **開關控制**: 針對單一遊戲或廠商進行上架/下架 (Toggle ON/OFF)。
    * **大廳排序**: 自定義熱門遊戲的排序權重 (Weighting)。
* **Report Center (報表中心)**:
    * **注單查詢**: 支援 `BetID`、`PlayerID`、時間區間的細粒度查詢。
    * **日結算表**: 每日盈虧匯總 (依幣別分類)。
* **Account & Security (帳號與安全)**:
    * **權限管理**: 設定子帳號角色 (財務/客服/技術)。
    * **API 安全**: API Key 重置功能、IP 白名單自助設定。

### 🟠 Phase 3: 總控與擴充 (Admin & Scaling)
*(本階段重點：完成總控後台 Super Admin)*
* **Provider Config (供應商配置)**:
    * 設定上游 API 參數、分潤成本 (%)、維護狀態開關。
* **Risk Control (風控警報)**:
    * **異常監控**: 針對高 RTP 商戶或玩家發出警報。
    * **API 監控**: 監控 API 錯誤率 (Error Rate) 與延遲。
* **Multi-Currency (多幣別)**:
    * 完善匯率緩衝區 (Buffer) 設定。
    * 支援 USDT (ERC20/TRC20) 等加密貨幣。

---

## 5. 資料庫設計重點 (Database Schema Highlights)

### 5.1 PostgreSQL (OLTP)
沿用 `BACKENDSERVER_SPEC.md` 之設計，重點關注：
* **`agents`**: 核心商戶表。`level=1` 為 Operator，`secret_key` 為 API 憑證。
* **`cash_operations`**: 金流軌跡表。`main_code=2` (平台), `sub_code=4/5` (轉入/轉出)。

### 5.2 ClickHouse (OLAP)
用於海量數據分析，支援聚合商報表：
* **`bet_log_analytics`**: 下注原始數據 (含 `currency_rate`, `profit`)。
* **`daily_agent_report`**: 預聚合的商戶日報 (加速查詢)。
* **`cash_flow_analytics`**: 金流變動分析。

---

## 6. API 規範 (API Standard)
* **Protocol**: HTTPS + JSON.
* **Authentication**:
    * Server-to-Server (Operator): `Secret-Key` (Header) + IP Whitelist。
    * Back-office (User): Cookie Token + Redis Session。
* **Response**: 統一格式 `{ code, status, data, message }`。