import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ showSpinner: false })

/**
 * Route Configuration
 * - Master Admin routes: /admin/* → uses MasterLayout (Dark Theme)
 * - Merchant routes: /merchant/* → uses MerchantLayout (Light Theme)
 * - Auth routes: /login → No layout
 */

const routes: RouteRecordRaw[] = [
    // ================== MASTER ADMIN ROUTES ==================
    {
        path: '/admin',
        component: () => import('../layouts/MasterLayout.vue'),
        redirect: '/admin/dashboard',
        meta: { requiresAuth: true, role: 'master' },
        children: [
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: () => import('../views/Master/Dashboard/Overview.vue'),
                meta: { title: '戰情中心', roles: ['admin'] }
            },
            // Downstream Management (下游管理)
            {
                path: 'merchant/list',
                name: 'merchant-list',
                component: () => import('../views/Master/Merchant/List.vue'),
                meta: { title: '運營商列表', roles: ['admin'] }
            },
            {
                path: 'merchant/create',
                name: 'merchant-create',
                component: () => import('../views/Master/Merchant/Create.vue'),
                meta: { title: '新增運營商', roles: ['admin'] }
            },
            // Upstream Management (上游管理)
            {
                path: 'game-center/providers',
                name: 'provider-list',
                component: () => import('../views/Master/GameCenter/ProviderList.vue'),
                meta: { title: '供應商列表', roles: ['admin'] }
            },
            {
                path: 'game-center/list',
                name: 'game-center',
                component: () => import('../views/Master/GameCenter/GameList.vue'),
                meta: { title: '遊戲庫存', roles: ['admin'] }
            },
            // Finance & Settlement (財務與清算)
            {
                path: 'data-center/bet-log',
                name: 'BetLog',
                component: () => import('../views/Master/DataCenter/BetLog.vue'),
                meta: { title: '注單查詢', roles: ['admin'] }
            },
            {
                path: 'data-center/report',
                name: 'FinancialReport',
                component: () => import('../views/Master/DataCenter/Report.vue'),
                meta: { title: '平台損益表', roles: ['admin'] }
            },
            {
                path: 'finance/invoices',
                name: 'InvoiceManager',
                component: () => import('../views/Master/Finance/InvoiceManager.vue'),
                meta: { title: '對帳單管理', roles: ['admin'] }
            },
            // Risk & System (風控與系統)
            {
                path: 'system/staff',
                name: 'StaffList',
                component: () => import('../views/Master/System/StaffList.vue'),
                meta: { title: '員工權限', roles: ['admin'] }
            },
            {
                path: 'system/audit-logs',
                name: 'AuditLogs',
                component: () => import('../views/Master/System/AuditLogs.vue'),
                meta: { title: '操作日誌', roles: ['admin'] }
            },
            {
                path: 'system/settings',
                name: 'SystemSettings',
                component: () => import('../views/Master/System/Settings.vue'),
                meta: { title: '系統設定', roles: ['admin'] }
            }
        ]
    },

    // ================== MERCHANT ROUTES ==================
    {
        path: '/merchant',
        component: () => import('../layouts/MerchantLayout.vue'),
        redirect: '/merchant/dashboard',
        meta: { requiresAuth: true, role: 'merchant' },
        children: [
            // Overview (概覽)
            {
                path: 'dashboard',
                name: 'merchant-dashboard',
                component: () => import('../views/Merchant/Dashboard/Index.vue'),
                meta: { title: '商戶儀表板', roles: ['agent', 'merchant'] }
            },
            // Game Management (遊戲管理)
            {
                path: 'games',
                name: 'merchant-games',
                component: () => import('../views/Merchant/Game/MyGames.vue'),
                meta: { title: '我的遊戲', roles: ['agent', 'merchant'] }
            },
            // Report Center (報表中心)
            {
                path: 'reports/daily',
                name: 'DailyReport',
                component: () => import('../views/Merchant/Reports/DailyReport.vue'),
                meta: { title: '每日報表', roles: ['agent', 'merchant'] }
            },
            {
                path: 'reports/win-loss',
                name: 'WinLossReport',
                component: () => import('../views/Merchant/Reports/WinLoss.vue'),
                meta: { title: '營收日報', roles: ['agent', 'merchant'] }
            },
            {
                path: 'reports/bet-query',
                name: 'merchant-bet-query',
                component: () => import('../views/Merchant/Reports/BetQuery.vue'),
                meta: { title: '注單查詢', roles: ['agent', 'merchant'] }
            },
            // Finance Center (財務中心) - Placeholder
            {
                path: 'finance/invoices',
                name: 'merchant-invoices',
                component: () => import('../views/Merchant/Dashboard/Index.vue'), // TODO: Create Invoices.vue
                meta: { title: '我的帳單', roles: ['agent', 'merchant'] }
            },
            // Organization (組織管理)
            {
                path: 'organization/sub-list',
                name: 'sub-agent-list',
                component: () => import('../views/Merchant/Organization/SubAgentList.vue'),
                meta: { title: '下級代理', roles: ['agent', 'merchant'] }
            },
            // Developer (開發者)
            {
                path: 'developer',
                name: 'DeveloperCenter',
                component: () => import('../views/Merchant/Developer/Index.vue'),
                meta: { title: '介接資訊', roles: ['agent', 'merchant'] }
            }
        ]
    },

    // ================== AUTH ROUTES ==================
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/Auth/index.vue'),
        meta: { title: '登入' }
    },

    // ================== FALLBACK ==================
    {
        // Catch All -> 404
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/Error/404.vue'),
        meta: { title: '404' }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

/**
 * Global Navigation Guard
 * Implements authentication and role-based access control
 * 
 * Rules:
 * 1. /login is always accessible (whitelist)
 * 2. Protected routes require authentication
 * 3. MERCHANT users cannot access /admin/* routes
 * 4. MASTER users can access all routes (god mode)
 */
router.beforeEach(async (to, _from, next) => {
    // Start progress bar
    NProgress.start()

    // Dynamic import to avoid circular dependency
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()

    // Rule 1: Whitelist - Login page is always accessible
    if (to.path === '/login') {
        // If already logged in, redirect to appropriate dashboard
        if (authStore.isAuthenticated) {
            if (authStore.userRole === 'MASTER') {
                return next('/admin/dashboard')
            } else {
                return next('/merchant/dashboard')
            }
        }
        return next()
    }

    // Rule 2: Auth Check - Require authentication for protected routes
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    if (requiresAuth && !authStore.isAuthenticated) {
        // Not authenticated - redirect to login
        return next('/login')
    }

    // Rule 3: Role Guard - MERCHANT cannot access /admin/* routes
    const routeRole = to.matched.find(record => record.meta.role)?.meta.role as string | undefined

    if (routeRole === 'master' && authStore.userRole === 'MERCHANT') {
        // MERCHANT trying to access master routes - redirect to merchant dashboard
        return next('/merchant/dashboard')
    }

    // Rule 4: MASTER can access everything (allow merchant routes for testing)
    // No additional check needed - MASTER passes through

    next()
})

router.afterEach((to) => {
    // Finish progress bar
    NProgress.done()

    // Update document title
    const title = to.meta.title ? `${to.meta.title} - Antigravity` : 'Antigravity'
    document.title = title
})

export default router

