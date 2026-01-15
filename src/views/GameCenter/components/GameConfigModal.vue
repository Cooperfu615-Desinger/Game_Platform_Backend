<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NForm, NFormItem, NInput, NSelect, 
    NSwitch, NInputNumber, NButton, useMessage 
} from 'naive-ui'
import type { Game } from '../../../types/game'

const props = defineProps<{
    show: boolean
    game: Game | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const message = useMessage()
const loading = ref(false)

// Form State
const formModel = ref({
    status: false,
    rtp: '96.5%',
    max_bet: 0
})

const rtpOptions = [
    { label: '99.0% (Promotion)', value: '99.0%' },
    { label: '96.5% (Standard)', value: '96.5%' },
    { label: '95.0%', value: '95.0%' },
    { label: '92.0%', value: '92.0%' },
    { label: '90.0% (High Margin)', value: '90.0%' }
]

// Initialize form when game changes
watch(() => props.game, (newGame) => {
    if (newGame) {
        formModel.value = {
            status: newGame.status === 'active',
            rtp: String(newGame.rtp_default) + '%', // Simple mapping for mock
            max_bet: 1000 // Mock default
        }
    }
}, { immediate: true })

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    if (!props.game) return

    loading.value = true
    try {
        const payload = {
            id: props.game.game_id,
            status: formModel.value.status ? 'active' : 'maintenance',
            rtp: parseFloat(formModel.value.rtp),
            max_bet: formModel.value.max_bet
        }

        // Mock API Call
        const res = await fetch('/api/v2/game/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const data = await res.json()

        if (data.code === 0) {
            message.success('Game configuration updated successfully')
            emit('refresh')
            handleClose()
        } else {
            message.error(data.msg || 'Update failed')
        }
    } catch (e) {
        message.error('An error occurred while saving')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[600px]"
        preset="card"
        :title="`Game Configuration: ${game?.name_en || ''}`"
        :bordered="false"
        size="huge"
        :mask-closable="false"
    >
        <n-form
            ref="formRef"
            :model="formModel"
            label-placement="left"
            label-width="120"
            require-mark-placement="right-hanging"
        >
            <!-- Read-only Info -->
            <n-form-item label="Game ID">
                <n-input :value="game?.game_id" disabled placeholder="Read Only" />
            </n-form-item>
            <n-form-item label="Provider">
                <n-input :value="game?.provider" disabled placeholder="Read Only" />
            </n-form-item>

            <!-- Editable Settings -->
            <n-form-item label="Status" path="status">
                <n-switch v-model:value="formModel.status">
                    <template #checked>Active</template>
                    <template #unchecked>Maintenance</template>
                </n-switch>
            </n-form-item>

            <n-form-item label="RTP Setting" path="rtp">
                <n-select 
                    v-model:value="formModel.rtp" 
                    :options="rtpOptions" 
                    placeholder="Select RTP Level"
                />
            </n-form-item>

            <n-form-item label="Max Bet" path="max_bet">
                <n-input-number 
                    v-model:value="formModel.max_bet" 
                    :min="0" 
                    :step="10"
                    placeholder="Enter limit"
                    class="w-full"
                >
                    <template #suffix>USD</template>
                </n-input-number>
            </n-form-item>

            <!-- Footer Actions -->
            <div class="flex justify-end gap-3 mt-6">
                <n-button @click="handleClose" :disabled="loading">
                    Cancel
                </n-button>
                <n-button type="primary" @click="handleSave" :loading="loading">
                    Save Changes
                </n-button>
            </div>
        </n-form>
    </n-modal>
</template>
