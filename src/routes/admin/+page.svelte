<script lang="ts">
  import { createClient } from "$lib/supabase/client";
  import { onMount } from "svelte";
  import type {
    ScheduleWithCourseType,
    ScheduleInsert,
    ScheduleUpdate,
    DayOfWeek,
  } from "$lib/types/schedule";
  import type { CourseType } from "$lib/types/course-type";
  import { DAYS_OF_WEEK } from "$lib/types/schedule";

  let supabase = createClient();
  let schedules = $state<ScheduleWithCourseType[]>([]);
  let courseTypes = $state<CourseType[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Formulaire et modale
  let editingId = $state<string | null>(null);
  let showModal = $state(false);
  let formData = $state<ScheduleInsert>({
    course_type_id: "",
    day: 1,
    start_hour: "09:00",
    end_hour: "10:00",
    priority: 1,
  });

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = null;

    try {
      // Charger les types de cours
      const { data: types, error: typesError } = await supabase
        .from("course_types")
        .select("*")
        .order("name");

      if (typesError) throw typesError;
      courseTypes = types || [];

      // Charger les horaires avec jointure
      const { data: scheds, error: schedsError } = await supabase
        .from("schedules")
        .select("*, course_types(*)")
        .order("day")
        .order("start_hour");

      if (schedsError) throw schedsError;
      schedules = (scheds || []) as ScheduleWithCourseType[];
    } catch (err: any) {
      error = err.message || "Erreur lors du chargement des données";
    } finally {
      loading = false;
    }
  }

  function startAdd() {
    editingId = null;
    formData = {
      course_type_id: courseTypes[0]?.id || "",
      day: 1,
      start_hour: "09:00",
      end_hour: "10:00",
      priority: 1,
    };
    showModal = true;
  }

  function startEdit(schedule: ScheduleWithCourseType) {
    editingId = schedule.id;
    formData = {
      course_type_id: schedule.course_type_id,
      day: schedule.day,
      start_hour: schedule.start_hour,
      end_hour: schedule.end_hour,
      priority: (schedule as any).priority ?? 1,
    };
    showModal = true;
  }

  function cancelEdit() {
    editingId = null;
    showModal = false;
    formData = {
      course_type_id: "",
      day: 1,
      start_hour: "09:00",
      end_hour: "10:00",
      priority: 1,
    };
  }

  async function saveSchedule() {
    if (!formData.course_type_id) {
      error = "Veuillez sélectionner un type de cours";
      return;
    }

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("schedules")
          .update({
            course_type_id: formData.course_type_id,
            day: formData.day,
            start_hour: formData.start_hour,
            end_hour: formData.end_hour,
            priority: formData.priority ?? 1,
          } as any)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("schedules").insert([
          {
            course_type_id: formData.course_type_id,
            day: formData.day,
            start_hour: formData.start_hour,
            end_hour: formData.end_hour,
            priority: formData.priority ?? 1,
          } as any,
        ]);

        if (insertError) throw insertError;
      }

      await loadData();
      editingId = null;
      showModal = false;
      error = null;
    } catch (err: any) {
      error = err.message || "Erreur lors de la sauvegarde";
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet horaire ?")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadData();
    } catch (err: any) {
      error = err.message || "Erreur lors de la suppression";
    }
  }

  function getSchedulesByDay(day: number) {
    return schedules
      .filter((s) => s.day === day)
      .sort((a, b) => {
        // D'abord par heure de début
        if (a.start_hour !== b.start_hour) {
          return a.start_hour.localeCompare(b.start_hour);
        }
        // Ensuite par nom du type de cours
        return a.course_types.name.localeCompare(b.course_types.name);
      });
  }

  function formatTime(time: string): string {
    // Retirer les secondes si présentes (format HH:mm:ss -> HH:mm)
    return time.split(":").slice(0, 2).join(":");
  }
</script>

