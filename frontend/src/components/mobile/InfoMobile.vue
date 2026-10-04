<template>
  <div class="info-wrapper">
    <div class="info-header">
      <h2>Information</h2>
      <button
        class="info-card-add-btn"
        aria-label="Lägg till uppgift"
        @click="openAddInfoModalFunction()"
      >
        <Plus :size="20" />
      </button>
    </div>

    <div
      class="info-card"
      :class="{ 'info-card-collapsed': !showAll && hasMoreInfos }"
    >
      <div
        v-if="isLoading"
        class="loader"
        role="status"
        aria-label="Laddar"
      ></div>

      <span v-else-if="!hasInfo" class="no-info">
        Ingen information för tillfället
      </span>

      <div
        v-else
        class="info-card-content"
        v-for="info in visibleInfos"
        :key="info.id"
      >
        <label class="checkbox-container">
          <input
            type="checkbox"
            class="info-card-content-checkbox"
            :checked="info.is_completed"
            @change="toggleInfo(info, $event)"
          />
          <span class="checkmark"></span>
        </label>

        <div class="info-card-content-info">
          <div class="info-main-info">
            <span class="info-created-at">{{
              formatCreatedAt(info.created_at)
            }}</span>
            <p
              class="info-title"
              :class="{ 'completed-text': info.is_completed }"
            >
              {{ info.text }}
            </p>
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
          class="info-card-content-comment-button"
          aria-label="Kommentera"
          @click="openAddInfoCommentModalFunction(info)"
        >
          <MessageCircleMore :size="20" />
        </button>
      </div>
    </div>

    <button
      v-if="hasMoreInfos"
      class="show-all-button"
      type="button"
      @click="showAll = !showAll"
    >
      {{ showAll ? "Visa färre" : "Visa alla" }}
    </button>
  </div>

  <!-- Modal: Lägg till information -->
  <Transition name="fade">
    <div
      v-if="openAddInfoModal"
      class="modal-overlay"
      @click.self="openAddInfoModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lägg till information</h3>
        </div>
        <textarea
          v-model="newInfoText"
          placeholder="Vad behöver informeras?"
          class="modal-input modal-textarea"
        ></textarea>

        <div class="modal-actions">
          <button type="button" @click="addInfo" class="btn btn-primary">
            Lägg till information
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

  <!-- Modal: Lägg till kommentar -->
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
          placeholder="Ditt namn"
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

  <!-- Sticky action bar vid markering -->
  <Transition name="slide-up">
    <div
      v-if="infos.some((info) => info.is_completed)"
      class="completed-info-btn-container"
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { MessageCircleMore, Plus } from "lucide-vue-next";
import { createClient } from "@supabase/supabase-js";

type TodoComment = {
  id?: string;
  comment: string;
  author: string | null;
};

type Info = {
  created_at: string;
  id: string;
  text: string;
  is_completed: boolean;
  todo_comments: TodoComment[];
};
// ref for controlling the visibility of all infoss if there are more than 3
const showAll = ref(false);
// ref for controlling the visibility of modal to add a new info
const openAddInfoModal = ref(false);
// ref for controlling the visibility of modal to add a new info comment
const openAddInfoCommentModal = ref(false);
// ref for storing the title of the new info
const newInfoText = ref(""); // ref for storing the title of the new info
const newInfoComment = ref(""); // ref for storing the content of the new info comment
const newInfoCommentAuthor = ref(""); // ref for storing the author of the new info comment
const selectedDepartmentId = ref(""); // ref for storing the selected department ID
const selectedInfoId = ref<string | null>(null); // ref for storing the selected info ID

// Supabase client setup imported from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
// Supabase client instance for interacting with the database
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ref for storing the list of infos
const infos = ref<Info[]>([]);
const isLoading = ref(true);
const hasInfo = computed(() => infos.value.length > 0);

// ref for storing the list of departments
const departments = ref<{ id: string; name: string }[]>([]);
// computed property to check if there are more than 3 infos
const hasMoreInfos = computed(() => infos.value.length > 6);
// computed property to get the list of infos to be displayed based on the showAll flag
// if showAll is true, display all infos; otherwise, display only the first 5 infos
const visibleInfos = computed(() =>
  showAll.value ? infos.value : infos.value.slice(0, 6),
);

// function to fetch the list of departments from the database
const fetchDepartments = async () => {
  const { data, error } = await supabase
    // Fetch departments from the "departments" table
    .from("departments")
    // Select the "id" and "name" columns from the "departments" table
    .select("id, name")
    // Order the departments by their name in ascending order
    .order("name");

  if (error) {
    console.error("Fel vid hämtning av avdelningar:", error);
    return;
  }

  departments.value = data || [];
};

// function to fetch the list of infos from the database
// Fetch infos from the "info" table, including their comments, and order by creation date
const fetchInfos = async () => {
  const { data, error } = await supabase
    .from("info")
    .select(
      // Select the "id", "text", "is_completed" columns from the "info" table
      // and include the related "info_comments" with their "id", "comment", "author", and "created_at" columns
      "id, text, is_completed, created_at, todo_comments(id, comment, author, created_at)",
    )
    // Order the infos by their creation date in descending order
    .order("created_at", { ascending: false });

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

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(createdAt));

