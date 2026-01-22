<script lang="ts">
  import { onMount } from "svelte";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let headerHeight = $state(80);
  let isScrolled = $state(false);

  onMount(() => {
    const header = document.querySelector("header");
    if (!header) return;

    function updateHeaderHeight() {
      if (header) {
        headerHeight = header.offsetHeight;
      }
    }

    // Gérer le scroll pour réduire le header
    function handleScroll() {
      isScrolled = window.scrollY > 50;
    }

    // Mise à jour initiale
    updateHeaderHeight();
    handleScroll();

    // Observer les changements de taille du header
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight();
    });
    resizeObserver.observe(header);

    // Écouter les changements de taille de la fenêtre et le scroll
    window.addEventListener("resize", updateHeaderHeight);
    window.addEventListener("scroll", handleScroll);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<svelte:head>
  <title>Mentions légales - CrossFit Chapelle</title>
  <meta
    name="description"
    content="Mentions légales du site CrossFit Chapelle"
  />
</svelte:head>

<Header variant="simple" {isScrolled} />

<main
  class="legal-page"
  style="margin-top: {headerHeight}px; min-height: calc(100vh - {headerHeight}px);"
>
  <div class="legal-container">
    <nav class="legal-nav">
      <a href="#mentions-legales" class="legal-nav-link">Mentions légales</a>
      <span class="legal-nav-separator">·</span>
      <a href="#politique-confidentialite" class="legal-nav-link"
        >Politique de confidentialité</a
      >
      <span class="legal-nav-separator">·</span>
      <a href="#politique-cookies" class="legal-nav-link"
        >Politique de cookies</a
      >
    </nav>
    <div class="legal-content">
      <section id="mentions-legales" class="legal-section">
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          <strong>RITE SRL</strong> – Société à responsabilité limitée de droit
          belge<br />
          Siège social : Clos du Chêne au Bois 8, 7160 Chapelle-lez-Herlaimont, Belgique<br
          />
          Numéro d'entreprise (BCE) : 0743.804.215<br />
          Numéro de TVA : BE0743.804.215<br />
          Email :
          <a href="mailto:info@crossfitchapelle.com"
            >info@crossfitchapelle.com</a
          ><br />
          <!-- Téléphone : <span class="placeholder">[à compléter]</span> -->
        </p>

        <h2>Responsable de la publication</h2>
        <p>
          Mathieu De Middeleer – Gérant de RITE SRL<br />
          Contact :
          <a href="mailto:info@crossfitchapelle.com"
            >info@crossfitchapelle.com</a
          >
        </p>

        <h2>Hébergement</h2>
        <p>
          Vercel Inc.<br />
          340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
          Site web :
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
            >https://vercel.com</a
          >
        </p>

        <h2>Accès au site</h2>
        <p>
          L'accès au site est libre. L'éditeur se réserve le droit de suspendre,
          limiter ou interrompre l'accès au site à tout moment pour des raisons
          techniques ou de maintenance.
        </p>

        <h2>Responsabilité</h2>
        <p>
          RITE SRL s'efforce de fournir des informations exactes et à jour.
          Toutefois, elle ne saurait être tenue responsable des erreurs,
          omissions ou d'une indisponibilité temporaire du site. L'utilisation
          des informations présentes sur le site se fait sous la responsabilité
          exclusive de l'utilisateur.
        </p>

        <h2>Liens externes</h2>
        <p>
          Le site peut contenir des liens vers des sites tiers. RITE SRL
          n'exerce aucun contrôle sur ces sites et décline toute responsabilité
          quant à leur contenu.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site (textes, images, logos, vidéos,
          graphismes, bases de données) est protégé par le droit de la propriété
          intellectuelle et est la propriété exclusive de RITE SRL, sauf mention
          contraire. Toute reproduction, représentation, modification ou
          diffusion sans autorisation écrite est interdite.
        </p>

        <h2>Droit applicable et juridiction compétente</h2>
        <p>
          Le site est soumis au droit belge. En cas de litige, les tribunaux de
          l'arrondissement judiciaire compétent seront seuls compétents.
        </p>
      </section>

      <section id="politique-confidentialite" class="legal-section">
        <h1>Politique de confidentialité</h1>

        <h2>Responsable du traitement</h2>
        <p>
          <strong>RITE SRL</strong><br />
          Email :
          <a href="mailto:info@crossfitchapelle.com"
            >info@crossfitchapelle.com</a
          >
        </p>

        <h2>Données personnelles collectées</h2>
        <p>
          Dans le cadre de l'utilisation du site, RITE SRL est susceptible de
          collecter les données personnelles suivantes : l'identité (nom,
          prénom), les coordonnées (adresse email, numéro de téléphone), les
          données de navigation (adresse IP, type de navigateur, pages
          consultées) ainsi que toute information transmise volontairement via
          les formulaires présents sur le site.
        </p>

        <h2>Finalités du traitement</h2>
        <p>
          Les données personnelles sont collectées pour les finalités suivantes
          : la gestion des demandes de contact, les inscriptions et la gestion
          des membres, la communication informative ou commerciale,
          l'amélioration du site et de ses fonctionnalités, ainsi que le respect
          des obligations légales applicables.
        </p>

        <h2>Base légale du traitement</h2>
        <p>
          Les traitements de données reposent sur l'une des bases légales
          suivantes : le consentement de l'utilisateur, l'exécution d'un contrat
          ou de mesures précontractuelles, le respect d'une obligation légale ou
          l'intérêt légitime de RITE SRL.
        </p>

        <h2>Durée de conservation</h2>
        <p>
          Les données personnelles sont conservées uniquement pendant la durée
          nécessaire à la réalisation des finalités pour lesquelles elles ont
          été collectées, ou conformément aux obligations légales en vigueur.
        </p>

        <h2>Destinataires et sous-traitants</h2>
        <p>
          Les données peuvent être traitées par des prestataires techniques
          agissant en tant que sous-traitants, notamment pour l'hébergement, la
          maintenance du site, les outils de communication ou de statistiques.
          Ces prestataires sont situés dans l'Union européenne ou dans des pays
          offrant des garanties adéquates conformément au Règlement général sur
          la protection des données (RGPD).
        </p>

        <h2>Sécurité des données</h2>
        <p>
          RITE SRL met en œuvre des mesures techniques et organisationnelles
          appropriées afin de garantir un niveau de sécurité adapté aux risques,
          et de protéger les données personnelles contre la perte, l'altération,
          l'accès non autorisé ou la divulgation.
        </p>

        <h2>Droits des personnes concernées</h2>
        <p>
          Conformément au RGPD, toute personne concernée dispose des droits
          suivants : droit d'accès, de rectification, d'effacement, de
          limitation du traitement, d'opposition, ainsi que du droit à la
          portabilité de ses données.
        </p>

        <h2>Exercice des droits</h2>
        <p>
          Les droits peuvent être exercés à tout moment en adressant une demande
          par email à
          <a href="mailto:info@crossfitchapelle.com"
            >info@crossfitchapelle.com</a
          >. Une preuve d'identité pourra être demandée afin d'éviter toute
          utilisation abusive.
        </p>

        <h2>Droit de réclamation</h2>
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne sont
          pas respectés, vous disposez du droit d'introduire une réclamation
          auprès de l'autorité de contrôle compétente :
        </p>
        <p>
          Autorité de protection des données (Belgique)<br />
          <a
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.autoriteprotectiondonnees.be
          </a>
        </p>
      </section>

      <section id="politique-cookies" class="legal-section">
        <h1>Politique de cookies</h1>

        <p>
          Le site utilise des cookies et technologies similaires afin d'assurer
          son bon fonctionnement, d'améliorer l'expérience utilisateur, et, le
          cas échéant, de mesurer l'audience. Un cookie est un petit fichier
          enregistré sur votre appareil (ordinateur, smartphone, tablette) lors
          de la consultation d'un site web.
        </p>

        <h2>Types de cookies utilisés</h2>
        <p>Le site peut utiliser les catégories de cookies suivantes :</p>
        <ul>
          <li>
            <strong>Cookies strictement nécessaires</strong> : indispensables au
            fonctionnement du site (par exemple, sécurité, équilibrage de charge,
            préférences essentielles). Ces cookies ne nécessitent pas de consentement.
          </li>
          <li>
            <strong>Cookies fonctionnels</strong> : permettent d'améliorer votre
            expérience (par exemple, mémoriser certaines préférences). Ils peuvent
            être soumis à consentement selon leur nature.
          </li>
          <li>
            <strong>Cookies de mesure d'audience</strong> : permettent d'obtenir
            des statistiques de fréquentation et d'usage du site afin d'en améliorer
            le contenu et les performances. Ils sont soumis à votre consentement.
          </li>
          <li>
            <strong>Cookies tiers</strong> : déposés par des services externes (par
            exemple, outils de mesure, plateformes vidéo, réseaux sociaux). Ils sont
            soumis à votre consentement.
          </li>
        </ul>

        <h2>Consentement</h2>
        <p>
          Lors de votre première visite, un bandeau vous informe de
          l'utilisation de cookies et vous permet d'accepter, de refuser, ou de
          paramétrer les cookies non essentiels. Les cookies soumis à
          consentement ne sont déposés qu'après votre choix explicite.
        </p>

        <h2>Durée de conservation</h2>
        <p>
          Les cookies sont conservés pour une durée maximale de <strong
            >13 mois</strong
          >, conformément aux recommandations généralement appliquées en Europe.
          La durée exacte peut varier selon le cookie et sa finalité.
        </p>

        <h2>Gestion et retrait du consentement</h2>
        <p>Vous pouvez modifier votre choix à tout moment :</p>
        <ul>
          <li>
            via l'outil de gestion des cookies (bandeau ou bouton "Gérer mes
            cookies" s'il est disponible sur le site),
          </li>
          <li>
            ou via les paramètres de votre navigateur, qui permettent de
            supprimer ou bloquer les cookies. Attention : le blocage des cookies
            strictement nécessaires peut affecter le bon fonctionnement du site.
          </li>
        </ul>

        <h2>Mise à jour</h2>
        <p>
          La présente politique peut être mise à jour afin de refléter les
          évolutions légales, techniques ou fonctionnelles. Nous vous invitons à
          la consulter régulièrement.
        </p>
      </section>
    </div>
  </div>
