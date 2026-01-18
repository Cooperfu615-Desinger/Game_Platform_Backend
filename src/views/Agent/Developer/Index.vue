<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
    NCard, NInput, NInputGroup, NButton, NTag, useMessage, NCode
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const credentials = ref({
    merchant_code: '',
    secret_key: '',
    whitelist: [] as string[]
})
const loading = ref(false)
const showSecret = ref(false)
const ipInput = ref('')

const fetchCreds = async () => {
    loading.value = true
    const res = await fetch('/api/v2/agent/credentials')
    const data = await res.json()
    credentials.value = data.data
    loading.value = false
}

const updateWhitelist = async () => {
    await fetch('/api/v2/agent/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whitelist: credentials.value.whitelist })
    })
    message.success('Whitelist updated successfully')
}

const addIp = () => {
    if (ipInput.value && !credentials.value.whitelist.includes(ipInput.value)) {
        credentials.value.whitelist.push(ipInput.value)
        ipInput.value = ''
        updateWhitelist() // Auto save
    }
}

const removeIp = (ip: string) => {
    credentials.value.whitelist = credentials.value.whitelist.filter(i => i !== ip)
    updateWhitelist()
}

onMounted(() => fetchCreds())

const docMarkdown = `
# Easy Integration Guide

## 1. Authentication
All requests must include the header:
\`X-Merchant-Code: {MERCHANT_CODE}\`
\`X-Signature: {SIGNATURE}\`

## 2. Launch Game
\`POST /api/v1/game/launch\`
\`\`\`json
{
  "player_id": "user123",
  "game_code": "pg-fortune-tiger",
  "currency": "USD"
}
\`\`\`

## 3. Transfer Wallet
...
`
</script>

<template>
    <div class="p-6 space-y-6 max-w-4xl">
        <h1 class="text-2xl font-bold">{{ t('agent.developerCenter') }}</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Credentials -->
            <n-card :title="t('agent.apiCredentials')">
                <div class="space-y-4">
                    <div>
                        <div class="text-gray-500 mb-1">{{ t('agent.merchantCode') }}</div>
                        <n-input readonly :value="credentials.merchant_code" />
                    </div>
                    <div>
                        <div class="text-gray-500 mb-1">{{ t('agent.secretKey') }}</div>
                        <n-input-group>
                            <n-input 
                                readonly 
                                :type="showSecret ? 'text' : 'password'" 
                                :value="credentials.secret_key" 
                            />
                            <n-button @click="showSecret = !showSecret">
                                {{ showSecret ? 'Hide' : 'Show' }}
                            </n-button>
                        </n-input-group>
                        <div class="text-xs text-red-500 mt-1">
                            Keep this key secure! Do not share it.
                        </div>
                    </div>
                </div>
            </n-card>

            <!-- IP Whitelist -->
            <n-card :title="t('agent.ipWhitelist')">
                <div class="space-y-4">
                    <n-input 
                        v-model:value="ipInput" 
                        placeholder="Enter IP (e.g. 1.1.1.1)" 
                        @keydown.enter="addIp"
                    />
                    <div class="flex flex-wrap gap-2">
                        <n-tag 
                            v-for="ip in credentials.whitelist" 
                            :key="ip" 
                            closable 
                            @close="removeIp(ip)"
                        >
                            {{ ip }}
                        </n-tag>
                    </div>
                    <div class="text-xs text-gray-400">
                        Changes are saved automatically.
                    </div>
                </div>
            </n-card>
        </div>

        <!-- Docs -->
        <n-card :title="t('agent.docs')" size="small">
            <n-code :code="docMarkdown" language="markdown" />
        </n-card>
    </div>
</template>
