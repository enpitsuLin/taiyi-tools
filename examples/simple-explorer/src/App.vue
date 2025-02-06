<script setup lang="ts">
import type { SignedBlock } from '@taiyinet/ctaiyi'
import { Client } from '@taiyinet/ctaiyi'
import { ref } from 'vue'

const client = Client.testnet()
const blockNum = ref(0)

const loading = ref(false)

const blockDetails = ref<SignedBlock | null>(null)
async function queryBlock() {
  loading.value = true
  const block = await client.baiyujing.getBlock(blockNum.value)
  blockDetails.value = block
  loading.value = false
}
</script>

<template>
  <main
    text="center gray-700 dark:gray-200"
    mx-auto max-w-5xl border="~ gray-300 dark:gray-700 rounded-md"
    p="y4 x2" flex="~ col gap-4 items-center"
  >
    <h1>Simple Explorer</h1>
    <div flex="~ gap-2 items-center">
      <label for="blockNum">Block Number:</label>
      <input
        id="blockNum"
        v-model="blockNum" type="text"
        border="~ gray-300 dark:gray-700 rounded-md"
        p="x2 y1"
      >
      <button
        type="button" rounded-md p="x2 y1"
        @click="queryBlock"
      >
        Query
      </button>
    </div>
    <div>
      <h2>Block Details</h2>
      <pre>
        {{ blockDetails }}
      </pre>
    </div>
  </main>
</template>
