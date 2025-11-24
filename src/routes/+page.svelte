<script lang="ts">
  import { onMount } from "svelte";

  let activeSection = $state<string>("accueil");
  let isScrolling = $state<boolean>(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeSection = "accueil";
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

    if (sectionId === "accueil") {
      scrollToTop();
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 72;
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

    // Gérer le scroll vers le haut
    const handleScroll = () => {
      if (isScrolling) return;
      if (window.scrollY < 100) {
        activeSection = "accueil";
      }
    };

    window.addEventListener("scroll", handleScroll);

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
</script>

<header class="header">
  <div class="header-container">
    <div class="logo-container">
      <!-- Logo placeholder -->
      <button class="logo" onclick={scrollToTop} type="button">LOGO</button>
    </div>
    <nav class="nav">
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
  </div>
</header>

<main class="main">
  <section id="accueil" class="section hero-section">
    <video class="hero-video" autoplay muted loop playsinline>
      <source src="/video.mp4" type="video/mp4" />
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
      <a href="mailto:" class="cta-button">Je m'inscris aux initiations</a>
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
    <div class="section-content">
      <h2>Horaires</h2>
      <p>Contenu de la section Horaires</p>
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
  }

  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-container {
    flex-shrink: 0;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    /* Placeholder pour le logo */
    min-width: 100px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #333;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.3s ease;
    border: none;
    padding: 0;
    font-family: inherit;
  }

  .logo:hover {
    opacity: 0.8;
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

  .main {
    margin-top: 72px; /* Hauteur du header */
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
    min-height: calc(100vh - 72px);
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
    .header-container {
      padding: 1rem;
      flex-direction: column;
      gap: 1rem;
    }

    .nav-list {
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .nav-link {
      font-size: 0.9rem;
      padding: 0.4rem 0.8rem;
    }

    .main {
      margin-top: 120px;
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
    justify-content: center;
    align-items: center;
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
