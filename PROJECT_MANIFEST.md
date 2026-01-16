# Project Manifest: Game Provider B2B Omni-Backend

> **Type**: B2B Game Provider Management System (Unified Monorepo)
> **Target Audience**:
>   1. **Master Admin (總控)**: 遊戲運營商 (You), 風控, 財務.
>   2. **Agent/Merchant (代理)**: API 介接商戶 (e.g., Bet365), 現金網站長.
> **Tech Stack**: Vue 3, TypeScript, Vite, Naive UI, Tailwind CSS, Pinia, MSW
> **Role**: PM / Product Owner
> **Last Updated**: 2026-01-16

---

## 1. 核心定位 (Mission)

本系統為 **「遊戲供應商 (Game Provider)」** 專用管理後台，採用 **「雙視角 (Dual-View)」** 架構。
我們不僅提供 API 給大型商戶，也提供後台給中小型代理進行下級管理。

- **Identity**: 我們是軍火商 (Game Factory)，而非單純的包網平台。
- **Strictly B2B**: 我們服務 B 端客戶 (Merchants/Agents)，不直接運營 C 端玩家流量。
- **Core Value**:
    1.  **彈性錢包**: 同時支援「轉帳錢包 (Transfer)」與「單一錢包 (Seamless)」。
    2.  **精細運營**: 可針對個別代理設定 RTP、限紅、開放遊戲列表。
    3.  **嚴謹財務**: 提供完整的應收帳款 (Invoice) 與應付分潤 (Commission) 對帳機制。

---

## 2. 雙視角權限體系 (Dual-View Architecture)

本專案為 **單一程式碼庫 (Single Codebase)**，依據登入使用者的 `Role` 切換不同視圖：

### A. 總控視角 (Master Admin View)
- **使用者**: 內部員工 (Super Admin, Risk, Finance)。
- **對應 API**: `CMD API` (`/api/v2/cmd/*`)。
- **職責**: 工廠管理、全域監控、應收帳款管理。
- **權限特徵**: 上帝視角，可跨層級查詢所有數據，擁有「強制踢人」與「封鎖 IP」的最高權限。

### B. 代理視角 (Agent View)
- **使用者**: 外部商戶 (Level 1 Merchant) 或下級推廣員 (Level 2+ Sub-Agent)。
- **對應 API**: `Agent API` (`/api/v2/agent/*`)。
- **職責**: 業績查詢、下級推廣、應付帳款核對。
- **權限特徵**: 僅能看見自己與直屬下級的數據 (Siloed Data)，無權更改 RTP。

---

## 3. 關鍵業務邏輯 (Business Rules)

### 3.1 代理層級與術語 (Hierarchy & Terminology)
系統資料庫支援 4 層結構，但業務上嚴格區分：
- **Level 1 (Merchant)**: **商戶/總代**。這是我們的直接客戶 (如 Bet365, 老子有錢)。
    - **必備**: `Secret Key` (API 介接用), `IP Whitelist`。
    - **行為**: 由總控開設。
- **Level 2+ (Sub-Agent)**: **推廣員/下級**。這是商戶的內部組織。
    - **必備**: `Password` (後台登入用)。
    - **行為**: 由 Level 1 商戶自行開設 (或由總控代開)。

### 3.2 錢包模式 (Wallet Modes)
針對 Level 1 Merchant，支援兩種對接模式：
1.  **Seamless (單一錢包)**: 餘額在商戶端。系統僅記錄 Log，後台隱藏「餘額」與「轉帳」功能。
2.  **Transfer (轉帳錢包)**: 餘額在我們系統 (`balance` 欄位)。後台需提供「人工存提」功能。

### 3.3 財務對帳 (Finance Logic)
採用 **複式記帳** 概念進行 B2B 結算：
- **總控端 (Receivable)**: 生成 **Invoice (月結單)**。
    - 公式: `(Total GGR * (1 - Merchant%)) + API Fee`。
- **代理端 (Payable)**:
    - **Statement**: 核對總控開出的 Invoice。
    - **Downline Commission**: 系統自動計算應發給下級的佣金 (基於佔成差價)。

---

## 4. 功能模組與目錄規劃 (Directory Mapping)

```bash
src/views/
├── Admin/                  # [總控專用視圖]
│   ├── Dashboard/          # 全平台 GGR, DAU, 本月預估營收
│   ├── AgentManagement/    # 商戶管理 (原 Tenant)
│   │   ├── MerchantList.vue     # [核心] Level 1 代理列表
│   │   ├── MerchantDetail/      # 商戶詳情 (Tabs: Basic, Security, GameAccess, Wallet)
│   │   └── GlobalSearch.vue     # 跨層級搜尋
│   ├── GameFactory/        # 遊戲工廠
│   │   ├── GameLibrary.vue      # 上架/維護
│   │   └── MathConfig.vue       # 全域 RTP & Bet Limit 設定
│   ├── RiskControl/        # 風控中心
│   │   ├── OnlinePlayers.vue    # 強制踢人 (Kick Session)
│   │   └── GlobalBlockList.vue  # IP/國家黑名單
│   ├── Finance/            # 財務中心
│   │   ├── DailyBalance.vue     # [內控] 平台水位檢核 (Opening + In - Out = Closing)
│   │   └── InvoiceManager.vue   # [請款] 帳單生成
│   └── System/             # 系統設定 (員工權限, 跑馬燈, 操作日誌)
│
├── Agent/                  # [代理專用視圖]
│   ├── Dashboard/          # 個人與下級業績總覽
│   ├── Organization/       # 組織管理
│   │   ├── SubAgentList.vue     # 下級代理管理 (設定下級佔成)
│   │   └── PlayerList.vue       # 會員列表
│   ├── Reports/            # 報表中心
│   │   ├── WinLossReport.vue    # 輸贏報表 (含佔成計算)
│   │   └── GameReport.vue       # 遊戲分類報表
│   ├── DataCenter/         # 數據查詢 (Bet Logs, Transaction Logs)
│   ├── Finance/            # 財務中心
│   │   ├── MyStatement.vue      # 查看上級帳單
│   │   └── Commission.vue       # 下級分潤試算
│   └── GameSettings/       # 遊戲管理
│       └── MyGames.vue          # [Toggle] 開放遊戲給下級 (無權改 RTP)


## 5. 開發路線圖 (Master Roadmap)
🟢 Phase 1: 核心管理系統 (The Backbone) - [Priority]

目標: 建立完整的 B2B 租戶管理與 API 安全體系。
1.  **Merchant System: 實作 MerchantList、CreateMerchant (含錢包模式選擇)。
2.  **Security: 實作 IP Whitelist 與 Secret Key 管理。
3.  **Auth: 實作雙視角登入路由守衛 (admin vs agent)。

🔵 Phase 3: 數據與財務中心 (The Brain) - [Next]
目標: 讓營運方能對帳與收錢。 (註: Phase 3 優先級高於原 Phase 2)
1.  **Bet Logs: 實作複雜篩選與 JSON Log 美化檢視。
2.  **Finance Engine: 實作 Invoice 生成與 Daily Balance 檢核報表。

🟠 Phase 2: 遊戲研發模擬 (The Future) - [On Hold]
目標: 數學驗證與合規工具。
1.  **Simulator: Pixi.js + Math Engine 進行 RTP 驗證 (作為 Admin/GameFactory 的子功能)。 (目前暫時凍結，待後台功能完善後開發)