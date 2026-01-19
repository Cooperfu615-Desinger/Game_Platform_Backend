import { h } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
    DashboardOutlined,
    BarChartOutlined,
    DescriptionOutlined,
    AttachMoneyOutlined,
    CodeOutlined,
    SportsEsportsOutlined,
    PeopleAltOutlined
} from '@vicons/material'

// Icon render helper
const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

/**
 * Merchant Backend Menu Configuration
 * Based on DESIGN_SPEC.md Section 3: Merchant Backend (商戶後台)
 */
export const merchantMenuOptions = (_t: (key: string) => string): MenuOption[] => [
    {
        type: 'group',
        label: '概覽',
        key: 'overview-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/dashboard' }, { default: () => '商戶儀表板' }),
                key: 'merchant-dashboard',
                icon: renderIcon(DashboardOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '遊戲管理',
        key: 'game-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/games' }, { default: () => '我的遊戲' }),
                key: 'merchant-games',
                icon: renderIcon(SportsEsportsOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '報表中心',
        key: 'report-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/reports/win-loss' }, { default: () => '營收日報' }),
                key: 'WinLossReport',
                icon: renderIcon(BarChartOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/merchant/reports/bet-query' }, { default: () => '注單查詢' }),
                key: 'merchant-bet-query',
                icon: renderIcon(DescriptionOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '財務中心',
        key: 'finance-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/finance/invoices' }, { default: () => '我的帳單' }),
                key: 'merchant-invoices',
                icon: renderIcon(AttachMoneyOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '組織管理',
        key: 'org-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/organization/sub-list' }, { default: () => '下級代理' }),
                key: 'sub-agent-list',
                icon: renderIcon(PeopleAltOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: '開發者',
        key: 'developer-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/merchant/developer' }, { default: () => '介接資訊' }),
                key: 'DeveloperCenter',
                icon: renderIcon(CodeOutlined)
            }
        ]
    }
]
