<template>
  <div v-if="visible" class="loading-wrapper" :class="{ fullscreen: fullscreen }">
    <div class="loading">
      <div class="loading-spinner">
        <div class="loading-circle"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="scss">
.loading-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(255 255 255 / 70%);

  &.fullscreen {
    position: fixed;
    z-index: 9999;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;

    &-spinner {
      position: relative;
      width: 40px;
      height: 40px;
    }

    &-circle {
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: $primary-color;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    &-text {
      margin-top: 10px;
      font-size: 14px;
      color: $text-color;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
