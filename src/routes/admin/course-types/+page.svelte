<script lang="ts">
  import { createClient } from "$lib/supabase/client";
  import { onMount } from "svelte";
  import type {
    CourseType,
    CourseTypeInsert,
    CourseTypeUpdate,
  } from "$lib/types/course-type";

  let supabase = createClient();
  let courseTypes = $state<CourseType[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Formulaire et modale
  let editingId = $state<string | null>(null);
  let showModal = $state(false);
  let formData = $state<
    CourseTypeInsert & { color?: string; text_color?: string }
  >({
    name: "",
    color: "#f0f0f0",
    text_color: "#000000",
  });

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("course_types")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      courseTypes = data || [];
    } catch (err: any) {
      error = err.message || "Erreur lors du chargement des données";
    } finally {
      loading = false;
    }
  }

  function startAdd() {
    editingId = null;
    formData = {
      name: "",
      color: "#f0f0f0",
      text_color: "#000000",
    };
    showModal = true;
  }

  function startEdit(courseType: CourseType) {
    editingId = courseType.id;
    formData = {
      name: courseType.name,
      color: (courseType as any).color || "#f0f0f0",
      text_color: (courseType as any).text_color || "#000000",
    };
    showModal = true;
  }

  function cancelEdit() {
    editingId = null;
    showModal = false;
    formData = {
      name: "",
      color: "#f0f0f0",
      text_color: "#000000",
    };
  }

  async function isCourseTypeUsed(courseTypeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("schedules")
      .select("id")
      .eq("course_type_id", courseTypeId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  function normalizeColor(color: string): string {
    // Enlever les espaces et convertir en minuscules
    let normalized = color.trim().toLowerCase();

    // Si pas de #, l'ajouter
    if (!normalized.startsWith("#")) {
      normalized = "#" + normalized;
    }

    // Vérifier que c'est un code hexadécimal valide (6 caractères après #)
    if (!/^#[0-9a-f]{6}$/.test(normalized)) {
      // Si c'est un code court (3 caractères), le convertir en long
      if (/^#[0-9a-f]{3}$/.test(normalized)) {
        normalized =
          "#" +
          normalized[1] +
          normalized[1] +
          normalized[2] +
          normalized[2] +
          normalized[3] +
          normalized[3];
      } else {
        // Sinon, retourner null pour indiquer une couleur invalide
        return "";
      }
    }

    return normalized;
  }

  function isValidColor(color: string | undefined): boolean {
    if (!color) return false;
    const normalized = normalizeColor(color);
    return normalized !== "" && /^#[0-9a-f]{6}$/.test(normalized);
  }

  function getPreviewColor(color: string | undefined): string | null {
    if (!color) return null;
    const normalized = normalizeColor(color);
    if (normalized && /^#[0-9a-f]{6}$/.test(normalized)) {
      return normalized;
    }
    return null;
  }

  async function saveCourseType() {
    if (!formData.name?.trim()) {
      error = "Le nom est requis";
      return;
    }

    // Valider les couleurs
    if (!isValidColor(formData.color)) {
      error = "La couleur de fond n'est pas valide";
      return;
    }

    if (!isValidColor(formData.text_color)) {
      error = "La couleur de texte n'est pas valide";
      return;
    }

    // Normaliser les couleurs
    if (formData.color) {
      formData.color = normalizeColor(formData.color);
    }
    if (formData.text_color) {
      formData.text_color = normalizeColor(formData.text_color);
    }

    try {
      if (editingId) {
        // Vérifier si le type est utilisé et si le nom change
        const originalCourseType = courseTypes.find(
          (ct) => ct.id === editingId
        );
        const isUsed = await isCourseTypeUsed(editingId);
        const nameChanged =
          originalCourseType && originalCourseType.name !== formData.name;

        if (isUsed && nameChanged) {
          if (
            !confirm(
              "Attention : Ce type de cours est utilisé par des horaires. Êtes-vous sûr de vouloir le renommer ?"
            )
          ) {
            return;
          }
        }

        const { error: updateError } = await supabase
          .from("course_types")
          .update({
            name: formData.name,
            color: formData.color,
            text_color: formData.text_color,
          } as any)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("course_types")
          .insert([
            {
              name: formData.name,
              color: formData.color,
              text_color: formData.text_color,
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

  async function deleteCourseType(id: string) {
    try {
      // Vérifier si le type est utilisé
      const isUsed = await isCourseTypeUsed(id);

      if (isUsed) {
        error =
          "Impossible de supprimer ce type de cours car il est utilisé par des horaires";
        return;
      }

      if (!confirm("Êtes-vous sûr de vouloir supprimer ce type de cours ?")) {
        return;
      }

      const { error: deleteError } = await supabase
        .from("course_types")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await loadData();
      error = null;
    } catch (err: any) {
      error = err.message || "Erreur lors de la suppression";
    }
  }
</script>

<div class="admin-page">
  <div class="admin-header">
    <h1>Gestion des types de cours</h1>
    <button class="btn-primary" onclick={startAdd}>+ Ajouter un type</button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Chargement...</div>
  {:else}
    <div class="course-types-list">
      <h2>Types de cours ({courseTypes.length})</h2>
      {#if courseTypes.length === 0}
        <p class="no-items">Aucun type de cours</p>
      {:else}
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Couleur de fond</th>
              <th>Couleur de texte</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each courseTypes as courseType}
              <tr>
                <td>{courseType.name}</td>
                <td>
                  <div class="color-display">
                    <span
                      class="color-badge"
                      style="background-color: {(courseType as any).color ||
                        '#f0f0f0'}"
                    ></span>
                    <span class="color-value"
                      >{(courseType as any).color || "#f0f0f0"}</span
                    >
                  </div>
                </td>
                <td>
                  <div class="color-display">
                    <span
                      class="color-badge"
                      style="background-color: {(courseType as any)
                        .text_color || '#000000'}"
                    ></span>
                    <span class="color-value"
                      >{(courseType as any).text_color || "#000000"}</span
                    >
                  </div>
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      class="btn-edit"
                      onclick={() => startEdit(courseType)}
                    >
                      Modifier
                    </button>
                    <button
                      class="btn-delete"
                      onclick={() => deleteCourseType(courseType.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}

  <!-- Modale pour ajouter/modifier un type de cours -->
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
          <h2>{editingId ? "Modifier" : "Ajouter"} un type de cours</h2>
          <button class="modal-close" onclick={cancelEdit} aria-label="Fermer">
            ×
          </button>
        </div>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            saveCourseType();
          }}
        >
          <div class="form-group">
            <label for="name">Nom du type</label>
            <input
              type="text"
              id="name"
              bind:value={formData.name}
              required
              placeholder="ex: wod, strength, etc."
            />
          </div>

          <div class="form-group">
            <label for="color">Couleur de fond</label>
            <div class="color-input-group">
              <input
                type="text"
                id="color"
                value={formData.color}
                class="color-text"
                placeholder="#f0f0f0"
                oninput={(e) => {
                  formData.color = (e.target as HTMLInputElement).value;
                }}
              />
              {#if getPreviewColor(formData.color)}
                <div
                  class="color-preview"
                  style="background-color: {getPreviewColor(formData.color)}"
                  title={getPreviewColor(formData.color) || ""}
                ></div>
              {:else}
                <div
                  class="color-preview invalid"
                  title="Couleur invalide"
                ></div>
              {/if}
            </div>
            <small
              >Choisissez la couleur de fond pour identifier ce type de cours</small
            >
          </div>

          <div class="form-group">
            <label for="text_color">Couleur de texte</label>
            <div class="color-input-group">
              <input
                type="text"
                id="text_color"
                value={formData.text_color}
                class="color-text"
                placeholder="#000000"
                oninput={(e) => {
                  formData.text_color = (e.target as HTMLInputElement).value;
                }}
              />
              {#if getPreviewColor(formData.text_color)}
                <div
                  class="color-preview"
                  style="background-color: {getPreviewColor(
                    formData.text_color
                  )}"
                  title={getPreviewColor(formData.text_color) || ""}
                ></div>
              {:else}
                <div
                  class="color-preview invalid"
                  title="Couleur invalide"
                ></div>
              {/if}
            </div>
            <small>Choisissez la couleur du texte pour ce type de cours</small>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn-primary"
              disabled={!isValidColor(formData.color) ||
                !isValidColor(formData.text_color)}
            >
              Enregistrer
            </button>
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
    max-width: 1200px;
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

  .btn-primary:hover:not(:disabled) {
    background-color: #333;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  label {
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #ffde01;
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-text {
    flex: 1;
  }

  .color-preview {
    width: 40px;
    height: 40px;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .color-preview.invalid {
    background-color: #f0f0f0;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      #ccc 5px,
      #ccc 10px
    );
    position: relative;
  }

  .color-preview.invalid::after {
    content: "✕";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #dc3545;
    font-weight: bold;
  }

  .color-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-badge {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid #ddd;
    display: inline-block;
  }

  .color-value {
    font-family: monospace;
    font-size: 0.9rem;
    color: #666;
  }

  small {
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.85rem;
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

  .course-types-list {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .course-types-list h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }

  .no-items {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table thead {
    background-color: #f5f5f5;
  }

  .data-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #ddd;
  }

  .data-table td {
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .data-table tr:hover {
    background-color: #f9f9f9;
  }

  .table-actions {
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
    .admin-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .data-table {
      font-size: 0.9rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.5rem;
    }

    .table-actions {
      flex-direction: column;
    }
  }
</style>
