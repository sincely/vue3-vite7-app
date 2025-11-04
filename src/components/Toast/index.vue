<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="toast" :class="[`toast-${type}`]">
      <div v-if="type" class="toast-icon">
        <i class="icon" :class="iconClass"></i>
      </div>
      <div class="toast-content">{{ message }}</div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const visible = ref(false)
let timer = null

const iconClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'icon-success'
    case 'warning':
      return 'icon-warning'
    case 'error':
      return 'icon-error'
    default:
      return 'icon-info'
  }
})

const emit = defineEmits(['destroy'])

function close() {
  visible.value = false
  setTimeout(() => {
    emit('destroy')
  }, 300) // 等待动画结束
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    timer = window.setTimeout(() => {
      close()
    }, props.duration)
  }
})

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

defineExpose({
  close
})
</script>

<style scoped lang="scss">
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 9999;
  display: flex;
  align-items: center;
  min-width: 300px;
  max-width: 80%;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 15%);
  transform: translateX(-50%);

  &-icon {
    margin-right: 10px;
    font-size: 20px;
  }

  &-content {
    font-size: 14px;
    line-height: 1.5;
  }

  &-info {
    .toast-icon {
      color: $primary-color;
    }
  }

  &-success {
    .toast-icon {
      color: $success-color;
    }
  }

  &-warning {
    .toast-icon {
      color: $warning-color;
    }
  }

  &-error {
    .toast-icon {
      color: $error-color;
    }
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
