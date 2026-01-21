import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import type { JobLevel, Permission, Staff } from '../types/system'

// ==================== JOB LEVELS ====================
// Default Job Levels (RBAC Roles)
let jobLevels: JobLevel[] = [
    {
        id: 1,
        name: 'Super Admin',
        description: '最高管理員，擁有所有權限',
        permissions: ['dashboard', 'merchant', 'finance', 'reports', 'system'] as Permission[],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 2,
        name: 'Operation Lead',
        description: '營運主管，負責商戶與報表管理',
        permissions: ['dashboard', 'merchant', 'reports'] as Permission[],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 3,
        name: 'Finance Specialist',
        description: '財務專員，負責財務與報表審核',
        permissions: ['dashboard', 'finance', 'reports'] as Permission[],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
]

// ==================== STAFF ====================
// Staff List (Updated for RBAC - job_level_id replaces permissions)
let staffList: Staff[] = [
    {
        id: 1,
        username: 'admin',
        realname: 'System Administrator',
        email: 'admin@example.com',
        status: 'active',
        job_level_id: 1,  // Super Admin
        created_at: '2024-01-01T00:00:00Z',
        last_login: faker.date.recent().toISOString()
    },
    {
        id: 2,
        username: 'tech_lead',
        realname: 'Tech Lead',
        email: 'tech@example.com',
        status: 'active',
        job_level_id: 2,  // Operation Lead
        created_at: '2024-01-02T00:00:00Z',
        last_login: faker.date.recent().toISOString()
    },
    {
        id: 3,
        username: 'finance_01',
        realname: 'Finance Officer',
        email: 'finance@example.com',
        status: 'active',
        job_level_id: 3,  // Finance Specialist
        created_at: '2024-01-03T00:00:00Z',
        last_login: faker.date.past().toISOString()
    }
]

// Helper: Get member count for each job level
function getMemberCount(jobLevelId: number): number {
    return staffList.filter(s => s.job_level_id === jobLevelId).length
}

// Helper: Get job level name
function getJobLevelName(jobLevelId: number): string {
    return jobLevels.find(jl => jl.id === jobLevelId)?.name || 'Unknown'
}

// ==================== AUDIT LOGS ====================
interface AuditLogMock {
    id: string
    time: string
    operator: string
    action: string
    target: string
    ip: string
    changes: any
}

const auditLogs: AuditLogMock[] = Array.from({ length: 25 }, () => ({
    id: faker.string.uuid(),
    time: faker.date.recent({ days: 10 }).toISOString(),
    operator: faker.helpers.arrayElement(['admin', 'tech_lead', 'system']),
    action: faker.helpers.arrayElement([
        'UPDATE_PROVIDER_STATUS', 'GENERATE_INVOICE', 'CREATE_MERCHANT', 'UPDATE_GAME_RTP', 'SYSTEM_MAINTENANCE'
    ]),
    target: faker.helpers.arrayElement(['PG Soft', 'Bet365', 'Global Settings', 'Invoice #202510']),
    ip: faker.internet.ip(),
    changes: {
        before: { status: 'active' },
        after: { status: 'maintenance' }
    }
})).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())

// ==================== GLOBAL SETTINGS ====================
let globalSettings = {
    maintenance_mode: false,
    admin_whitelist: ['127.0.0.1', '192.168.1.100']
}

