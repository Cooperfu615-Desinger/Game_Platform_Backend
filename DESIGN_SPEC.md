# UI/UX Design Spec: Antigravity Aggregator (Final)

> **Project**: Antigravity Aggregator (B2B)
> **Version**: 2.0 (Post-Pivot)
> **Target Audience**: 內部運營團隊 (Master), 外部運營商 (Merchant)
> **Source**: Based on `ggap規格書.docx` & Strategic Pivot Discussions

---

## 1. 系統架構與角色定義

系統分為兩個獨立後台：
1.  **Master Admin (總控後台)**: 供聚合商（我方）使用。權限最高，管理上游供應商與下游運營商。
2.  **Merchant Backend (商戶後台)**: 供運營商（客戶）使用。僅能查看自身數據與執行被授權的操作。

---

## 2. Master Admin (總控後台) 頁面詳解

### 2.1 戰情中心 (Dashboard)
**目標**: 全局監控流量與系統健康度。
* **全域儀表板 (Global Dashboard)**:
    * **KPI 卡片**: 今日總 GGR (盈虧)、今日總投注額 (Total Bet)、活躍商戶數、今日總注單量。
    * **趨勢圖表**: 24小時盈虧走勢 (P&L Trend)、每小時進單量 (TPS)。
    * **API 健康度**: 顯示當前 API 平均回應時間 (Latency) 與 成功率 (Success Rate)。
* **即時監控 (Real-time Monitor)**:
    * **Live Feed**: 顯示最近 50 筆進單的滾動列表 (含 Merchant, Game, Bet Amount)。
    * **Error Stream**: 紅色高亮顯示所有 API 報錯 (如 500, Timeout)，方便技術排查。

### 2.2 下游管理 (Downstream Mgmt)
**目標**: 管理 Level 1 運營商 (Operators)。
* **運營商列表 (Operator List)**:
    * **欄位**: 商戶 ID, 名稱, 錢包模式 (Seamless/Transfer), 幣別, 狀態 (正常/凍結), 創建時間。
    * **操作**: 編輯、停權、登入模擬 (Login as Merchant)。
* **運營商詳情 (Operator Detail)**:
    * **基本設定**: 商戶名稱、聯絡人資訊。
    * **介接設定 (Integration)**:
        * **Secret Key**: 顯示/重置 (需二次密碼驗證)。
        * **IP 白名單**: 新增/刪除 API 來源 IP (支援 CIDR 格式)。
    * **權限配置 (Permission)**:
        * **遊戲管理權限**: 開關 (Toggle)。開啟後允許商戶在自已後台開關遊戲。
    * **錢包設定**: 顯示目前餘額 (Transfer 模式專用) 或 Webhook URL (Seamless 模式專用)。

### 2.3 上游管理 (Upstream Mgmt)
**目標**: 管理 Level 0 供應商 (Providers)。
* **供應商列表 (Provider List)**:
    * **欄位**: GP 名稱 (PG, PP, Self), 狀態 (維護中/正常), API Endpoint。
    * **操作**: **一鍵維護 (Global Maintenance)** (開啟後所有該 GP 遊戲對外顯示維護)。
* **成本配置 (Cost Config)**:
    * **設定**: 針對每個 Provider 設定 **分潤成本 (Cost %)** (例如：PG Soft 收我們 8%，我們填入 8%)。此數值用於計算聚合商淨利。
* **遊戲庫存 (Game Repository)**:
    * **同步**: 「一鍵同步」按鈕，從上游 API 拉取最新遊戲清單。
    * **編輯**: 設定遊戲分類 (Slot/Live/Fish)、標籤 (Hot/New)、上傳遊戲圖示 (Icon)。

### 2.4 財務與清算 (Finance & Settlement)
**目標**: 處理金流、匯率與對帳。
* **平台損益表 (Platform P&L)**:
    * **公式**: `商戶營收 (GGR)` - `供應商成本 (GGR * Cost%)` = `聚合商毛利`。
    * **篩選**: 依日期、依商戶、依供應商查看毛利貢獻。
* [cite_start]**匯率管理 (Currency Mgmt)** [cite: 72-74, 79-82]:
    * **基準幣別 (Base Currency)**: 設定系統報表的主幣別 (如 USD)。
    * **匯率表**: 列表顯示 TWD, CNY, THB, VND, USDT 對 USD 的匯率。
    * **緩衝區 (Buffer)**: 設定匯率波動的緩衝百分比 (例如 +1%)，保障平台不虧匯差。
    * **更新模式**: 手動輸入 或 自動同步 (API 來源)。
