<script lang="ts">
  import { onMount } from "svelte";
  import { createClient } from "$lib/supabase/client";
  import type { ScheduleWithCourseType } from "$lib/types/schedule";
  import { DAYS_OF_WEEK } from "$lib/types/schedule";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let activeSection = $state<string>("accueil");
  let isScrolling = $state<boolean>(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  let mobileMenuOpen = $state<boolean>(false);
  let isScrolled = $state<boolean>(false);
  let selectedSchedule = $state<ScheduleWithCourseType | null>(null);
  let showScheduleModal = $state<boolean>(false);

  // Horaires
  let supabase = createClient();
  let schedules = $state<ScheduleWithCourseType[]>([]);
  let schedulesLoading = $state(true);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeSection = "accueil";
    isScrolled = false; // Header à 120px pour accueil
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 1000);
  }

  function handleLinkClick(sectionId: string, e: MouseEvent) {
    e.preventDefault();
    activeSection = sectionId;
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    mobileMenuOpen = false; // Fermer le menu mobile après clic

    if (sectionId === "accueil") {
      isScrolled = false; // Header à 120px pour accueil
      scrollToTop();
    } else {
      isScrolled = true; // Header à 80px pour les autres sections
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = isScrolled ? 80 : 120;
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 1000);
    }
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function openScheduleModal(schedule: ScheduleWithCourseType) {
    selectedSchedule = schedule;
    showScheduleModal = true;
  }

  function closeScheduleModal() {
    selectedSchedule = null;
    showScheduleModal = false;
  }

  // Bloquer le scroll quand la modale est ouverte
  $effect(() => {
    if (showScheduleModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  });

  let lastHoveredImage = $state<string | null>(null);

  function handleImageHover(imageId: string) {
    lastHoveredImage = imageId;
  }

  const menuItems = [
    { id: "accueil", label: "Accueil" },
    { id: "a-propos", label: "À propos" },
    { id: "abonnements", label: "Abonnements" },
    { id: "horaires", label: "Horaires" },
    { id: "contact", label: "Contact" },
  ];

  onMount(() => {
    const sections = menuItems.map((item) => document.getElementById(item.id));

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      // Ignorer les mises à jour pendant le scroll programmé
      if (isScrolling) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
        }
      });
    }, observerOptions);

    sections.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    // Gérer le scroll vers le haut et la réduction du header
    const handleScroll = () => {
      if (isScrolling) return;
      if (window.scrollY < 100) {
        activeSection = "accueil";
      }
      // Réduire le header après un certain scroll
      isScrolled = window.scrollY > 50;
    };

    window.addEventListener("scroll", handleScroll);

    // Charger les horaires
    loadSchedules();

    return () => {
      sections.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  });

  async function loadSchedules() {
    try {
      const { data, error } = await supabase
        .from("schedules")
        .select("*, course_types(*)")
        .order("day")
        .order("start_hour");

      if (error) {
        console.error("Error loading schedules:", error);
      } else {
        schedules = (data || []) as ScheduleWithCourseType[];
      }
    } catch (err) {
      console.error("Error loading schedules:", err);
    } finally {
      schedulesLoading = false;
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

  // Convertit une heure (HH:mm) en minutes depuis minuit
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Vérifie si deux horaires se chevauchent
  // Deux horaires consécutifs (fin1 === début2) ne se chevauchent pas
  function overlaps(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    // Chevauchement seulement si les horaires se superposent vraiment
    // (pas si un se termine exactement quand l'autre commence)
    return s1 < e2 && s2 < e1;
  }

  // Type pour un horaire avec ses informations de chevauchement
  type ScheduledItem = ScheduleWithCourseType & {
    overlapCount: number; // Nombre de blocs qui se chevauchent au même moment (1, 2, ou 3)
    overlapIndex: number; // Position (0, 1, ou 2) basée sur la priorité en DB (1, 2, ou 3)
  };

  // Organise les horaires d'un jour avec gestion des chevauchements via classes CSS
  // Utilise la priorité en DB (1, 2, 3) pour déterminer la position horizontale
  function organizeSchedulesWithOverlap(
    daySchedules: ScheduleWithCourseType[],
  ): ScheduledItem[] {
    if (daySchedules.length === 0) return [];

    const result: ScheduledItem[] = daySchedules.map((schedule) => {
      // La priorité vient directement de la DB (1, 2, ou 3)
      const dbPriority = (schedule as any).priority ?? 1;
      // Convertir en index CSS (0, 1, ou 2)
      const overlapIndex = Math.max(0, Math.min(dbPriority - 1, 2));

      return {
        ...schedule,
        overlapCount: 1, // Sera calculé plus bas
        overlapIndex,
      };
    });

    // Pour chaque bloc, calculer le nombre maximum de blocs qui se chevauchent simultanément
    // pour déterminer la largeur (overlapCount)
    for (let i = 0; i < result.length; i++) {
      const schedule = result[i];
      const scheduleStart = timeToMinutes(schedule.start_hour);
      const scheduleEnd = timeToMinutes(schedule.end_hour);

      // Trouver tous les blocs qui se chevauchent avec ce bloc
      const overlapping: ScheduledItem[] = [schedule];
      for (let j = 0; j < result.length; j++) {
        if (i !== j) {
          const other = result[j];
          if (
            overlaps(
              schedule.start_hour,
              schedule.end_hour,
              other.start_hour,
              other.end_hour,
            )
          ) {
            overlapping.push(other);
          }
        }
      }

      // Calculer le nombre maximum de blocs simultanés pendant la durée de ce bloc
      let maxSimultaneous = 1;

      // Pour chaque minute dans l'intervalle de ce bloc, compter combien de blocs sont actifs
      for (let minute = scheduleStart; minute < scheduleEnd; minute++) {
        let count = 0;
        for (const block of overlapping) {
          const blockStart = timeToMinutes(block.start_hour);
          const blockEnd = timeToMinutes(block.end_hour);
          if (minute >= blockStart && minute < blockEnd) {
            count++;
          }
        }
        maxSimultaneous = Math.max(maxSimultaneous, count);
      }

      // Limiter à 3 colonnes maximum
      result[i].overlapCount = Math.min(maxSimultaneous, 3);
    }

    return result;
  }
</script>

<Header
  variant="full"
  {isScrolled}
  {activeSection}
  {mobileMenuOpen}
  {menuItems}
  onLogoClick={scrollToTop}
  onLinkClick={handleLinkClick}
  onToggleMobileMenu={toggleMobileMenu}
/>

<main class="main">
  <section id="accueil" class="section hero-section">
    <video class="hero-video" autoplay muted loop playsinline>
      <source
        src="https://grmmpftrvjoyzbvheuvy.supabase.co/storage/v1/object/public/videos/video.mp4"
        type="video/mp4"
      />
    </video>
    <div class="hero-overlay"></div>
    <div class="section-content hero-content">
      <h1 class="hero-title">
        FAITES LE PREMIER PAS,<br />ON S'OCCUPE DU RESTE.
      </h1>
      <p class="hero-description">
        Que vous soyez quadragénaire ou en fin d'adolescence, que vous soyez un
        grand sportif ou plutôt novice en sport, nous avons une solution pour
        prendre votre santé en main.
      </p>
      <a
        href="mailto:info@crossfitchapelle.com?subject={encodeURIComponent(
          "Je voudrais m'inscrire aux initiations",
        )}"
        class="cta-button">Je m'inscris aux initiations</a
      >
    </div>
  </section>

  <section id="a-propos" class="section">
    <div class="section-content">
      <div class="a-propos-container">
        <div class="a-propos-text">
          <h2>C'est quoi&nbsp;?</h2>
          <p>
            <strong>Activités physiques POUR TOUS</strong> à partir de 6 ans.
          </p>
          <p>
            <strong>Peu importe :</strong> votre état de forme, votre âge, vos objectifs,
            vos besoins, votre niveau.
          </p>
          <p>
            <strong>Nos coachs adaptent pour vous !!!</strong>
          </p>
          <a
            href="mailto:info@crossfitchapelle.com?subject={encodeURIComponent(
              "Je voudrais m'inscrire aux initiations",
            )}"
            class="cta-button">Rejoignez-nous</a
          >
        </div>
        <div class="a-propos-images">
          <div
            class="a-propos-image-wrapper image-1"
            class:last-hovered={lastHoveredImage === "image-1"}
            onmouseenter={() => handleImageHover("image-1")}
          >
            <img
              src="/CTA1.png"
              alt="Membre CrossFit Chapelle en entraînement"
              class="a-propos-image"
            />
          </div>
          <div
            class="a-propos-image-wrapper image-2"
            class:last-hovered={lastHoveredImage === "image-2"}
            onmouseenter={() => handleImageHover("image-2")}
          >
            <img
              src="/CTA2.png"
              alt="Entraînement CrossFit à Chapelle-lez-Herlaimont"
              class="a-propos-image"
            />
          </div>
          <div
            class="a-propos-image-wrapper image-3"
            class:last-hovered={lastHoveredImage === "image-3"}
            onmouseenter={() => handleImageHover("image-3")}
          >
            <img
              src="/CTA3.png"
              alt="Coaching sportif adapté à tous les niveaux"
              class="a-propos-image"
            />
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="abonnements" class="section">
    <div class="section-content">
      <div class="section-title-banner">
        <p class="section-subtitle">Rejoignez la famille</p>
        <h2 class="section-main-title">BECOME A MEMBER</h2>
      </div>
      <div class="pricing-container">
        <div class="pricing-card light">
          <div class="pricing-header">
            <h3>Sans durée d'engagement</h3>
          </div>
          <div class="pricing-body">
            <p class="pricing-price">Tarif standard*</p>
            <ul class="pricing-features">
              <li>Accès illimité à la salle lors des horaires Free Access</li>
              <li>
                Accès à 1 WOD par jour et tous les jours si vous le souhaitez
              </li>
            </ul>
          </div>
        </div>
        <div class="pricing-card dark">
          <div class="pricing-header">
            <h3>Engagement minimum 12 mois</h3>
          </div>
          <div class="pricing-body">
            <p class="pricing-price yellow">Tarif réduit*</p>
            <ul class="pricing-features">
              <li>Accès illimité à la salle lors des horaires Free Access</li>
              <li>
                Accès à 1 WOD par jour et tous les jours si vous le souhaitez
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="pricing-cta">
        <a
          href="mailto:info@crossfitchapelle.com?subject={encodeURIComponent(
            "Je voudrais m'inscrire aux initiations",
          )}"
          class="cta-button"
        >
          S'inscrire aux initiations
        </a>
      </div>
    </div>
  </section>

  <section id="horaires" class="section">
    <div class="section-content horaires-content">
      <h2>Horaires</h2>
      {#if schedulesLoading}
        <p>Chargement des horaires...</p>
      {:else if schedules.length === 0}
        <p>Aucun horaire disponible pour le moment.</p>
      {:else}
        <div class="schedule-table-wrapper">
          <div class="schedule-table">
            {#each DAYS_OF_WEEK as dayName, dayIndex}
              {@const day = dayIndex + 1}
              {@const daySchedules = getSchedulesByDay(day)}
              {@const organizedSchedules =
                organizeSchedulesWithOverlap(daySchedules)}
              <div class="day-column" data-day={day}>
                <div class="day-header">
                  <h3>{dayName}</h3>
                </div>
                <div class="day-tracks">
                  {#each organizedSchedules as schedule}
                    {@const courseColor =
                      schedule.course_types.color || "#f0f0f0"}
                    {@const courseTextColor =
                      schedule.course_types.text_color || "#000000"}
                    {@const startMinutes = timeToMinutes(schedule.start_hour)}
                    {@const endMinutes = timeToMinutes(schedule.end_hour)}
                    {@const dayStartMinutes = 8 * 60}
                    <!-- Début de journée à 8:00 -->
                    {@const topPosition = startMinutes - dayStartMinutes}
                    {@const durationPixels = endMinutes - startMinutes}
                    {@const height = Math.max(durationPixels, 50)}
                    <div
                      class="schedule-block overlap-{schedule.overlapCount} overlap-index-{schedule.overlapIndex}"
                      style="background-color: {courseColor}; color: {courseTextColor}; top: {topPosition}px; height: {height}px;"
                      data-start={schedule.start_hour}
                      data-end={schedule.end_hour}
                      onclick={() => openScheduleModal(schedule)}
                      onkeydown={(e) =>
                        e.key === "Enter" && openScheduleModal(schedule)}
                      role="button"
                      tabindex="0"
                    >
                      <span class="schedule-time">
                        {formatTime(schedule.start_hour)}
                      </span>
                      <span class="schedule-type">
                        {schedule.course_types.name}
                      </span>
                      {#if (schedule as any).note}
                        <span class="schedule-note">
                          {(schedule as any).note}
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>

  <section id="contact" class="section">
    <div class="section-content">
      <div class="contact-container">
        <div class="contact-map">
          <a
            href="https://maps.app.goo.gl/mP7Te7r11R9Vqpg47"
            target="_blank"
            rel="noopener noreferrer"
            class="map-link"
          >
            <img src="/map.png" alt="Carte de localisation" class="map-image" />
          </a>
        </div>
        <div class="contact-info">
          <div class="contact-item">
            <div class="contact-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="icon"
              >
                <path
                  d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                />
              </svg>
            </div>
            <a href="mailto:info@crossfitchapelle.com" class="contact-link"
              >info@crossfitchapelle.com</a
            >
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="icon"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                />
              </svg>
            </div>
            <a
              href="https://maps.app.goo.gl/mP7Te7r11R9Vqpg47"
              target="_blank"
              rel="noopener noreferrer"
              class="contact-link address-link"
            >
              Clos du Chêne Au Bois 8,<br />7160 Chapelle-lez-Herlaimont
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<!-- Modale pour afficher les détails d'un horaire -->
{#if showScheduleModal && selectedSchedule}
  <div
    class="schedule-modal-overlay"
    onclick={closeScheduleModal}
    onkeydown={(e) => e.key === "Escape" && closeScheduleModal()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="schedule-modal-content"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      <div class="schedule-modal-header">
        <h2>{selectedSchedule.course_types.name}</h2>
        <button
          class="schedule-modal-close"
          onclick={closeScheduleModal}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
      <div class="schedule-modal-body">
        <div class="schedule-modal-info">
          <div class="schedule-modal-info-item">
            <span class="schedule-modal-label">Horaire :</span>
            <span class="schedule-modal-value"
              >{DAYS_OF_WEEK[selectedSchedule.day - 1]} de {formatTime(
                selectedSchedule.start_hour,
              )} à {formatTime(selectedSchedule.end_hour)}</span
            >
          </div>
          {#if (selectedSchedule.course_types as any).description}
            <div class="schedule-modal-info-item schedule-modal-description">
              <span class="schedule-modal-label">Description :</span>
              <p class="schedule-modal-value">
                {(selectedSchedule.course_types as any).description}
              </p>
            </div>
          {/if}
          {#if (selectedSchedule as any).note}
            <div class="schedule-modal-info-item schedule-modal-note">
              <span class="schedule-modal-label">Note :</span>
              <p class="schedule-modal-value">
                {(selectedSchedule as any).note}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<Footer />

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    background-color: #333;
  }

  .main {
    margin-top: 120px; /* Hauteur du header */
  }

  .section {
    padding: 4rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* .section:nth-child(odd) {
    background-color: #f9f9f9;
  }

  .section:nth-child(even) {
    background-color: #fff;
  } */

  #a-propos {
    background-color: #333;
  }

  #abonnements {
    background-color: #ddd;
  }

  #horaires {
    background-color: #fff;
  }

  #contact {
    background-color: #ffde01 !important;
  }

  .hero-section {
    position: relative;
    overflow: hidden;
    padding: 0;
    background-color: transparent;
    min-height: calc(100vh - 120px);
  }

  .hero-video {
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
    transform: translate(-50%, -50%);
    object-fit: cover;
    z-index: 1;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 2;
  }

  .hero-overlay::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(
      circle,
      rgba(0, 0, 0, 0.4) 1px,
      transparent 1px
    );
    background-size: 15px 15px;
    background-position: 0 0;
  }

  .hero-overlay::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(
      circle,
      rgba(0, 0, 0, 0.4) 1px,
      transparent 1px
    );
    background-size: 15px 15px;
    background-position: 7.5px 7.5px;
  }

  .section-content {
    max-width: 1200px;
    width: 100%;
    text-align: center;
  }

  .a-propos-container {
    display: flex;
    gap: 4rem;
    align-items: center;
    text-align: left;
  }

  .a-propos-text {
    flex: 1;
    max-width: 50%;
  }

  #a-propos .a-propos-text h2 {
    color: #fff;
  }

  #a-propos .a-propos-text p {
    font-size: 1.4rem;
    line-height: 1.5;
    color: #fff;
    margin: 2rem 0;
  }

  .a-propos-images {
    flex: 1;
    position: relative;
    max-width: 50%;
    height: 500px;
    padding: 2rem;
    box-sizing: border-box;
  }

  .a-propos-image-wrapper {
    position: absolute;
    width: 70%;
    height: auto;
    transition: transform 0.3s ease;
  }

  .a-propos-image-wrapper.image-1 {
    top: 2rem;
    left: 2rem;
    z-index: 2;
    transform: rotate(-5deg);
  }

  .a-propos-image-wrapper.image-1:hover {
    transform: scale(1.05) rotate(-8deg);
    z-index: 4;
  }

  .a-propos-image-wrapper.image-2 {
    bottom: 25%;
    left: 20%;
    z-index: 1;
    transform: rotate(5deg);
  }

  .a-propos-image-wrapper.image-2:hover {
    transform: scale(1.05) rotate(8deg);
    z-index: 4;
  }

  .a-propos-image-wrapper.image-3 {
    bottom: 2rem;
    right: 2rem;
    z-index: 3;
    transform: rotate(-3deg);
  }

  .a-propos-image-wrapper.image-3:hover {
    transform: scale(1.05) rotate(-6deg);
    z-index: 4;
  }

  .a-propos-image-wrapper.last-hovered {
    z-index: 5;
  }

  .a-propos-image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .contact-container {
    display: flex;
    gap: 4rem;
    align-items: center;
    text-align: left;
  }

  .contact-map {
    flex-shrink: 0;
    max-width: 50%;
    padding: 1rem;
  }

  .map-link {
    display: block;
    cursor: pointer;
    overflow: visible;
  }

  .map-image {
    max-width: 100%;
    height: auto;
    border-radius: 0;
    box-shadow: none;
    display: block;
    transition: transform 0.3s ease;
    transform-origin: center center;
  }

  .map-link:hover .map-image {
    transform: scale(1.08);
  }

  .contact-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .contact-item {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }

  .contact-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 0.2rem;
  }

  .contact-icon .icon {
    width: 2rem;
    height: 2rem;
    color: #333;
  }

  .contact-link {
    color: #333;
    text-decoration: none;
    font-size: 1.8rem;
    font-weight: 500;
    transition: opacity 0.3s ease;
  }

  .contact-link:hover {
    opacity: 0.7;
    text-decoration: underline;
  }

  .address-link {
    cursor: pointer;
  }

  .section-content h2 {
    font-size: 4rem;
    color: #333;
    margin: 0;
  }

  .section-title-banner {
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-subtitle {
    font-size: 1.2rem;
    color: #666;
    font-style: italic;
    margin: 0 0 0.5rem 0;
    text-transform: none;
    font-weight: normal;
  }

  .section-main-title {
    font-weight: bold;
    color: #fff;
    text-transform: uppercase;
    margin: 0;
    letter-spacing: 0.1em;
  }

  .horaires-content {
    text-align: left;
    overflow-x: auto;
  }

  .schedule-table-wrapper {
    position: relative;
    margin-top: 2rem;
  }

  .schedule-table {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .day-column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }

  .day-header {
    position: sticky;
    top: 0;
    background-color: #fff;
    z-index: 5;
    padding: 1rem 0.5rem;
    border-bottom: 2px solid #ffde01;
    text-align: center;
  }

  .day-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .day-tracks {
    position: relative;
    min-height: 810px; /* 13h30 (8:00 à 21:30) * 60 minutes = 810px (1 minute = 1 pixel) */
    height: 810px; /* Hauteur fixe pour toutes les colonnes */
  }

  /* Responsive pour tablettes */
  @media (max-width: 1264px) and (min-width: 769px) {
    .schedule-table {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .a-propos-container {
      gap: 2.5rem;
    }

    .a-propos-text {
      max-width: 45%;
    }

    .a-propos-images {
      max-width: 55%;
    }

    .contact-container {
      gap: 2.5rem;
    }

    .contact-map {
      max-width: 45%;
    }

    .contact-link {
      font-size: 1.6rem;
    }

    .day-header {
      padding: 0.75rem 0.25rem;
    }

    .day-header h3 {
      font-size: 1rem;
    }

    .day-tracks {
      min-height: 810px;
      height: 810px;
    }

    .schedule-block {
      padding: 0.4rem;
    }
  }

  /* Responsive pour mobile */
  @media (max-width: 768px) {
    .schedule-table {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .day-column {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .day-header {
      position: relative;
      padding: 1rem;
      background-color: #ffde01;
      border-bottom: 2px solid #000;
      border-radius: 8px 8px 0 0;
    }

    .day-header h3 {
      font-size: 1.1rem;
      color: #000;
    }

    .day-tracks {
      min-height: 810px;
      height: 810px;
      padding: 0.5rem;
    }

    .schedule-block {
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .schedule-time {
      font-size: 0.7rem;
    }

    .schedule-type {
      font-size: 0.75rem;
    }

    .schedule-note {
      font-size: 0.65rem;
    }
  }

  .schedule-block {
    position: absolute;
    margin: 0;
    padding: 0.375rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    overflow: visible;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    box-sizing: border-box; /* Le padding est inclus dans la largeur */
    min-height: 50px; /* Hauteur minimale pour afficher le contenu */
  }

  /* Pas de chevauchement : 100% de largeur */
  .schedule-block.overlap-1 {
    left: 0;
    right: 0;
    width: 100%;
  }

  /* 2 blocs qui se chevauchent : 50% chacun avec un petit gap de 0.25rem entre eux */
  .schedule-block.overlap-2 {
    width: calc((100% - 0.25rem) / 2);
  }

  .schedule-block.overlap-2.overlap-index-0 {
    left: 0;
  }

  .schedule-block.overlap-2.overlap-index-1 {
    left: calc((100% - 0.25rem) / 2 + 0.25rem);
  }

  /* 3 blocs qui se chevauchent : 33.333% chacun avec des gaps de 0.25rem */
  .schedule-block.overlap-3 {
    width: calc((100% - 0.5rem) / 3);
  }

  .schedule-block.overlap-3.overlap-index-0 {
    left: 0;
  }

  .schedule-block.overlap-3.overlap-index-1 {
    left: calc((100% - 0.5rem) / 3 + 0.25rem);
  }

  .schedule-block.overlap-3.overlap-index-2 {
    left: calc(2 * (100% - 0.5rem) / 3 + 0.5rem);
  }

  .schedule-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }

  .schedule-time {
    font-weight: bold;
    font-size: 0.65rem;
    line-height: 1.1;
    word-break: break-word;
    hyphens: auto;
    flex-shrink: 0;
  }

  .schedule-type {
    font-size: 0.7rem;
    text-transform: capitalize;
    line-height: 1.1;
    opacity: 0.9;
    hyphens: auto;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .schedule-note {
    font-size: 0.6rem;
    line-height: 1.2;
    opacity: 0.85;
    display: block;
    hyphens: auto;
    word-break: break-word;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 3;
    padding: 4rem 2rem;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: bold;
    text-transform: uppercase;
    color: #fff;
    margin: 0;
    line-height: 1.2;
    max-width: 900px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .hero-description {
    font-size: 1.3rem;
    color: #fff !important;
    max-width: 800px;
    line-height: 1.6;
    margin: 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .cta-button {
    display: inline-block;
    background-color: #000;
    color: #ffde01;
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: bold;
    text-decoration: none;
    border-radius: 4px;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;
    text-transform: uppercase;
    margin-top: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .cta-button:hover {
    background-color: #333;
    transform: translateY(-2px);
  }

  #a-propos .cta-button {
    background-color: #ffde01;
    color: #000;
  }

  #a-propos .cta-button:hover {
    background-color: #e6c900;
    transform: translateY(-2px);
  }

  /* Abonnements */
  .pricing-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin: 3rem 0;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
  }

  .pricing-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }

  .pricing-card.dark {
    background-color: #333;
    color: #fff;
  }

  .pricing-card.light {
    background-color: #fff;
    color: #333;
  }

  .pricing-header {
    background-color: #ffde01;
    padding: 1.5rem;
    text-align: center;
  }

  .pricing-header h3 {
    margin: 0;
    color: #000;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .pricing-body {
    padding: 2rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .pricing-price {
    font-size: 1.3rem;
    font-weight: bold;
    margin: 0 0 1.5rem 0;
    opacity: 0.7;
  }

  .pricing-price.yellow {
    color: #ffde01;
    opacity: 1;
  }

  .pricing-features {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
    flex: 1;
  }

  .pricing-features li {
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .pricing-features li:last-child {
    border-bottom: none;
  }

  .pricing-card.light .pricing-features li {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .pricing-card.light .pricing-features li:last-child {
    border-bottom: none;
  }

  .pricing-note {
    font-size: 0.65rem;
    margin: 0.25rem 0;
    opacity: 0.8;
    color: #666;
  }

  .pricing-card.light .pricing-note {
    color: #ccc;
    opacity: 1;
  }

  .pricing-cta {
    text-align: center;
    margin-top: 3rem;
  }

  /* Modale pour les détails d'un horaire */
  .schedule-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .schedule-modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    animation: scheduleModalFadeIn 0.2s ease-out;
  }

  @keyframes scheduleModalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .schedule-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #eee;
  }

  .schedule-modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .schedule-modal-close {
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

  .schedule-modal-close:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .schedule-modal-body {
    padding: 2rem;
  }

  .schedule-modal-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .schedule-modal-info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .schedule-modal-label {
    font-weight: bold;
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .schedule-modal-value {
    color: #333;
    font-size: 1.1rem;
  }

  .schedule-modal-description p,
  .schedule-modal-note p {
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  /* Responsive */
  @media (max-width: 1264px) {
    .main {
      margin-top: 80px;
    }

    .section {
      padding: 2rem 1rem;
    }

    .a-propos-container {
      flex-direction: column;
      gap: 2rem;
    }

    .a-propos-text {
      max-width: 100%;
    }

    #a-propos .a-propos-text h2 {
      font-size: 2rem;
      color: #fff;
    }

    #a-propos .a-propos-text p {
      font-size: 1.1rem;
      margin: 1rem 0;
    }

    .a-propos-images {
      display: none;
    }

    .a-propos-image-wrapper.image-1 {
      transform: rotate(-3deg);
    }

    .a-propos-image-wrapper.image-1:hover {
      transform: scale(1.05) rotate(-3deg);
    }

    .a-propos-image-wrapper.image-2 {
      transform: rotate(3deg);
    }

    .a-propos-image-wrapper.image-2:hover {
      transform: scale(1.05) rotate(3deg);
    }

    .a-propos-image-wrapper.image-3 {
      transform: rotate(-2deg);
    }

    .a-propos-image-wrapper.image-3:hover {
      transform: scale(1.05) rotate(-2deg);
    }

    .contact-container {
      flex-direction: column;
      gap: 2rem;
      align-items: center;
    }

    .contact-map {
      max-width: 100%;
      width: 100%;
    }

    .contact-info {
      width: 100%;
      align-items: flex-start;
    }

    .contact-link {
      font-size: 1.4rem;
    }

    .contact-icon .icon {
      width: 1.5rem;
      height: 1.5rem;
    }

    .section-content h2 {
      font-size: 2rem;
    }

    .section-subtitle {
      font-size: 1rem;
    }

    .pricing-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .pricing-body {
      padding: 1.5rem;
    }

    .hero-title {
      font-size: 2rem;
      padding: 0 1rem;
    }

    .hero-description {
      font-size: 1.1rem;
      padding: 0 1rem;
    }

    .cta-button {
      font-size: 1rem;
      padding: 0.9rem 2rem;
    }

    .schedule-table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .schedule-table {
      grid-template-columns: repeat(7, minmax(160px, 1fr));
      min-width: 840px; /* Force un défilement horizontal sur mobile */
    }

    .day-header h3 {
      font-size: 1rem;
    }

    .schedule-block {
      padding: 0.375rem;
      font-size: 0.75rem;
    }

    .schedule-time {
      font-size: 0.75rem;
    }

    .schedule-type {
      font-size: 0.7rem;
    }

    .schedule-note {
      font-size: 0.6rem;
    }
  }

  @media (max-width: 768px) {
    .section-title-banner {
      margin-bottom: 1.5rem;
    }

    .pricing-container {
      margin: 1.5rem 0;
    }

    .pricing-cta {
      margin-top: 1.5rem;
    }

    .cta-button {
      margin: 0.5rem;
    }
  }
</style>
