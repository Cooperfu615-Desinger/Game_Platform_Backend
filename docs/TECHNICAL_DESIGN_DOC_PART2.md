# 📋 技術設計文件 (TDD) - Part 2: 功能與介面規格

> **文件狀態**: Draft
> **撰寫日期**: 2026-01-23
> **專案版本**: 0.0.1 (Phase 10.6 Completed)
> **對應檔案**: `TECHNICAL_DESIGN_DOC_PART1.md` (架構篇)

---

## 1. 總控後台規格 (Master Admin Portal)

### 1.1 商戶管理 (Merchant Management)

* **頁面路徑**: `src/views/Master/Merchant/List.vue`
* **核心功能**:
  * **列表顯示**: 展示所有商戶的關鍵資訊，支援依狀態與錢包模式篩選。
  * **配置管理**: 設定商戶技術參數 (Secret Key, IP 白名單)。
  * **遊戲授權**: 控制商戶可使用的遊戲供應商 (Provider)。

#### 1.1.1 關鍵欄位定義

| 欄位名稱 | 描述 | UI 呈現/操作 |
| :--- | :--- | :--- |
| **Merchant ID** | 系統唯一識別碼 | 顯示格式 `OP-{id}`，點擊可複製。 |
| **Site Code** | 站點代碼 (3碼大寫) | 用於 API 路由識別。 |
| **Wallet Mode** | 錢包對接模式 | **Transfer (轉帳)**: 需手動劃轉額度。<br>**Seamless (單一)**: 即時扣款。 |
| **Balance** | 商戶錢包餘額 | 僅 Transfer 模式顯示，支援多幣別格式化 (`MoneyText`)。 |
| **Status** | 帳號狀態 | Active (綠) / Suspended (紅)。 |

#### 1.1.2 業務邏輯與操作流程

1. **新增商戶**:
    * 輸入基本資料 (Name, Currency) 與初始設定 (Wallet Mode)。
    * 系統自動生成 `Display ID` 與 `Secret Key`。
2. **配置設定 (Config Drawer)**:
    * **IP 白名單**: 輸入 IP 並按 Enter 新增，支援 Regex 驗證。儲存空名單時需二次確認。
    * **重置金鑰**: 點擊 "Regenerate" -> 彈出危險操作警告 -> 確認後生成新 UUID。
    * **RTP 設定**: 調整該商戶的全域 RTP 水位 (90% - 99%)。

---

### 1.2 供應商管理 (Provider Management)

* **頁面路徑**: `src/views/Master/GameCenter/ProviderList.vue`
* **核心功能**:
  * 管理上游遊戲供應商 (PG Soft, Evolution) 的接入狀態。
  * 全域維護開關。

#### 1.2.1 關鍵欄位定義

| 欄位名稱 | 描述 | UI 呈現/操作 |
| :--- | :--- | :--- |
| **Status Switch** | 全域狀態開關 | **Active**: 正常營運。<br>**Maintenance**: 維護中 (所有商戶不可用)。 |
| **Game Count** | 遊戲總數 | 同步自供應商 API。 |

#### 1.2.2 業務邏輯

* **狀態切換**: 切換開關 -> 呼叫 `/api/v2/providers/update` -> 前端依據回應更新狀態 (Optimistic Update 失敗則回滾)。

---

### 1.3 財務管理 (Finance Center)

#### 1.3.1 資金審核 (Fund Management)

* **頁面路徑**: `src/views/Master/Finance/FundManagement.vue`
* **功能**: 處理商戶的充值 (Top-up) 與調額 (Credit Limit) 申請。
* **操作流程**:
    1. **審核 (Review)**: 點擊待審核記錄 (Pending) -> 彈窗顯示詳情 -> 選擇 Approve/Reject -> 輸入備註 -> 提交。
    2. **人工調帳 (Manual Adjust)**: 點擊 "+" -> 選擇商戶 -> 輸入金額 (正數加款/負數扣款) 與理由 -> 系統自動建立一筆 Approved 記錄。

