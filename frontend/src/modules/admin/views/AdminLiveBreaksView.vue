<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { resolveApiUrl } from "@/shared/utils/api";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useAdminStore } from "../admin.store";

interface BoxBreakSlot {
  id: number;
  box_break_id: number;
  slot_number: number;
  slot_name: string;
  tier_badge?: string;
  price: number;
  is_claimed: boolean;
  user_id?: number | null;
  user_name?: string | null;
  claimed_at?: string | null;
}

interface BoxBreak {
  id: number;
  title: string;
  subtitle?: string;
  box_type?: string;
  series_name?: string;
  stream_url?: string;
  stream_embed_url?: string;
  status: "upcoming" | "live" | "completed";
  cover_image?: string;
  total_slots: number;
  claimed_slots_count: number;
  price_per_slot: number;
  scheduled_at?: string;
  created_at?: string;
  slots?: BoxBreakSlot[];
}

const authStore = useAuthStore();
const adminStore = useAdminStore();

// YouTube Data API v3 State
const isFetchingYouTube = ref(false);
const youtubeMetadata = ref<any>(null);
let youtubeDebounceTimer: any = null;

const fetchYouTubeData = async (url: string) => {
  if (!url || !url.trim()) return;
  if (!url.includes("youtube.com") && !url.includes("youtu.be")) return;

  isFetchingYouTube.value = true;
  try {
    const data = await adminStore.fetchYouTubeMetadata(url.trim());
    if (data) {
      youtubeMetadata.value = data;
      if (data.title) {
        editingBreak.value.title = data.title;
      }
      if (data.thumbnail_url) {
        editingBreak.value.cover_image = data.thumbnail_url;
      }
      if (data.channel_title && (!editingBreak.value.subtitle || editingBreak.value.subtitle.includes("Case Break") || editingBreak.value.subtitle.includes("Factory-Sealed"))) {
        editingBreak.value.subtitle = `Live Stream by ${data.channel_title}`;
      }
      showFeedback("YouTube stream metadata loaded automatically!");
    }
  } catch (err: any) {
    console.warn("YouTube fetch error:", err);
  } finally {
    isFetchingYouTube.value = false;
  }
};

const handleStreamUrlBlur = () => {
  if (editingBreak.value.stream_url) {
    fetchYouTubeData(editingBreak.value.stream_url);
  }
};

const handleStreamUrlInput = () => {
  if (youtubeDebounceTimer) clearTimeout(youtubeDebounceTimer);
  const val = editingBreak.value.stream_url;
  if (val && (val.includes("youtube.com") || val.includes("youtu.be"))) {
    youtubeDebounceTimer = setTimeout(() => {
      fetchYouTubeData(val);
    }, 600);
  }
};
const isLoading = ref(true);
const isSaving = ref(false);
const boxBreaks = ref<BoxBreak[]>([]);
const searchQuery = ref("");
const statusFilter = ref<string>("all");

// Modals & Drawers
const isEditModalOpen = ref(false);
const editingBreak = ref<Partial<BoxBreak>>({
  title: "",
  subtitle: "",
  box_type: "Sealed Booster Box",
  series_name: "Pokémon TCG",
  stream_url: "",
  status: "upcoming",
  cover_image: "",
  total_slots: 10,
  price_per_slot: 450,
  scheduled_at: "",
});

const isSpotModalOpen = ref(false);
const selectedBreakForSpots = ref<BoxBreak | null>(null);
const newSpotForm = ref({
  slot_name: "",
  tier_badge: "SSR",
  price: 450,
});

const feedbackMessage = ref<{ type: "success" | "error"; text: string } | null>(null);

const showFeedback = (text: string, type: "success" | "error" = "success") => {
  feedbackMessage.value = { text, type };
  setTimeout(() => {
    feedbackMessage.value = null;
  }, 4000);
};

