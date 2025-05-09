<script lang="ts" setup>
import { getConfig } from "@/config";

const TITLE = getConfig("Title");
</script>

<template>
  <footer
    class="layout-footer text-[rgba(0,0,0,0.6)] dark:text-[rgba(220,220,242,0.8)]"
  >
<<<<<<< HEAD
    Copyright © 2020-present
    <a
      class="hover:text-primary"
      href="https://github.com/pure-admin"
=======
    Copyright © 2025-present
    <a
      class="hover:text-primary"
      href="https://github.com/ifavcode/light-ai"
>>>>>>> 646f847774b2fcfc24adedfa4c319b003985df9e
      target="_blank"
    >
      &nbsp;{{ TITLE }}
    </a>
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 0 8px;
  font-size: 14px;
}
</style>
