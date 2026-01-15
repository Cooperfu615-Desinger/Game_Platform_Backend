import { ref, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import type { BetLog } from '../types/report'

export function useRoundSearch() {
    const message = useMessage()
    const loading = ref(false)
    const logs = ref<BetLog[]>([])

    const searchModel = reactive({
        timeRange: null as [number, number] | null,
        playerId: '',
        roundId: ''
    })

    // Columns definition could be here or in component. 
    // Keeping in component for templating ease usually, but clean architecture logic here.

    const fetchLogs = async () => {
        loading.value = true
        try {
            const res = await fetch('/api/v2/report/bet-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchModel)
            })

            const data = await res.json()
            if (data.code === 0) {
                logs.value = data.data.list
            } else {
                message.error(data.msg || 'Query failed')
            }
        } catch (e) {
            message.error('Network Error')
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        fetchLogs()
    }

    return {
        loading,
        searchModel,
        logs,
        handleSearch
    }
}
