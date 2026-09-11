<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    disabled?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    fullWidth: false,
  },
)

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[base, variants[variant], sizes[size], fullWidth ? 'w-full' : '']"
  >
    <slot />
  </button>
</template>
