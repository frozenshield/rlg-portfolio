<script setup>
import AdminLayout from '@/modules/admin/AdminLayout.vue'
import AdminLoginView from '@/modules/admin/AdminLoginView.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-slate-50 text-left">
    <AdminLoginView v-if="route.path === '/admin/login'" class="!min-h-full !h-full overflow-y-auto" />
    <AdminLayout v-else />
  </div>
</template>
