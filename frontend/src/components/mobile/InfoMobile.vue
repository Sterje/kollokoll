<template>
  <div class="page">
    <button class="back-button" aria-label="Tillbaka" @click="$router.back()">
      <ChevronLeft :size="30" />
    </button>
    <div class="page-header">
      <h2>Information</h2>
      <button
        class="icon-button"
        aria-label="Lägg till uppgift"
        @click="openAddModalFunction()"
      >
        <Plus :size="30" />
      </button>
    </div>
    <div v-if="loading" class="loader-container">
      <div class="loader" role="status" aria-label="Laddar"></div>
    </div>
    <span v-else-if="!hasInfos && !loading" class="no-info">
      Ingen information för tillfället, tryck på + knappen för att lägga till
      information.
    </span>
    <div v-else>
      <div class="list-item" v-for="info in infos" :key="info.id">
        <label class="checkbox-container">
          <input
            type="checkbox"
            :checked="info.is_completed"
            @change="toggleInfo(info, $event)"
          />
          <span class="checkmark"></span>
        </label>
        <div class="item-content">
          <div class="item-meta">
            <div class="item-date">
              {{ formatedCreatedAt(info.created_at) }}
            </div>
            <div class="item-author">{{ info.author }}</div>
          </div>
          <div class="item-title">
            {{ info.text }}
          </div>
          <div
            v-if="info.todo_comments && info.todo_comments.length > 0"
            class="comments-list"
          >
            <p
              v-for="comment in info.todo_comments"
              :key="comment.id"
              class="comment"
            >
              <span v-if="comment.author" class="comment-author"
                >{{ comment.author }}:</span
              >
              {{ comment.comment }}
            </p>
          </div>
        </div>
        <button
          class="icon-button"
          aria-label="Kommentera"
          @click="openAddInfoCommentFunction(info)"
        >
          <MessageCircleMore :size="20" />
        </button>
      </div>
    </div>
  </div>

  <!-- Add Info Modal -->
  <Transition name="fade">
    <div
      v-if="openAddInfoModal"
      class="modal-overlay"
      @click.self="openAddInfoModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lägg till uppgift</h3>
        </div>
        <textarea
          v-model="newInfoText"
          placeholder="Vad behöver göras?"
          class="modal-input modal-textarea"
        ></textarea>
        <input
          type="text"
          v-model="newInfoAuthor"
          class="modal-input"
          placeholder="Namn (frivilligt)"
        />
        <div class="modal-actions">
          <button type="button" @click="addInfo" class="btn btn-primary">
            Lägg till uppgift
          </button>
          <button
            type="button"
            @click="openAddInfoModal = false"
            class="btn btn-secondary"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Complete one or more infos -->
  <Transition name="slide-up">
    <div v-if="infos.some((info) => info.is_completed)" class="action-bar">
      <button
        type="button"
        @click="deleteCompletedInfos"
        class="action-btn btn-success"
      >
        Uppgift klar
      </button>
      <button
        type="button"
        @click="cancelCompletedInfos"
        class="action-btn btn-danger"
      >
        Avbryt
      </button>
    </div>
  </Transition>
  <!-- Add Todo Comment Modal -->
  <Transition name="fade">
    <div
      v-if="openAddInfoCommentModal"
      class="modal-overlay"
      @click.self="openAddInfoCommentModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lägg till kommentar</h3>
        </div>
        <textarea
          v-model="newInfoComment"
          placeholder="Skriv din kommentar här..."
          class="modal-input modal-textarea"
        ></textarea>
        <input
          type="text"
          v-model="newInfoCommentAuthor"
          class="modal-input"
          placeholder="Ditt namn (frivilligt)"
        />
        <div class="modal-actions">
          <button type="button" @click="addInfoComment" class="btn btn-primary">
            Lägg till kommentar
          </button>
          <button
            type="button"
            @click="openAddInfoCommentModal = false"
            class="btn btn-secondary"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { supabase } from "../../lib/supabase";
import { ref, watch } from "vue";
import { MessageCircleMore, Plus, ChevronLeft } from "lucide-vue-next";

