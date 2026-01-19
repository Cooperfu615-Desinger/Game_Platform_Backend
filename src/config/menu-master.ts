import { h } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
    DashboardOutlined,
    PeopleAltOutlined,
    CasinoOutlined,
    BarChartOutlined,
    DescriptionOutlined,
    AttachMoneyOutlined,
    SettingsOutlined,
    SecurityOutlined,
    AdminPanelSettingsOutlined
} from '@vicons/material'

// Icon render helper
const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

/**
 * Master Admin Menu Configuration
 * Based on DESIGN_SPEC.md Section 2: Master Admin (總控後台)
 */
export const masterMenuOptions = (_t: (key: string) => string): MenuOption[] => [
    {
        type: 'group',
        label: '戰情中心',
        key: 'dashboard-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/dashboard' }, { default: () => '全域儀表板' }),
                key: 'admin-dashboard',
                icon: renderIcon(DashboardOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '下游管理',
        key: 'downstream-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/merchant/list' }, { default: () => '運營商列表' }),
                key: 'merchant-list',
                icon: renderIcon(PeopleAltOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '上游管理',
        key: 'upstream-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/game-center/providers' }, { default: () => '供應商列表' }),
                key: 'provider-list',
                icon: renderIcon(CasinoOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/game-center/list' }, { default: () => '遊戲庫存' }),
                key: 'game-center',
                icon: renderIcon(CasinoOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '財務與清算',
        key: 'finance-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/data-center/report' }, { default: () => '平台損益表' }),
                key: 'FinancialReport',
                icon: renderIcon(AttachMoneyOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/finance/invoices' }, { default: () => '對帳單管理' }),
                key: 'InvoiceManager',
                icon: renderIcon(DescriptionOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '風控與系統',
        key: 'system-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/data-center/bet-log' }, { default: () => '注單查詢' }),
                key: 'BetLog',
                icon: renderIcon(BarChartOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/staff' }, { default: () => '員工權限' }),
                key: 'StaffList',
                icon: renderIcon(AdminPanelSettingsOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/audit-logs' }, { default: () => '操作日誌' }),
                key: 'AuditLogs',
                icon: renderIcon(SecurityOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/settings' }, { default: () => '系統設定' }),
                key: 'SystemSettings',
                icon: renderIcon(SettingsOutlined)
            }
        ]
    }
]
