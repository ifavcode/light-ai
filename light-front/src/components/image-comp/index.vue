<script setup lang="ts">

const props = defineProps<{
  url?: string,
  classNames?: string,
}>()

</script>

<template>
  <img v-show="props.url && props.url !== ''" :class="props.classNames" :src="props.url" alt="加载中">
</template>