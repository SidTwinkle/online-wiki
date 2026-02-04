<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner" :class="colorClass"></div>
    <span v-if="text" class="loading-text" :class="textSizeClass">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'gray' | 'white'
  text?: string
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  center: false
})

const sizeClass = computed(() => {
  const classes = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-5'
  }
  return [
    'flex items-center',
    classes[props.size],
    props.center ? 'justify-center' : ''
  ].filter(Boolean).join(' ')
})

const colorClass = computed(() => {
  const classes = {
    primary: 'border-indigo-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }
  return classes[props.color]
})

const textSizeClass = computed(() => {
  const classes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  return [
    classes[props.size],
    props.color === 'white' ? 'text-white' : 'text-gray-600'
  ].join(' ')
})
</script>

<style scoped>
.spinner {
  @apply rounded-full border-2 border-t-transparent animate-spin;
}

.loading-spinner.gap-2 .spinner {
  @apply w-4 h-4;
}

.loading-spinner.gap-3 .spinner {
  @apply w-6 h-6;
}

.loading-spinner.gap-4 .spinner {
  @apply w-8 h-8;
}

.loading-spinner.gap-5 .spinner {
  @apply w-10 h-10;
}
</style>