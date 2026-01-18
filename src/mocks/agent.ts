import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

// Mock Data for specific Merchant (ID: 999 for testing)
const merchantStats = {
    balance: 15420.50,
    currency: 'USD',
    today_ggr: 1250.00,
    active_players: 142,
    chart_data: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
        ggr: faker.number.float({ min: 500, max: 2000, fractionDigits: 2 })
    }))
}

let merchantCredentials = {
    merchant_code: 'AGG_TEST_999',
    secret_key: 'sk_live_' + faker.string.uuid(),
    whitelist: ['1.1.1.1', '203.0.113.1']
}

export const agentHandlers = [
    // Dashboard Stats
    http.get('/api/v2/agent/stats', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchantStats
        })
    }),

    // Get Credentials & Whitelist
    http.get('/api/v2/agent/credentials', async () => {
        await delay(400)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchantCredentials
        })
    }),

    // Update Whitelist
    http.post('/api/v2/agent/whitelist', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        merchantCredentials.whitelist = body.whitelist
        return HttpResponse.json({
            code: 0,
            msg: 'Whitelist updated successfully'
        })
    }),

    // Regenerate Key (Mock)
    http.post('/api/v2/agent/regenerate-key', async () => {
        await delay(1000)
        merchantCredentials.secret_key = 'sk_live_' + faker.string.uuid()
        return HttpResponse.json({
            code: 0,
            msg: 'New Secret Key Generated',
            data: { secret_key: merchantCredentials.secret_key }
        })
    }),

    // Win/Loss Report (Isolated)
    http.post('/api/v2/agent/report/win-loss', async () => {
        await delay(600)
        const list = Array.from({ length: 15 }, () => ({
            id: 'TX-' + faker.string.numeric(10),
            time: faker.date.recent().toISOString(),
            game_name: faker.helpers.arrayElement(['Fortune Tiger', 'Crazy Time', 'Super Ace']),
            bet: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
            win: faker.number.float({ min: 0, max: 200, fractionDigits: 2 }),
            status: faker.helpers.arrayElement(['win', 'loss'])
        }))

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 15
            }
        })
    }),

    // Sub Agent List
    http.get('/api/v2/agent/sub-agents', async () => {
        await delay(500)
        const list = Array.from({ length: 5 }, () => ({
            id: faker.number.int({ min: 100, max: 999 }),
            account: faker.internet.username(),
            level: 2,
            balance: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
            status: 'active',
            created_at: faker.date.past().toISOString()
        }))
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: 5 }
        })
    })
]