// ==================== HANDLERS ====================
export const systemHandlers = [
    // ========== JOB LEVELS ==========

    // Get Job Levels List
    http.get('/api/admin/job-levels', async () => {
        await delay(400)

        const listWithCounts = jobLevels.map(jl => ({
            ...jl,
            member_count: getMemberCount(jl.id)
        }))

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list: listWithCounts, total: listWithCounts.length }
        })
    }),

    // Create Job Level
    http.post('/api/admin/job-levels', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any

        const newJobLevel: JobLevel = {
            id: Math.max(...jobLevels.map(jl => jl.id), 0) + 1,
            name: body.name,
            description: body.description || '',
            permissions: body.permissions || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        jobLevels.push(newJobLevel)

        return HttpResponse.json({
            code: 0,
            msg: 'Job Level created successfully',
            data: newJobLevel
        })
    }),

    // Update Job Level
    http.put('/api/admin/job-levels/:id', async ({ params, request }) => {
        await delay(600)
        const id = Number(params.id)
        const body = await request.json() as any

        const index = jobLevels.findIndex(jl => jl.id === id)
        if (index === -1) {
            return HttpResponse.json({
                code: 404,
                msg: 'Job Level not found'
            }, { status: 404 })
        }

        const existing = jobLevels[index]!
        jobLevels[index] = {
            id: existing.id,
            name: body.name ?? existing.name,
            description: body.description ?? existing.description,
            permissions: body.permissions ?? existing.permissions,
            created_at: existing.created_at,
            updated_at: new Date().toISOString()
        }

        return HttpResponse.json({
            code: 0,
            msg: 'Job Level updated successfully',
            data: jobLevels[index]
        })
    }),

    // Delete Job Level
    http.delete('/api/admin/job-levels/:id', async ({ params }) => {
        await delay(500)
        const id = Number(params.id)

        // Check if any staff is assigned to this job level
        const memberCount = getMemberCount(id)
        if (memberCount > 0) {
            return HttpResponse.json({
                code: 400,
                msg: `Cannot delete. ${memberCount} staff member(s) are assigned to this job level.`
            }, { status: 400 })
        }

        const index = jobLevels.findIndex(jl => jl.id === id)
        if (index === -1) {
            return HttpResponse.json({
                code: 404,
                msg: 'Job Level not found'
            }, { status: 404 })
        }

        jobLevels.splice(index, 1)

        return HttpResponse.json({
            code: 0,
            msg: 'Job Level deleted successfully'
        })
    }),

    // ========== STAFF MANAGEMENT ==========

    // Get Staff List (with job_level_name)
    http.get('/api/v2/system/staff', async () => {
        await delay(400)

        const listWithJobLevels = staffList.map(staff => ({
            ...staff,
            job_level_name: getJobLevelName(staff.job_level_id)
        }))

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list: listWithJobLevels, total: listWithJobLevels.length }
        })
    }),

    // Create/Update Staff
    http.post('/api/v2/system/staff', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any

        if (body.id) {
            // Update existing staff
            const idx = staffList.findIndex(s => s.id === body.id)
            if (idx !== -1) {
                const existing = staffList[idx]!
                staffList[idx] = {
                    id: existing.id,
                    username: body.username ?? existing.username,
                    realname: body.realname ?? existing.realname,
                    email: body.email ?? existing.email,
                    status: body.status ?? existing.status,
                    job_level_id: body.job_level_id ?? existing.job_level_id,
                    created_at: existing.created_at,
                    last_login: existing.last_login
                }
            }
        } else {
            // Create new staff
            const newId = staffList.length > 0 ? Math.max(...staffList.map(s => s.id)) + 1 : 1
            const newStaff: Staff = {
                id: newId,
                username: body.username,
                realname: body.realname,
                email: body.email,
                status: body.status || 'active',
                job_level_id: body.job_level_id,
                created_at: new Date().toISOString()
            }
            staffList.push(newStaff)
        }

        return HttpResponse.json({ code: 0, msg: 'Saved successfully' })
    }),

    // ========== AUDIT LOGS ==========

    http.get('/api/v2/system/audit-logs', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list: auditLogs, total: auditLogs.length }
        })
    }),

    // ========== GLOBAL SETTINGS ==========

    http.get('/api/v2/system/settings', async () => {
        await delay(300)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: globalSettings
        })
    }),

    http.post('/api/v2/system/settings', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        globalSettings = { ...globalSettings, ...body }

        // Audit this action
        auditLogs.unshift({
            id: faker.string.uuid(),
            time: new Date().toISOString(),
            operator: 'admin',
            action: 'UPDATE_SETTINGS',
            target: 'Global Config',
            ip: '127.0.0.1',
            changes: body
        })

        return HttpResponse.json({ code: 0, msg: 'Settings updated' })
    })
]
