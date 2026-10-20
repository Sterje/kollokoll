<template>
  <div class="info-redesign-wrapper">
    <button class="back-button" aria-label="Tillbaka" @click="$router.back()">
      <ChevronLeft :size="30" />
    </button>
    <div class="info-redesign-header-add">
      <div class="info-redesign-header">
        <h2>Information</h2>
        <button
          class="info-redesign-add-btn"
          aria-label="Lägg till uppgift"
          @click="openAddModalFunction()"
        >
          <Plus :size="30" />
        </button>
      </div>
      <div class="info-redesign-add-spacer"></div>
    </div>
    <div v-if="loading" class="loader-container">
      <div class="loader" role="status" aria-label="Laddar"></div>
    </div>
    <!-- <span v-else-if="!hasInfos && !loading" class="no-info">
      Ingen information för tillfället, tryck på + knappen för att lägga till
      information.
    </span> -->
    <div v-else class="info-redesign-list">
      <div class="info-redesign-item" v-for="info in infos" :key="info.id">
        <label class="checkbox-container">
          <input
            type="checkbox"
            class="info-redesign-checkbox"
            :checked="info.is_completed"
            @change="toggleInfo(info, $event)"
          />
          <span class="checkmark"></span>
        </label>
        <div class="info-redesign-content">
          <div class="info-redesign-date-author-container">
            <div class="info-redesign-date">
              {{ formatedCreatedAt(info.created_at) }}
            </div>
            <div class="info-redesign-author">{{ info.author }}</div>
          </div>
          <div class="info-redesign-title">
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
        <div class="info-redesign-comment-btn">
          <button
            class="info-redesign-comment-button"
            aria-label="Kommentera"
            @click="openAddInfoCommentFunction(info)"
          >
            <MessageCircleMore :size="20" />
          </button>
        </div>
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
    <div
      v-if="infos.some((info) => info.is_completed)"
      class="info-redesign-completed-container"
    >
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
import { createClient } from "@supabase/supabase-js";
import { ref, watch } from "vue";
import { MessageCircleMore, Plus, ChevronLeft } from "lucide-vue-next";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const infos = ref<Info[]>([]);
const loading = ref(true);
const newInfoText = ref("");
const newInfoAuthor = ref("");
const openAddInfoCommentModal = ref(false);
const newInfoComment = ref("");
const newInfoCommentAuthor = ref("");
const selectedInfoId = ref<string | null>(null);

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
.info-redesign-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 12px;
  font-family: Arial, sans-serif;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #000000;
  margin-bottom: 12px;
}

.info-redesign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-redesign-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #000000;
}

.info-redesign-item {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  padding: 12px;
  margin: 8px 0;
  border-radius: 20px;
  background-color: #d0f4ea;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Touch-anpassad kryssruta */
.checkbox-container {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: #f1f5f9;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #10b981;
  border-color: #10b981;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.info-redesign-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 8px;
}

.info-redesign-date-author-container {
  display: flex;
}

.info-redesign-author {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-weight: bold;
}

.info-redesign-comment-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #000000;
}

.info-redesign-date {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.info-redesign-title {
  font-size: 16px;
}

.comments-list {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
  line-height: 1.3;
}

.comment-author {
  font-weight: 600;
  color: var(--text-main);
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.loader {
  width: 36px;
  height: 36px;
  border: 4px solid #e0e0e0;
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 100;
  padding: 0;
}

@media (min-width: 640px) {
  .modal-overlay {
    align-items: center;
    padding: 16px;
  }
}

.modal-card {
  width: 100%;
  max-width: 450px;
  background-color: var(--card-bg);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  font-family: Arial, Helvetica, sans-serif;
}

@media (min-width: 640px) {
  .modal-card {
    border-radius: var(--radius-lg);
  }
}

.modal-header h3 {
  margin: 0 0 16px;
  font-size: 1.15rem;
  color: var(--text-main);
}

.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  margin-bottom: 12px;
  box-sizing: border-box;
  background-color: #f8fafc;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s ease;
  border: 2px solid #ccc;
}

.modal-input:focus {
  border-color: var(--primary-color);
  background-color: #ffffff;
}

.modal-textarea {
  height: 110px;
  resize: none;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    opacity 0.2s ease;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.info-redesign-completed-container {
  display: flex;
  gap: 10px;
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 16px;
  max-width: 476px;
  margin: 0 auto;
  z-index: 50;
  padding: 8px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 0.1s ease;
}

.action-btn:active {
  transform: scale(0.97);
}

.btn-success {
  background-color: #10b981;
  color: #ffffff;
}

.btn-danger {
  background-color: #f43f5e;
  color: #ffffff;
}

/* Animeringar */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