#### 1.3.2 帳單管理 (Invoice Manager)

* **頁面路徑**: `src/views/Master/Finance/InvoiceManager.vue`
* **功能**: 生成與管理月度帳單 (Invoices)。
* **操作流程**:
    1. **生成帳單**: 選擇月份 -> 預覽 (Preview) 各商戶 GGR 與應繳金額 -> 確認生成。
    2. **標記已付**: 針對 Pending 帳單 -> 點擊打勾圖示 -> 狀態變更為 Paid (不可逆)。
    3. **查看明細**: 點擊詳情 -> 側邊欄顯示各遊戲供應商的 GGR 拆帳明細。

---

## 2. 商戶後台規格 (Merchant Portal)

### 2.1 首頁儀表板 (Command Center)

* **頁面路徑**: `src/views/Merchant/Dashboard/Index.vue`
* **核心功能**:
  * **KPI 卡片**: 顯示今日注單 (Bet), 淨利 (Win), 活躍玩家, 交易量。
  * **警報系統 (Alerts)**: 顯示待處理事項 (如未付款帳單)，點擊 "Process" 引導至對應頁面。
  * **營收趨勢圖**: ECharts 折線圖，展示近 7 日 GGR 走勢。

### 2.2 遊戲管理 (My Games)

* **頁面路徑**: `src/views/Merchant/Game/MyGames.vue`
* **核心功能**: 商戶自主開關特定遊戲。
* **業務邏輯 (雙層狀態控制)**:
  * **Platform Status (總控端)**: 若為 Disabled/Maintenance，商戶**無法**開啟該遊戲 (Switch 顯示禁用並提示)。
  * **Merchant Status (商戶端)**: 在平台允許的前提下，商戶可自由切換開關。
* **批量操作**: 勾選多筆遊戲 -> 批量啟用/停用。

### 2.3 代理管理系統 (Agent System)

* **頁面路徑**: `src/views/Merchant/Organization/SubAgentList.vue`
* **核心功能**: 管理下級代理 (Sub-Agents)。
* **關鍵操作**:
  * **新增代理**: 設定帳號密碼與**佣金比例 (Commission Rate)**。
  * **額度劃轉 (Transfer)**: 從商戶錢包劃轉資金給代理 (Deposit)。
  * **推廣連結**: 系統自動生成帶有 `Promotion Code` 的註冊連結，支援一鍵複製。

### 2.4 財務與報表 (Finance & Reports)

#### 2.4.1 資金管理 (merchant/Finance/FundManagement)

* **功能**: 查看錢包餘額、信用額度、申請充值/調額。
* **UI**: 頂部顯示錢包大卡片 (Balance/Currency)，下方為歷史申請記錄列表 (含狀態標籤)。

#### 2.4.2 營收報表 (Revenue Report)

* **功能**: 查詢每日營收匯總。
* **邏輯**:
  * **Summary Cards**: 顯示區間內的總計 (Total Bet, Payout, Net Win)。
  * **Drill Down**: 點擊日期 -> 展開該日的詳細交易類別或供應商佔比 (Transaction Detail Drawer)。

---

## 3. 未來擴充建議 (Future Recommendations)

基於目前的架構基礎，建議接手團隊優先開發以下模組：

1. **RBAC 權限系統 (Role-Based Access Control)**:
    * 目前的 `src/types/system.ts` 已定義 `Permission` 與 `JobLevel`。
    * 建議實作：在 `router.beforeEach` 與側邊選單中加入細粒度的權限檢核，實現 "財務專員僅能看報表" 等功能。

2. **玩家管理中心 (Player Management)**:
    * 目前系統僅有總體數據。建議新增 `PlayerList.vue`，提供單一玩家的 "遊戲歷程"、"盈虧分析" 與 "風險標記" 功能。

3. **進階賭局回放 (Data Visualization)**:
    * 在注單查詢中，針對特定遊戲 (如百家樂) 實作 "牌路回放" 或 "老虎機盤面重現" 功能，便於爭議處理與客服查詢。