const getAuthHeaders = () => {
  const token = authStore.token || localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Fetch all box breaks
const fetchBreaks = async () => {
  isLoading.value = true;
  try {
    const res = await fetch(resolveApiUrl("/api/admin/box-breaks"), {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      boxBreaks.value = data.data || [];
    } else {
      showFeedback("Failed to load live box breaks", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error loading box breaks", "error");
  } finally {
    isLoading.value = false;
  }
};

// Filtered box breaks
const filteredBreaks = computed(() => {
  return boxBreaks.value.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.series_name && b.series_name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (b.box_type && b.box_type.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesStatus = statusFilter.value === "all" || b.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Summary Stats
const stats = computed(() => {
  const total = boxBreaks.value.length;
  const liveCount = boxBreaks.value.filter((b) => b.status === "live").length;
  const totalSlotsClaimed = boxBreaks.value.reduce((acc, b) => acc + (b.claimed_slots_count || 0), 0);
  const totalRevenue = boxBreaks.value.reduce(
    (acc, b) => acc + (b.claimed_slots_count || 0) * Number(b.price_per_slot || 0),
    0
  );
  return { total, liveCount, totalSlotsClaimed, totalRevenue };
});

// Create / Edit Break
const openCreateModal = () => {
  editingBreak.value = {
    title: "",
    subtitle: "Factory-Sealed Case Break • Live Broadcast",
    box_type: "Booster Box",
    series_name: "Pokémon Scarlet & Violet",
    stream_url: "",
    status: "upcoming",
    cover_image: "",
    total_slots: 10,
    price_per_slot: 450,
    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  };
  isEditModalOpen.value = true;
};

const openEditModal = (b: BoxBreak) => {
  editingBreak.value = { ...b };
  if (editingBreak.value.scheduled_at) {
    editingBreak.value.scheduled_at = new Date(editingBreak.value.scheduled_at).toISOString().slice(0, 16);
  }
  isEditModalOpen.value = true;
};

const saveBreak = async () => {
  if (!editingBreak.value.title) {
    showFeedback("Please enter a title for the box break", "error");
    return;
  }
  isSaving.value = true;
  try {
    const isUpdating = !!editingBreak.value.id;
    const url = isUpdating
      ? resolveApiUrl(`/api/admin/box-breaks/${editingBreak.value.id}`)
      : resolveApiUrl("/api/admin/box-breaks");

    const method = isUpdating ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...editingBreak.value,
        set_name: editingBreak.value.series_name || (editingBreak.value as any).set_name || "Sealed Booster Box",
        description: editingBreak.value.subtitle || editingBreak.value.description,
        image_url: editingBreak.value.cover_image || editingBreak.value.image_url,
        scheduled_live_at: editingBreak.value.scheduled_at || (editingBreak.value as any).scheduled_live_at,
      }),
    });

    if (res.ok) {
      showFeedback(isUpdating ? "Box break updated successfully!" : "New box break published!");
      isEditModalOpen.value = false;
      await fetchBreaks();
    } else {
      const err = await res.json();
      showFeedback(err?.message || "Failed to save box break", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  } finally {
    isSaving.value = false;
  }
};

// 1-Click Status Quick Switcher
const updateStatus = async (b: BoxBreak, newStatus: "upcoming" | "live" | "completed") => {
  try {
    const res = await fetch(resolveApiUrl(`/api/admin/box-breaks/${b.id}/status`), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      b.status = newStatus;
      showFeedback(`Stream status changed to ${newStatus.toUpperCase()}`);
    } else {
      showFeedback("Failed to update status", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  }
};

// Delete Box Break
const deleteBreak = async (b: BoxBreak) => {
  if (!confirm(`Are you sure you want to delete break "${b.title}"?`)) return;
  try {
    const res = await fetch(resolveApiUrl(`/api/admin/box-breaks/${b.id}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      showFeedback("Box break deleted successfully");
      await fetchBreaks();
    } else {
      showFeedback("Failed to delete box break", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  }
};

// Open Spot Manager Drawer
const openSpotManager = (b: BoxBreak) => {
  selectedBreakForSpots.value = b;
  newSpotForm.value = {
    slot_name: `Spot #${(b.slots?.length || 0) + 1} - Fire / Charizard`,
    tier_badge: "SSR",
    price: Number(b.price_per_slot) || 450,
  };
  isSpotModalOpen.value = true;
};

// Add Spot to Break
const addSpot = async () => {
  if (!selectedBreakForSpots.value) return;
  if (!newSpotForm.value.slot_name) {
    showFeedback("Please provide a spot name or description", "error");
    return;
  }
  isSaving.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/api/admin/box-breaks/${selectedBreakForSpots.value.id}/slots`),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newSpotForm.value),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (!selectedBreakForSpots.value.slots) selectedBreakForSpots.value.slots = [];
      selectedBreakForSpots.value.slots.push(data.data);
      selectedBreakForSpots.value.total_slots = selectedBreakForSpots.value.slots.length;
      showFeedback("New break spot added!");
      newSpotForm.value.slot_name = `Spot #${selectedBreakForSpots.value.slots.length + 1}`;
    } else {
      const err = await res.json();
      showFeedback(err?.message || "Failed to add spot", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  } finally {
    isSaving.value = false;
  }
};

// Remove Unsold Spot
const deleteSpot = async (slotId: number) => {
  if (!selectedBreakForSpots.value) return;
  if (!confirm("Are you sure you want to remove this spot?")) return;
  try {
    const res = await fetch(resolveApiUrl(`/api/admin/box-breaks/slots/${slotId}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      selectedBreakForSpots.value.slots = selectedBreakForSpots.value.slots?.filter(
        (s) => s.id !== slotId
      );
      selectedBreakForSpots.value.total_slots = selectedBreakForSpots.value.slots?.length || 0;
      showFeedback("Spot removed successfully");
    } else {
      const err = await res.json();
      showFeedback(err?.message || "Cannot delete claimed spot", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  }
};

onMounted(() => {
  fetchBreaks();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Feedback Toast -->
    <div
      v-if="feedbackMessage"
      class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 backdrop-blur-md transition-all animate-bounce"
      :class="
        feedbackMessage.type === 'success'
          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
          : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
      "
    >
      <span>{{ feedbackMessage.type === "success" ? "✅" : "⚠️" }}</span>
      <span>{{ feedbackMessage.text }}</span>
    </div>

    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-xl"
    >
      <div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">📡</span>
          <h1 class="text-2xl font-black text-white tracking-wide">
            Live Box Breaks &amp; Streaming Hub
          </h1>
          <span
            v-if="stats.liveCount > 0"
            class="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
          >
            ● {{ stats.liveCount }} ON AIR
          </span>
        </div>
        <p class="text-sm text-slate-400 mt-1">
          Configure real-time stream links, video embeds (YouTube / Twitch / Kick), manage spot tier claiming, and live broadcast states.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchBreaks"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-bold text-sm flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
        <button
          type="button"
          @click="openCreateModal"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>+</span> Create Box Break
        </button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Total Breaks</p>
        <p class="text-2xl font-black text-white mt-1">{{ stats.total }}</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Live Broadcasts</p>
        <p class="text-2xl font-black text-rose-400 mt-1 flex items-center gap-2">
          {{ stats.liveCount }}
          <span v-if="stats.liveCount > 0" class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
        </p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Slots Claimed</p>
        <p class="text-2xl font-black text-amber-400 mt-1">{{ stats.totalSlotsClaimed }}</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Break Volume</p>
        <p class="text-2xl font-black text-emerald-400 mt-1">
          ₱{{ stats.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 }) }}
        </p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by series, box type or title..."
          class="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-amber-400 focus:outline-none"
        />
        <span class="absolute left-3 top-2.5 text-slate-500">🔍</span>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
        <button
          v-for="st in ['all', 'live', 'upcoming', 'completed']"
          :key="st"
          @click="statusFilter = st"
          class="px-4 py-2 rounded-xl text-xs font-black capitalize transition-all border shrink-0"
          :class="
            statusFilter === st
              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          "
        >
          {{ st === "all" ? "All Breaks" : st }}
        </button>
      </div>
    </div>

    <!-- Box Breaks Grid / Cards -->
    <div v-if="isLoading" class="text-center py-20 text-slate-500">
      <div class="animate-spin text-4xl mb-3">📡</div>
      <p class="text-sm font-bold">Loading live breaks and broadcast streams...</p>
    </div>

    <div
      v-else-if="filteredBreaks.length === 0"
      class="text-center py-16 px-4 rounded-3xl bg-slate-900/50 border border-slate-800"
    >
      <span class="text-5xl">📦</span>
      <h3 class="text-lg font-bold text-white mt-3">No Box Breaks Found</h3>
      <p class="text-sm text-slate-400 mt-1">
        Get started by creating your first collector box break session with video streaming.
      </p>
      <button
        type="button"
        @click="openCreateModal"
        class="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition"
      >
        + Create Box Break
      </button>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="b in filteredBreaks"
        :key="b.id"
        class="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-lg flex flex-col justify-between"
      >
        <!-- Top Media & Status Header -->
        <div class="relative">
          <!-- Video Stream Embed or Cover Image -->
          <div v-if="b.stream_embed_url" class="relative aspect-video w-full bg-black overflow-hidden border-b border-slate-800">
            <iframe
              :src="b.stream_embed_url"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <div
            v-else
            class="h-48 w-full bg-cover bg-center relative border-b border-slate-800"
            :style="{
              backgroundImage: `url(${b.cover_image || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=700&auto=format&fit=crop&q=80'})`,
            }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          </div>

          <!-- Status Ribbon -->
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span
              v-if="b.status === 'live'"
              class="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-lg shadow-rose-600/40 flex items-center gap-1.5 animate-pulse"
            >
              <span class="w-2 h-2 rounded-full bg-white"></span>
              LIVE ON AIR
            </span>
            <span
              v-else-if="b.status === 'upcoming'"
              class="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md"
            >
              📅 UPCOMING
            </span>
            <span
              v-else
              class="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-400 border border-slate-700 backdrop-blur-md"
            >
              🏁 COMPLETED
            </span>

            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-700 backdrop-blur-md">
              {{ b.box_type || "Booster Box" }}
            </span>
          </div>

          <!-- Price & Slots Overlay -->
          <div class="absolute top-3 right-3 text-right">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
              ₱{{ Number(b.price_per_slot).toLocaleString("en-PH") }} / Slot
            </span>
          </div>
        </div>

        <!-- Body Details -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-amber-400">
              <span>{{ b.series_name || "Official TCG Release" }}</span>
              <span v-if="b.scheduled_at" class="text-slate-400">• {{ new Date(b.scheduled_at).toLocaleString() }}</span>
            </div>
            <h3 class="text-lg font-black text-white mt-1 leading-snug">
              {{ b.title }}
            </h3>
            <p v-if="b.subtitle" class="text-xs text-slate-400 mt-1 line-clamp-2">
              {{ b.subtitle }}
            </p>

            <!-- Stream URL Info -->
            <div class="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 truncate text-slate-400">
                <span class="text-rose-400">🎥</span>
                <span class="truncate font-mono">{{ b.stream_url || "No active stream URL configured" }}</span>
              </div>
              <a
                v-if="b.stream_url"
                :href="b.stream_url"
                target="_blank"
                class="text-amber-400 hover:text-amber-300 font-bold shrink-0 ml-2"
              >
                Open ↗
              </a>
            </div>

            <!-- Allocation Slots Progress -->
            <div class="mt-4">
              <div class="flex justify-between text-xs font-bold mb-1">
                <span class="text-slate-300">
                  Slots Claimed:
                  <span class="text-amber-400">{{ b.claimed_slots_count || 0 }}</span> / {{ b.total_slots }}
                </span>
                <span class="text-slate-400">
                  {{ Math.round(((b.claimed_slots_count || 0) / (b.total_slots || 1)) * 100) }}% Filled
                </span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  :style="{
                    width: `${Math.min(100, ((b.claimed_slots_count || 0) / (b.total_slots || 1)) * 100)}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons & 1-Click Status Bar -->
          <div class="pt-3 border-t border-slate-800/80 space-y-3">
            <!-- 1-Click Status Toggles -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-400">Broadcast Status:</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="updateStatus(b, 'upcoming')"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold border transition"
                  :class="
                    b.status === 'upcoming'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  @click="updateStatus(b, 'live')"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold border transition"
                  :class="
                    b.status === 'live'
                      ? 'bg-rose-600 text-white border-rose-500 font-black animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Go Live 🔴
                </button>
                <button
                  type="button"
                  @click="updateStatus(b, 'completed')"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold border transition"
                  :class="
                    b.status === 'completed'
                      ? 'bg-slate-700 text-white border-slate-600 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Finish
                </button>
              </div>
            </div>

            <!-- Operations: Manage Spots, Edit, Delete -->
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                @click="openSpotManager(b)"
                class="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>🎯</span> Manage Spots ({{ b.slots?.length || b.total_slots }})
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="openEditModal(b)"
                  class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  @click="deleteBreak(b)"
                  class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 my-8"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">📡</span>
            <h2 class="text-lg font-black text-white">
              {{ editingBreak.id ? "Edit Box Break & Stream" : "New Live Box Break Session" }}
            </h2>
          </div>
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Title -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">Break Title *</label>
            <input
              v-model="editingBreak.title"
              type="text"
              placeholder="e.g. 1st Edition Scarlet & Violet Sealed Case Break"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Subtitle / Notes -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">Subtitle / Description</label>
            <input
              v-model="editingBreak.subtitle"
              type="text"
              placeholder="e.g. 36 Booster Packs • All Holos & Hits Ship Directly"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Series Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">TCG Series / Franchise</label>
            <input
              v-model="editingBreak.series_name"
              type="text"
              placeholder="e.g. Pokémon TCG / One Piece / Gundam"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Box Type -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Product / Box Type</label>
            <input
              v-model="editingBreak.box_type"
              type="text"
              placeholder="e.g. Sealed Case, Booster Box, Tin Box"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Stream URL (YouTube, Twitch, Kick) -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">
              Stream Video URL (YouTube Watch URL / Twitch / Kick)
            </label>
            <input
              v-model="editingBreak.stream_url"
              type="text"
              @blur="handleStreamUrlBlur"
              @input="handleStreamUrlInput"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
            <p class="text-[11px] text-slate-500">
              Supports standard YouTube URLs, Live streams, and Twitch embeds. Embed URL will be generated automatically.
            </p>
          </div>

          <!-- Cover Image URL -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">Cover Image URL</label>
            <input
              v-model="editingBreak.cover_image"
              type="text"
              placeholder="https://img.youtube.com/vi/..."
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
            <div
              v-if="editingBreak.cover_image"
              class="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 animate-fade-in mt-2"
            >
              <img
                :src="editingBreak.cover_image"
                alt="Stream Cover"
                class="w-20 h-14 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
              />
              <div class="min-w-0 text-left">
                <p class="text-xs font-bold text-white truncate">{{ editingBreak.title || 'Stream Preview' }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ editingBreak.cover_image }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-emerald-400 font-bold">✓ High-Res Cover Active</span>
                  <span v-if="youtubeMetadata?.live_chat_id" class="text-[10px] text-red-400 font-bold">• Live Chat Active</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Slots -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Total Break Slots</label>
            <input
              v-model.number="editingBreak.total_slots"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Price Per Slot -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Price Per Slot (₱ PHP)</label>
            <input
              v-model.number="editingBreak.price_per_slot"
              type="number"
              min="0"
              step="50"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Scheduled Broadcast Date/Time -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Scheduled Date &amp; Time</label>
            <input
              v-model="editingBreak.scheduled_at"
              type="datetime-local"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Broadcast Status -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Initial Broadcast Status</label>
            <select
              v-model="editingBreak.status"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="upcoming">Upcoming (Scheduled)</option>
              <option value="live">Live On Air</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveBreak"
            :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20"
          >
            {{ isSaving ? "Saving..." : editingBreak.id ? "Update Box Break" : "Create Box Break" }}
          </button>
        </div>
      </div>
    </div>

    <!-- SPOT / TIER MANAGER DRAWER -->
    <div
      v-if="isSpotModalOpen && selectedBreakForSpots"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 class="text-lg font-black text-white flex items-center gap-2">
              <span>🎯</span> Break Spots Manager: {{ selectedBreakForSpots.title }}
            </h2>
            <p class="text-xs text-slate-400">
              Total {{ selectedBreakForSpots.slots?.length || 0 }} configured spots. Unsold spots can be added or deleted.
            </p>
          </div>
          <button
            type="button"
            @click="isSpotModalOpen = false"
            class="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Add New Spot Form -->
        <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shrink-0 space-y-3">
          <h4 class="text-xs font-black text-amber-400 uppercase tracking-wider">Add Break Tier / Spot</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              v-model="newSpotForm.slot_name"
              type="text"
              placeholder="Spot Name (e.g. Spot #1 - Charizard)"
              class="sm:col-span-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
            />
            <div class="flex gap-2">
              <select
                v-model="newSpotForm.tier_badge"
                class="w-24 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="GRAIL">GRAIL</option>
                <option value="SSR">SSR</option>
                <option value="SR">SR</option>
                <option value="R">R</option>
                <option value="STD">STD</option>
              </select>
              <input
                v-model.number="newSpotForm.price"
                type="number"
                placeholder="Price"
                class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              @click="addSpot"
              :disabled="isSaving"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition"
            >
              + Add Spot
            </button>
          </div>
        </div>

        <!-- Spots List -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          <div
            v-if="!selectedBreakForSpots.slots || selectedBreakForSpots.slots.length === 0"
            class="text-center py-8 text-slate-500 text-xs"
          >
            No individual spots configured yet. Add your first spot above.
          </div>

          <div
            v-for="s in selectedBreakForSpots.slots"
            :key="s.id"
            class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                #{{ s.slot_number }}
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white">{{ s.slot_name }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-black"
                    :class="
                      s.tier_badge === 'GRAIL'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : s.tier_badge === 'SSR'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    "
                  >
                    {{ s.tier_badge || 'SSR' }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  ₱{{ Number(s.price).toLocaleString("en-PH") }}
                  <span v-if="s.is_claimed" class="text-emerald-400 ml-2">
                    Claimed by: <span class="font-bold">{{ s.user_name || 'Collector' }}</span>
                  </span>
                  <span v-else class="text-amber-400 ml-2">Available</span>
                </p>
              </div>
            </div>

            <div>
              <span
                v-if="s.is_claimed"
                class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                CLAIMED
              </span>
              <button
                v-else
                type="button"
                @click="deleteSpot(s.id)"
                class="px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold transition"
                title="Delete unsold spot"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800 shrink-0 text-right">
          <button
            type="button"
            @click="isSpotModalOpen = false"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Close Spot Manager
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