const infos = ref<Info[]>([]);
const loading = ref(true);
const newInfoText = ref("");
const newInfoAuthor = ref("");
const openAddInfoCommentModal = ref(false);
const newInfoComment = ref("");
const newInfoCommentAuthor = ref("");
const selectedInfoId = ref<string | null>(null);
const hasInfos = () => infos.value.length > 0;

const openAddInfoModal = ref(false);

const formatedCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(createdAt));

const openAddModalFunction = () => {
  openAddInfoModal.value = true;
};

type TodoComment = {
  id?: string;
  comment: string;
  author: string | null;
};

type Info = {
  created_at: string;
  id: string;
  text: string;
  author: string | null;
  is_completed: boolean;
  todo_comments: TodoComment[];
};

const emit = defineEmits<{ count: [count: number] }>();
watch(
  () => infos.value.length,
  (n) => emit("count", n),
  { immediate: true },
);

const fetchInfos = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from("info")
    .select(
      // Select the "id", "text", "is_completed" columns from the "info" table
      // and include the related "info_comments" with their "id", "comment", "author", and "created_at" columns
      "id, text, is_completed, created_at, author, todo_comments(id, comment, author, created_at)",
    )
    // Order the infos by their creation date in descending order
    .order("created_at", { ascending: false });

  loading.value = false;

  if (error) {
    console.error("Fel vid hämtning av info:", error);
    return;
  }
  // Update the infos ref with the fetched data, or an empty array if no data is returned
  infos.value = (data || []).map((info) => ({
    ...info,
    is_completed: info.is_completed === true,
  })) as Info[];
};

const addInfo = async () => {
  const text = newInfoText.value.trim();
  const author = newInfoAuthor.value.trim();
  if (!text) return;

  const { data, error } = await supabase
    .from("info")
    .insert({
      text,
      author,
      is_completed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Fel vid tillägg av info:", error);
    return;
  }
  await fetchInfos();
  newInfoText.value = "";
  openAddInfoModal.value = false;
  return data;
};

const toggleInfo = async (info: Info, event: Event) => {
  const nextValue = (event.target as HTMLInputElement).checked;
  info.is_completed = nextValue;

  const { error } = await supabase
    .from("info")
    .update({ is_completed: nextValue })
    .eq("id", info.id);

  if (error) {
    info.is_completed = !nextValue;
    console.error("Fel vid uppdatering av info:", error);
  }
};

const deleteCompletedInfos = async () => {
  const { error } = await supabase
    .from("info")
    .delete()
    .eq("is_completed", true);

  if (error) {
    console.error("Fel vid borttagning av slutförda info:", error);
    return;
  }

  const toast = document.createElement("div");
  toast.textContent = "Slutförda info borttagna";
  toast.className = "custom-toast";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);

  await fetchInfos();
};

const cancelCompletedInfos = async () => {
  const completedInfoIds = infos.value
    .filter((info) => info.is_completed)
    .map((info) => info.id);

  if (completedInfoIds.length === 0) return;

  const { error } = await supabase
    .from("info")
    .update({ is_completed: false })
    .in("id", completedInfoIds);

  if (error) {
    console.error("Fel vid återställning av slutförda info:", error);
    return;
  }

  await fetchInfos();
};

const openAddInfoCommentFunction = (info: Info) => {
  selectedInfoId.value = info.id;
  openAddInfoCommentModal.value = true;
};

const addInfoComment = async () => {
  const comment = newInfoComment.value.trim();
  if (!comment || !selectedInfoId.value) return;

  const { data, error } = await supabase
    .from("todo_comments")
    .insert({
      comment,
      author: newInfoCommentAuthor.value,
      info_id: selectedInfoId.value,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Fel vid tillägg av kommentar:", error);
    return;
  }

  await fetchInfos();
  newInfoComment.value = "";
  selectedInfoId.value = null;
  newInfoCommentAuthor.value = "";
  openAddInfoCommentModal.value = false;

  return data;
};

fetchInfos();
</script>

<style scoped>
.page {
  --item-bg: #d0f4ea;
}
</style>