</main>

<Footer />

<style>
  :global(html) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: #333;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  .legal-page {
    padding: 4rem 2rem;
    background-color: #fff;
  }

  .legal-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .legal-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 0;
    margin-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .legal-nav-link {
    color: #333;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition: color 0.3s ease;
    padding: 0.5rem 0;
  }

  .legal-nav-link:hover {
    color: #ffde01;
    text-decoration: none;
  }

  .legal-nav-separator {
    color: #999;
    font-size: 0.9rem;
  }

  .legal-content {
    font-size: 1rem;
    line-height: 1.8;
    color: #333;
  }

  .legal-section {
    margin-bottom: 5rem;
    padding-top: 4rem;
    position: relative;
    scroll-margin-top: calc(var(--header-height, 80px) + 2rem);
  }

  .legal-section:first-child {
    padding-top: 0;
  }

  .legal-section:not(:first-child)::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      #ddd 20%,
      #ddd 80%,
      transparent
    );
  }

  .legal-section:last-child {
    margin-bottom: 0;
  }

  .legal-section h1 {
    font-size: 2.5rem;
    font-weight: bold;
    color: #000;
    margin-bottom: 2.5rem;
    margin-top: 0;
    padding-bottom: 1rem;
    border-bottom: 3px solid #ffde01;
    position: relative;
  }

  .legal-section:not(:first-child) h1 {
    margin-top: 1rem;
  }

  .legal-section h2 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #000;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
  }

  .legal-section h2:first-of-type {
    margin-top: 0;
  }

  .legal-section p {
    margin-bottom: 1.5rem;
    text-align: justify;
  }

  .legal-section p:last-child {
    margin-bottom: 0;
  }

  .legal-section a {
    color: #000;
    text-decoration: underline;
    text-decoration-color: #ffde01;
    text-underline-offset: 2px;
    transition:
      color 0.3s ease,
      text-decoration-color 0.3s ease;
  }

  .legal-section a:hover {
    color: #ffde01;
    text-decoration: none;
  }

  .legal-section strong {
    font-weight: 600;
    color: #000;
  }

  .legal-section .placeholder {
    color: #999;
    font-style: italic;
  }

  .legal-section ul {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    text-align: left;
    list-style-type: disc;
  }

  .legal-section li {
    margin-bottom: 0.75rem;
    line-height: 1.7;
  }

  .legal-section li:last-child {
    margin-bottom: 0;
  }

  .legal-section li strong {
    display: inline-block;
    margin-bottom: 0.25rem;
  }

  @media (max-width: 768px) {
    .legal-page {
      padding: 2rem 1rem;
    }

    .legal-nav {
      padding: 1rem 0;
      margin-bottom: 1.5rem;
      gap: 0.75rem;
    }

    .legal-nav-link {
      font-size: 0.85rem;
    }

    .legal-section {
      margin-bottom: 3rem;
      scroll-margin-top: calc(var(--header-height, 80px) + 1rem);
    }

    .legal-section h1 {
      font-size: 2rem;
      margin-bottom: 2rem;
      padding-bottom: 0.75rem;
    }

    .legal-section h1:not(:first-child) {
      margin-top: 3rem;
    }

    .legal-section h2 {
      font-size: 1.3rem;
      margin-top: 2rem;
    }

    .legal-content {
      font-size: 0.95rem;
    }

    .legal-section p {
      text-align: left;
    }

    .legal-section ul {
      padding-left: 1.5rem;
    }
  }
</style>