<div class="admin-page">
  <div class="admin-header">
    <h1>Gestion des horaires</h1>
    <button class="btn-primary" onclick={startAdd}>+ Ajouter un horaire</button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Chargement...</div>
  {:else}
    <div class="schedules-grid">
      {#each DAYS_OF_WEEK as dayName, dayIndex}
        {@const daySchedules = getSchedulesByDay(dayIndex + 1)}
        <div class="day-card">
          <h3>{dayName}</h3>
          {#if daySchedules.length === 0}
            <p class="no-schedules">Aucun horaire</p>
          {:else}
            <div class="schedules-list">
              {#each daySchedules as schedule}
                {@const courseColor = schedule.course_types.color || "#f0f0f0"}
                {@const courseTextColor =
                  schedule.course_types.text_color || "#000000"}
                <div
                  class="schedule-item"
                  style="background-color: {courseColor}; color: {courseTextColor};"
                >
                  <div class="schedule-info">
                    <span class="schedule-time">
                      {formatTime(schedule.start_hour)} - {formatTime(
                        schedule.end_hour
                      )}
                    </span>
                    <span class="schedule-type">
                      {schedule.course_types.name}
                    </span>
                  </div>
                  <div class="schedule-actions">
                    <button
                      class="btn-edit"
                      onclick={() => startEdit(schedule)}
                    >
                      Modifier
                    </button>
                    <button
                      class="btn-delete"
                      onclick={() => deleteSchedule(schedule.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Modale pour ajouter/modifier un horaire -->
  {#if showModal}
    <div
      class="modal-overlay"
      onclick={cancelEdit}
      onkeydown={(e) => e.key === "Escape" && cancelEdit()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="document"
      >
        <div class="modal-header">
          <h2>{editingId ? "Modifier" : "Ajouter"} un horaire</h2>
          <button class="modal-close" onclick={cancelEdit} aria-label="Fermer">
            ×
          </button>
        </div>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            saveSchedule();
          }}
        >
          <div class="form-row">
            <div class="form-group">
              <label for="course_type">Type de cours</label>
              <select
                id="course_type"
                bind:value={formData.course_type_id}
                required
              >
                {#each courseTypes as type}
                  <option value={type.id}>{type.name}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="day">Jour</label>
              <select id="day" bind:value={formData.day} required>
                {#each DAYS_OF_WEEK as dayName, index}
                  <option value={index + 1}>{dayName}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="start_hour">Heure de début</label>
              <input
                type="time"
                id="start_hour"
                bind:value={formData.start_hour}
                required
              />
            </div>

            <div class="form-group">
              <label for="end_hour">Heure de fin</label>
              <input
                type="time"
                id="end_hour"
                bind:value={formData.end_hour}
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="priority">Priorité (colonne)</label>
            <select id="priority" bind:value={formData.priority} required>
              <option value={1}>1 (colonne de gauche)</option>
              <option value={2}>2 (colonne du milieu)</option>
              <option value={3}>3 (colonne de droite)</option>
            </select>
            <small
              >Détermine dans quelle colonne l'horaire sera affiché en cas de
              chevauchement</small
            >
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Enregistrer</button>
            <button type="button" class="btn-secondary" onclick={cancelEdit}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
    color: #333;
  }

  .btn-primary {
    background-color: #000;
    color: #ffde01;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .btn-primary:hover {
    background-color: #333;
  }

  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #f5c6cb;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalFadeIn 0.2s ease-out;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .modal-close:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .modal-content form {
    padding: 2rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  input,
  select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #ffde01;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn-secondary {
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .btn-secondary:hover {
    background-color: #e0e0e0;
  }

  .schedules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .day-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .day-card h3 {
    margin: 0 0 1rem 0;
    color: #333;
    border-bottom: 2px solid #ffde01;
    padding-bottom: 0.5rem;
  }

  .no-schedules {
    color: #999;
    font-style: italic;
    margin: 0;
  }

  .schedules-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .schedule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .schedule-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .schedule-time {
    font-weight: bold;
    color: #333;
  }

  .schedule-type {
    font-size: 0.9rem;
    color: #666;
  }

  .schedule-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-edit,
  .btn-delete {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.3s ease;
  }

  .btn-edit {
    background-color: #ffde01;
    color: #000;
  }

  .btn-edit:hover {
    opacity: 0.8;
  }

  .btn-delete {
    background-color: #dc3545;
    color: white;
  }

  .btn-delete:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .admin-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .schedules-grid {
      grid-template-columns: 1fr;
    }

    .schedule-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }
</style>