// function to open the modal for adding a new info
const openAddInfoModalFunction = () => {
  openAddInfoModal.value = true;
};

// function to add a new info to the database
const addInfo = async () => {
  // Trim the new info title and check if it is not empty before proceeding
  const text = newInfoText.value.trim();
  if (!text) return;

  // get data and error from the insertion of the new info
  const { data, error } = await supabase
    // Insert the new info into the "info" table
    .from("info")
    // Insert the new info with the provided title, selected department, and default values for "is_tonight" and "created_by"
    .insert({
      text,
      is_completed: false,
      created_by: "35020",
    })
    // Select the "id" of the newly inserted info
    .select("id")
    // Get the single inserted info record
    .single();

  if (error) {
    console.error("Fel vid tillägg av info:", error);
    return;
  }

  await fetchInfos();
  newInfoText.value = "";
  selectedDepartmentId.value = "";
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
    console.error("Fel vid återställning av slutförd info:", error);
    return;
  }

  await fetchInfos();
};

// function to open the modal for adding a new comment to a info
const openAddInfoCommentModalFunction = (info: Info) => {
  selectedInfoId.value = info.id;
  openAddInfoCommentModal.value = true;
};

// function to add a new comment to a info
const addInfoComment = async () => {
  // Trim the new comment text before proceeding, newInfoComment comes from the input bound to the modal
  const comment = newInfoComment.value.trim();
  // If the comment is empty or no info is selected, do not proceed
  if (!comment || !selectedInfoId.value) return;
  // Insert the new comment into the "info_comments" table and get the inserted record's "id"
  const { data, error } = await supabase
    .from("info_comments")
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
  // Refresh the info list to include the newly added comment
  await fetchInfos();
  newInfoComment.value = "";
  selectedInfoId.value = null;
  newInfoCommentAuthor.value = "";
  openAddInfoCommentModal.value = false;

  return data;
};

const deleteCompletedInfos = async () => {
  const { error } = await supabase
    .from("info")
    .delete()
    .eq("is_completed", true);

  if (error) {
    console.error("Fel vid borttagning av slutförd info:", error);
    return;
  }

  // Toast message not alert, without using lib
  const toast = document.createElement("div");
  toast.textContent = "Info raderad";
  toast.style.width = "90%";
  toast.style.position = "fixed";
  toast.style.top = "10%";
  toast.style.left = "50%";
  toast.style.transform = "translate(-50%, -50%)";
  toast.style.backgroundColor = "#42f54e";
  toast.style.color = "#000000";
  toast.style.padding = "8px 16px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  toast.style.transition = "transform 1s ease, opacity 0.3s ease";
  document.body.appendChild(toast);
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);

  await fetchInfos();
};

// onMounted lifecycle hook to fetch initial data for departments and infos
onMounted(async () => {
  try {
    await Promise.all([fetchDepartments(), fetchInfos()]);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* Modern variabelstruktur */
.info-wrapper {
  --primary-color: #2843bb;
  --primary-hover: #1f3496;
  --bg-gradient: linear-gradient(135deg, #2843bb 0%, #1a2a78 100%);
  --card-bg: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --radius-lg: 16px;
  --radius-md: 10px;

  padding: 16px 12px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.info-card-add-btn {
  background-color: #19ae19;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(40, 67, 187, 0.3);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.info-card-add-btn:active {
  transform: scale(0.92);
}

.info-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: #19ae19;
  box-shadow: 0 10px 25px -5px rgba(40, 67, 187, 0.4);
}

.info-card-collapsed {
  max-height: 380px;
  overflow: hidden;
}

.info-card-collapsed::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 80px;
  pointer-events: none;
  content: "";
  background: linear-gradient(to bottom, rgba(26, 42, 120, 0), #1a2a78);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}

.info-card-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: var(--card-bg);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Anpassad kryssruta för touch */
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
  border-radius: 6px;
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

.info-card-content-info {
  min-width: 0;
  flex: 1;
}

.info-main-info {
  display: flex;
  flex-direction: column;
}

.info-created-at {
  font-size: 0.725rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.info-title {
  font-size: 0.95rem;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.completed-text {
  text-decoration: line-through;
  color: var(--text-muted);
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

.info-card-content-comment-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.info-card-content-comment-button:active {
  background-color: #f1f5f9;
  color: var(--primary-color);
}

.show-all-button {
  display: block;
  margin: 16px auto 0;
  padding: 10px 20px;
  color: var(--primary-color);
  background-color: #eef2ff;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.show-all-button:active {
  background-color: #e0e7ff;
}

/* Modaler */
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
  background-color: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
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

.modal-input,
.modal-select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  margin-bottom: 12px;
  box-sizing: border-box;
  background-color: #f8fafc;
  border: 2px solid #ccc;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.modal-input:focus,
.modal-select:focus {
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
  color: #000000;
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

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

/* Bottenfält för markerade uppgifter */
.completed-info-btn-container {
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
  border-radius: 10px;
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
  border-radius: 10px;
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
.loader {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin: 16px auto;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.no-info {
  text-align: center;
  color: #ffffff;
  font-size: 1rem;
}
</style>

<style>
/* Global style för toast med mjuk animering */
.custom-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  background-color: #10b981;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
  z-index: 200;
  animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.custom-toast.toast-hide {
  animation: toastOut 0.3s ease forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}
</style>
