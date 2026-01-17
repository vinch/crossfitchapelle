<script lang="ts">
  import { onMount } from "svelte";
  import { createClient } from "$lib/supabase/client";
  import type { ScheduleWithCourseType } from "$lib/types/schedule";
  import { DAYS_OF_WEEK } from "$lib/types/schedule";

  let activeSection = $state<string>("accueil");
  let isScrolling = $state<boolean>(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  let mobileMenuOpen = $state<boolean>(false);
  let isScrolled = $state<boolean>(false);

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

  const menuItems = [
    { id: "accueil", label: "Accueil" },
    { id: "a-propos", label: "À propos" },
    { id: "tarifs", label: "Tarifs" },
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
    end2: string
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
    daySchedules: ScheduleWithCourseType[]
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
              other.end_hour
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

<header class="header" class:scrolled={isScrolled}>
  <div class="header-container">
    <div class="logo-container">
      <button class="logo-button" onclick={scrollToTop} type="button">
        <img src="/logo.png" alt="Logo CrossFit Chapelle" class="logo" />
      </button>
    </div>
    <nav class="nav desktop-nav">
      <ul class="nav-list">
        {#each menuItems as item}
          <li class="nav-item">
            <a
              href="#{item.id}"
              class="nav-link"
              class:active={activeSection === item.id}
              onclick={(e) => handleLinkClick(item.id, e)}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <button
      class="hamburger"
      onclick={toggleMobileMenu}
      aria-label="Menu"
      aria-expanded={mobileMenuOpen}
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </div>
  {#if mobileMenuOpen}
    <nav class="mobile-nav">
      <ul class="mobile-nav-list">
        {#each menuItems as item}
          <li class="mobile-nav-item">
            <a
              href="#{item.id}"
              class="mobile-nav-link"
              class:active={activeSection === item.id}
              onclick={(e) => handleLinkClick(item.id, e)}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</header>

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
          "Je voudrais m'inscrire aux initiations"
        )}"
        class="cta-button">Je m'inscris aux initiations</a
      >
    </div>
  </section>

  <section id="a-propos" class="section">
    <div class="section-content">
      <h2>À propos</h2>
      <p>Contenu de la section À propos</p>
    </div>
  </section>

  <section id="tarifs" class="section">
    <div class="section-content">
      <h2>Tarifs</h2>
      <p>Contenu de la section Tarifs</p>
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
                    >
                      <span class="schedule-time">
                        {formatTime(schedule.start_hour)}
                      </span>
                      <span class="schedule-type">
                        {schedule.course_types.name}
                      </span>
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
      <h2>Contact</h2>
      <p>Contenu de la section Contact</p>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-social">
        <a
          href="https://facebook.com/crossfitchapelle"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          aria-label="Facebook"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="social-icon"
          >
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </a>
        <a
          href="https://instagram.com/crossfitchapelle"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          aria-label="Instagram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="social-icon"
          >
            <path
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
            />
          </svg>
        </a>
      </div>
      <div class="footer-copyright">
        <p>© {new Date().getFullYear()} CrossFit Chapelle</p>
      </div>
    </div>
  </div>
</footer>

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

  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    height: 120px;
    transition: height 0.3s ease;
  }

  .header.scrolled {
    height: 80px;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    height: 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: height 0.3s ease;
  }

  .header.scrolled .header-container {
    height: 80px;
  }

  .logo-container {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .logo-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
  }

  .logo-button:hover {
    opacity: 0.8;
  }

  .logo {
    height: 86px;
    width: auto;
    display: block;
    transition: height 0.3s ease;
  }

  .header.scrolled .logo {
    height: 60px;
  }

  .header.scrolled .logo {
    height: 60px;
  }

  .nav {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
  }

  .nav-item {
    margin: 0;
  }

  .nav-link {
    font-size: 1rem;
    color: #fff;
    padding: 0.5rem 1rem;
    transition:
      color 0.3s ease,
      text-decoration 0.3s ease;
    text-decoration: none;
    position: relative;
    display: inline-block;
  }

  .nav-link:hover {
    color: #ffde01;
  }

  .nav-link.active {
    color: #ffde01;
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 8px;
  }

  /* Menu hamburger */
  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    z-index: 1001;
  }

  .hamburger-line {
    width: 25px;
    height: 3px;
    background-color: #fff;
    transition: all 0.3s ease;
    border-radius: 2px;
    transform-origin: center;
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }

  /* Menu mobile */
  .mobile-nav {
    display: none;
    position: fixed;
    top: 120px;
    left: 0;
    right: 0;
    background-color: #000;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-nav-list {
    list-style: none;
    margin: 0;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
  }

  .mobile-nav-item {
    margin: 0;
  }

  .mobile-nav-link {
    display: block;
    font-size: 1rem;
    color: #fff;
    padding: 1rem 2rem;
    text-decoration: none;
    transition: background-color 0.3s ease;
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.active {
    background-color: #333;
    color: #ffde01;
  }

  .main {
    margin-top: 120px; /* Hauteur du header */
  }

  .section {
    min-height: 100vh;
    padding: 4rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .section:nth-child(odd) {
    background-color: #f9f9f9;
  }

  .section:nth-child(even) {
    background-color: #fff;
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

  .section-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .section-content p {
    font-size: 1.2rem;
    color: #666;
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
    word-break: break-word;
    hyphens: auto;
    flex-shrink: 0;
    overflow-wrap: break-word;
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

  /* Responsive */
  @media (max-width: 768px) {
    .header {
      height: 80px;
    }

    .header-container {
      padding: 0 1rem;
      height: 80px;
    }

    .logo {
      height: 60px;
    }

    .desktop-nav {
      display: none;
    }

    .hamburger {
      display: flex;
    }

    .mobile-nav {
      display: block;
      top: 80px;
    }

    .main {
      margin-top: 80px;
    }

    .section {
      padding: 2rem 1rem;
    }

    .section-content h2 {
      font-size: 2rem;
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
  }

  .footer {
    background-color: #000;
    color: #fff;
    padding: 3rem 2rem;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
  }

  .footer-copyright {
    text-align: center;
    color: #ccc;
    font-size: 0.9rem;
  }

  .footer-copyright p {
    margin: 0;
  }

  .footer-social {
    display: flex;
    gap: 2rem;
  }

  .social-link {
    color: #fff;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s ease;
  }

  .social-link:hover {
    color: #ffde01;
  }

  .social-icon {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }

  @media (max-width: 768px) {
    .footer {
      padding: 2rem 1rem;
    }

    .footer-social {
      gap: 1.5rem;
    }

    .social-link {
      font-size: 0.9rem;
    }
  }
</style>
