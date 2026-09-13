<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue'
import BaseSpinner from './BaseSpinner.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
    fullWidth?: boolean
    icon?: LucideIcon
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    fullWidth: false,
    icon: undefined,
  },
)

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none'

const variants: Record<string, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
}

const iconSizes: Record<string, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[base, variants[variant], sizes[size], fullWidth ? 'w-full' : '']"
  >
    <BaseSpinner v-if="loading" size="sm" :class="variant === 'secondary' || variant === 'ghost' ? '' : 'border-white/30 border-t-white'" />
    <component :is="icon" v-else-if="icon" :class="iconSizes[size]" />
    <slot />
  </button>
</template>
