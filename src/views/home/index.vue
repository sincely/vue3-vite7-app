<template>
  <div>
    <el-button type="primary">11</el-button>
    <el-row>11111111</el-row>
    <el-button @click="handle">11111111111</el-button>
    <div class="theme"></div>
  </div>
</template>

<script setup>
const handle = () => {
  ElMessage.success('This is a success message')
}
</script>

<style lang="scss" scoped>
.theme {
  height: 50px;
  background-color: $brown;
}
</style>
