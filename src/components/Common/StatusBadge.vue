<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'

type StatusType = 'Active' | 'Suspended' | 'Maintenance' | 'active' | 'suspended' | 'maintenance' | string

interface Props {
    status: StatusType
    size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small'
})

// Normalize status to lowercase for comparison
const normalizedStatus = computed(() => props.status.toLowerCase())

// Tag type based on status
const tagType = computed(() => {
    switch (normalizedStatus.value) {
        case 'active':
            return 'success'
        case 'suspended':
        case 'inactive':
        case 'disabled':
            return 'error'
        case 'maintenance':
        case 'pending':
            return 'warning'
        default:
            return 'default'
    }
})

// Display label
const displayLabel = computed(() => {
    switch (normalizedStatus.value) {
        case 'active':
            return '🟢 Active'
        case 'suspended':
        case 'inactive':
        case 'disabled':
            return '🔴 Suspended'
        case 'maintenance':
            return '🟠 Maintenance'
        case 'pending':
            return '⏳ Pending'
        default:
            return props.status
    }
})
</script>

<template>
    <n-tag :type="tagType" :size="size" round :bordered="false">
        {{ displayLabel }}
    </n-tag>
</template>
