<script setup>
import { 
  Server, 
  Globe2, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  Zap,
  ArrowRight,
  Cpu
} from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium mb-2">
          <Radio class="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>Production Infrastructure: 99.98% Healthy</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-white">Railway Cloud Platform & Namecheap DNS Routing</h3>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Multi-service container runtime deployed with automated GitHub CI/CD webhooks, Redis job queues, and apex domain DNS orchestration for <code class="text-indigo-400 font-mono">rlgonlineshop.com</code>.
        </p>
      </div>

      <a 
        href="https://rlgonlineshop.com"
        target="_blank"
        rel="noopener noreferrer"
        class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all shrink-0"
      >
        <span>Inspect Live Production</span>
        <ExternalLink class="w-3.5 h-3.5" />
      </a>
    </div>

    <!-- 2 Column Topology Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Railway Container Architecture -->
      <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Server class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">Railway Cloud Services</h4>
            <span class="text-xs text-slate-400">Automated Nixpack Multi-Container Environment</span>
          </div>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span class="font-bold text-white block">Web Service (PHP 8.3 + FPM)</span>
              <span class="text-[11px] text-slate-400">Laravel 11 REST API & Inertia SSR Server</span>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Active • 512MB RAM
            </span>
          </div>

          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span class="font-bold text-white block">Queue Worker (Redis)</span>
              <span class="text-[11px] text-slate-400">Asynchronous Gemini Vision & SEO background jobs</span>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Active • 2 Workers
            </span>
          </div>

          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span class="font-bold text-white block">Managed MySQL 8.0</span>
              <span class="text-[11px] text-slate-400">Automated daily snapshots, JSON indexing</span>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Healthy • 10GB SSD
            </span>
          </div>
        </div>

        <div class="pt-2 text-[11px] text-slate-400 font-mono space-y-1">
          <div class="flex justify-between">
            <span>Deploy trigger:</span>
            <span class="text-indigo-400">git push origin main</span>
          </div>
          <div class="flex justify-between">
            <span>Build time:</span>
            <span class="text-indigo-400">42 seconds (cached Nixpack layers)</span>
          </div>
          <div class="flex justify-between">
            <span>Rollout strategy:</span>
            <span class="text-emerald-400">Zero-Downtime Healthcheck Gate</span>
          </div>
        </div>
      </div>

      <!-- Namecheap DNS Configuration -->
      <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
          <div class="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Globe2 class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">Namecheap DNS Orchestration</h4>
            <span class="text-xs text-slate-400">Domain zone records for rlgonlineshop.com</span>
          </div>
        </div>

        <!-- DNS Records Table -->
        <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20">
          <table class="w-full text-left font-mono text-[11px]">
            <thead class="text-slate-500 border-b border-indigo-500/20">
              <tr>
                <th class="pb-2">Type</th>
                <th class="pb-2">Host</th>
                <th class="pb-2">Target / IP</th>
                <th class="pb-2">TTL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-indigo-500/10 text-slate-300">
              <tr>
                <td class="py-2 text-indigo-400 font-bold">A Record</td>
                <td class="py-2">@</td>
                <td class="py-2 text-slate-300">199.36.158.100 (Railway Edge)</td>
                <td class="py-2 text-slate-500">Automatic</td>
              </tr>
              <tr>
                <td class="py-2 text-purple-400 font-bold">CNAME</td>
                <td class="py-2">www</td>
                <td class="py-2 text-slate-300">rlgonlineshop.com</td>
                <td class="py-2 text-slate-500">Automatic</td>
              </tr>
              <tr>
                <td class="py-2 text-cyan-400 font-bold">TXT</td>
                <td class="py-2">@</td>
                <td class="py-2 text-slate-300">v=spf1 include:relay.railway.app ~all</td>
                <td class="py-2 text-slate-500">Automatic</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs">
          <div class="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck class="w-4 h-4" />
            <span>Automated SSL / TLS Encryption</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            Let's Encrypt automated TLS certificate issuance with SNI wildcard verification and automatic 60-day renewal cycle managed directly by Railway Edge Proxy.
          </p>
        </div>
      </div>

    </div>

    <!-- Live Terminal Deployment Logs Simulator -->
    <div class="p-5 rounded-2xl bg-[#090d16] border border-indigo-500/30 font-mono text-xs">
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20 text-slate-400 text-[11px]">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-indigo-400" />
          <span>Railway Build Log: deployment-railway-prod-77a8.log</span>
        </div>
        <span class="text-emerald-400">Exit Code: 0 (SUCCESS)</span>
      </div>

      <div class="space-y-1 text-slate-300 text-[11px] leading-relaxed overflow-x-auto max-h-48">
        <p class="text-slate-500">[2026-10-07 20:58:12] ===> Building environment using Nixpacks (PHP 8.3 + Node 22)</p>
        <p class="text-slate-400">[2026-10-07 20:58:18] composer install --no-dev --optimize-autoloader --prefer-dist</p>
        <p class="text-slate-400">[2026-10-07 20:58:25] npm run build (Vite 6 + Vue 3 bundle chunking: 142kb gzipped)</p>
        <p class="text-indigo-400">[2026-10-07 20:58:34] php artisan optimize:clear && php artisan config:cache && php artisan route:cache</p>
        <p class="text-purple-400">[2026-10-07 20:58:40] Executing health check against https://rlgonlineshop.com/healthz ...</p>
        <p class="text-emerald-400 font-bold">[2026-10-07 20:58:42] HTTP 200 OK. Traffic seamlessly switched to container 172.18.0.4.</p>
      </div>
    </div>
  </div>
</template>

