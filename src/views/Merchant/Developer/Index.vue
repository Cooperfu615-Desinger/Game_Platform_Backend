<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
    NCard, NButton, NTag, useMessage, NDynamicTags, NSpace, NAlert, NDivider
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import CopyableText from '../../../components/Common/CopyableText.vue'

const { t } = useI18n()
const message = useMessage()

const credentials = ref({
    merchant_code: '',
    secret_key: '',
    whitelist: [] as string[]
})
const loading = ref(false)

const fetchCreds = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/agent/credentials')
        const data = await res.json()
        credentials.value = data.data || { merchant_code: '', secret_key: '', whitelist: [] }
    } finally {
        loading.value = false
    }
}

const updateWhitelist = async (newList: string[]) => {
    credentials.value.whitelist = newList
    try {
        await fetch('/api/v2/agent/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whitelist: newList })
        })
        message.success('IP Whitelist updated')
    } catch {
        message.error('Failed to update whitelist')
    }
}

const openDocs = () => {
    window.open('https://docs.example.com/api', '_blank')
}

onMounted(() => fetchCreds())
</script>

<template>
    <div class="p-6 max-w-4xl">
        <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🔧</span> {{ t('agent.developerCenter') || 'Developer Center' }}
        </h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- API Credentials Card -->
            <n-card title="🔑 API Credentials" class="h-fit">
                <div class="space-y-5">
                    <!-- Merchant Code -->
                    <div>
                        <div class="text-sm text-gray-500 mb-2">Merchant Code</div>
                        <CopyableText 
                            :text="credentials.merchant_code || 'Loading...'" 
                        />
                    </div>

                    <!-- Secret Key (Masked by default) -->
                    <div>
                        <div class="text-sm text-gray-500 mb-2">
                            Secret Key
                            <n-tag size="small" type="warning" class="ml-2">Sensitive</n-tag>
                        </div>
                        <CopyableText 
                            :text="credentials.secret_key || 'Loading...'" 
                            :masked="true"
                        />
                    </div>

                    <n-alert type="warning" :bordered="false">
                        <template #header>Security Notice</template>
                        Never share your Secret Key. Use IP whitelist to restrict API access.
                    </n-alert>
                </div>
            </n-card>

            <!-- IP Whitelist Card -->
            <n-card title="🛡️ IP Whitelist" class="h-fit">
                <div class="space-y-4">
                    <p class="text-sm text-gray-500">
                        Only requests from these IPs will be accepted. Leave empty to allow all.
                    </p>

                    <n-dynamic-tags
                        :value="credentials.whitelist"
                        @update:value="updateWhitelist"
                        :max="10"
                        :input-props="{ placeholder: 'Add IP (e.g. 1.2.3.4)' }"
                    />

                    <p class="text-xs text-gray-400">
                        Tip: Add your server's public IP addresses. Max 10 entries.
                    </p>
                </div>
            </n-card>
        </div>

        <n-divider />

        <!-- API Documentation Section -->
        <n-card title="📚 API Documentation">
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h4 class="font-medium mb-1">Quick Start</h4>
                        <p class="text-sm text-gray-500">Integration guide for new developers</p>
                    </div>
                    <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h4 class="font-medium mb-1">API Reference</h4>
                        <p class="text-sm text-gray-500">Complete endpoint documentation</p>
                    </div>
                    <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h4 class="font-medium mb-1">SDK Downloads</h4>
                        <p class="text-sm text-gray-500">PHP, Node.js, Python libraries</p>
                    </div>
                </div>

                <n-space>
                    <n-button type="primary" @click="openDocs">
                        📄 View Full Documentation
                    </n-button>
                    <n-button secondary>
                        💬 Contact Support
                    </n-button>
                </n-space>
            </div>
        </n-card>
    </div>
</template>