* **人工調帳審核 (Manual Adjustment)** [Maker-Checker]:
    * **申請 (Maker)**: 客服填寫：商戶、金額 (+/-)、類型 (補單/扣除)、原因。
    * **審核 (Checker)**: 財務主管查看申請單，執行 **核准 (Approve)** 或 **駁回 (Reject)**。
    * **紀錄**: 完整的調帳歷程 Log。
* **對帳單管理 (Invoice)**:
    * **生成**: 按月/週生成各商戶的 PDF 對帳單。
    * **內容**: `(總輸贏 GGR * 商戶分潤 %) - 活動費用 + 技術服務費`。

### 2.5 風控與系統 (Risk & System)
**目標**: 自動化監控異常。
* [cite_start]**風控配置 (Risk Config)** [cite: 75-77]:
    * **RTP 警報**: 設定當單一商戶或玩家 RTP > X% (如 120%) 時觸發。
    * **贏分警報**: 設定單筆贏分 > X 金額時觸發。
    * **API 警報**: 設定錯誤率 (Error Rate) > X% 時觸發。
* **異常警報 (Risk Alert)**:
    * **列表**: 顯示所有觸發的警報事件。
    * **狀態**: 待處理、處理中、已解決 (需填寫處理備註)。
* **員工權限 (Employee RBAC)**:
    * **角色**: 超級管理員、財務、客服、技術。
    * **權限**: 詳細勾選每個頁面的 讀取/寫入 權限。

---

## 3. Merchant Backend (商戶後台) 頁面詳解

### 3.1 概覽 (Dashboard)
**目標**: 運營商核對自身業績。
* **商戶儀表板**:
    * [cite_start]**數據**: 僅顯示 **該商戶** 的今日 GGR、今日投注額、當前在線人數 [cite: 53-54]。
    * **圖表**: 該商戶的每小時盈虧走勢。
    * **餘額**: 若為 Transfer Wallet 模式，顯示目前剩餘額度。

### 3.2 遊戲管理 (Game Mgmt)
**目標**: 自助化營運配置。
* [cite_start]**我的遊戲 (My Games)** [cite: 56-58]:
    * **列表**: 顯示已授權的所有遊戲。
    * **開關 (Switch)**:
        * 若 Master 開放權限 -> 商戶可自由切換 On/Off。
        * 若 Master 關閉權限 -> 顯示唯讀狀態 (Disabled)。
    * **排序 (Sort)**: 設定遊戲在大廳的顯示權重 (Weight)。
* **維護公告**: 顯示聚合商發布的系統公告或停機通知。

### 3.3 報表中心 (Report Center)
**目標**: 查詢細節與客訴處理。
* **營收日報 (Daily Report)**:
    * **分組**: 預設依 **幣別** 分組 (因為不同幣別無法加總)。
    * **欄位**: 日期, 幣別, 總投注, 總派彩, 總輸贏 (GGR), 筆數。
* **注單查詢 (Bet Query)**:
    * **搜尋**: 支援 `BetID` (訂單號), `PlayerID` (玩家帳號), 時間區間。
    * **詳情**: 點擊查看單局詳細資訊 (Round Details)，包含遊戲畫面快照 (若 GP 支援)。
    * **匯出**: 支援 Excel/CSV 下載。

### 3.4 財務中心 (Finance)
**目標**: 帳務核對。
* **我的帳單 (My Invoices)**: 下載由 Master 生成的 PDF/Excel 結算單。
* **存提紀錄 (Transfer Logs)**: *(僅 Transfer 錢包模式顯示)* 顯示充值與提領的歷史紀錄。

### 3.5 開發者 (Developer)
**目標**: 技術自助服務。
* **介接資訊 (Integration)**:
    * **API Key**: 隱藏式顯示 (Masked)，點擊「重置」需輸入商戶登入密碼。
    * **IP 白名單**: 列表顯示目前允許的 IP，商戶可自行新增/刪除。
    * **API 文件**: 連結至線上 API 文件網址。

---

## 4. UI 交互與設計規範

1.  **資訊呈現**:
    * **金額顯示**: 統一格式化為 `1,234.00`，負數金額標示為 **紅色 (Red)**，正數為 **綠色 (Green)** (依地區習慣可配置)。
    * **時間顯示**: 需明確標示時區 (如 UTC+8)，並提供全站時區切換功能。
2.  **安全性**:
    * **敏感操作**: 重置 Key、刪除 IP、人工調帳，均需彈出 **二次確認視窗 (Modal)**。
    * **Loading**: 列表加載時使用 Skeleton (骨架屏)，避免畫面跳動。
3.  **過濾器 (Filters)**:
    * 所有報表頁面頂部需常駐：**日期選擇器 (Date Range)** 與 **幣別選擇器 (Currency Selector)**。