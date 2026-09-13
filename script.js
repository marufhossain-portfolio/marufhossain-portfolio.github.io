/* =========================================================
   Md. Maruf Hossain — Portfolio v2 "Aurora"
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* =========================================================
     PRELOADER
     ========================================================= */
  const preloader = $("#preloader");
  const preCount = $("#preCount");
  const preBar = $("#preBar");
  const preStatus = $("#preStatus");
  const gauge = $("#gaugeProgress");
  const C = 2 * Math.PI * 52;
  if (gauge) gauge.style.strokeDashoffset = C;
  const preStages = [[0, "Initializing"], [18, "Loading experience"], [42, "Compiling modules"], [66, "Polishing pixels"], [90, "Almost ready"]];
  const statusFor = (pct) => { let s = preStages[0][1]; for (const [t, m] of preStages) if (pct >= t) s = m; return s; };

  function runPreloader() {
    if (!preloader) return;
    if (reduce) {
      finishPreloader();
      return;
    }
    const duration = 2400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2.2);
      const pct = Math.round(eased * 100);
      if (preCount) preCount.textContent = pct;
      if (preBar) preBar.style.width = pct + "%";
      if (preStatus) { const s = statusFor(pct); if (preStatus.textContent !== s) preStatus.textContent = s; }
      if (gauge) gauge.style.strokeDashoffset = C * (1 - eased);
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(finishPreloader, 350);
    };
    requestAnimationFrame(step);
  }

  function finishPreloader() {
    if (!preloader) return;
    if (preCount) preCount.textContent = "100";
    if (preBar) preBar.style.width = "100%";
    if (preStatus) preStatus.textContent = "Ready";
    if (gauge) gauge.style.strokeDashoffset = 0;
    preloader.classList.add("done");
    document.body.classList.add("loaded");
    document.body.classList.remove("locked");
    setTimeout(() => preloader.classList.add("hide"), 1400);
  }
  window.addEventListener("load", runPreloader);
  // safety: never stay stuck
  setTimeout(() => { if (!document.body.classList.contains("loaded")) finishPreloader(); }, 6000);

  /* =========================================================
     THEME
     ========================================================= */
  const root = document.documentElement;
  const stored = localStorage.getItem("mmh2-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.setAttribute("data-theme", stored || (prefersLight ? "light" : "dark"));
  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("mmh2-theme", next);
    });
  }

  /* =========================================================
     CURSOR
     ========================================================= */
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (canHover && dot && ring && !reduce) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    const hoverables = "a, button, .card, .stat, .exp-tab, .chip, .repo, .proj, input, textarea";
    document.addEventListener("mouseover", (e) => { if (e.target.closest(hoverables)) ring.classList.add("hover"); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest(hoverables)) ring.classList.remove("hover"); });
    document.addEventListener("mouseleave", () => { dot.classList.add("hidden"); ring.classList.add("hidden"); });
    document.addEventListener("mouseenter", () => { dot.classList.remove("hidden"); ring.classList.remove("hidden"); });
  } else if (dot && ring) {
    dot.style.display = ring.style.display = "none";
  }

  /* =========================================================
     NAV / SCROLL
     ========================================================= */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("scrolled", h.scrollTop > 30);
    if (toTop) toTop.classList.toggle("show", h.scrollTop > 560);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  const burger = $("#burger");
  const navLinks = $("#navLinks");
  if (burger && navLinks) {
    burger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$("a", navLinks).forEach((a) => a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      burger.classList.remove("open");
    }));
  }

  const sections = $$("section[id]");
  if (sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          $$(".nav-links a").forEach((a) => a.classList.remove("active"));
          const link = $(`.nav-links a[href="#${e.target.id}"]`);
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* =========================================================
     HERO TEXT SPLIT
     ========================================================= */
  function splitChars(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split("").forEach((ch) => {
            if (ch === " ") { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span");
            s.className = "char";
            s.textContent = ch;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  }
  const splitTargets = $$("[data-split]");
  splitTargets.forEach((el) => {
    splitChars(el);
    $$(".char", el).forEach((ch, i) => (ch.style.animationDelay = 0.35 + i * 0.035 + "s"));
  });

  /* =========================================================
     TYPEWRITER
     ========================================================= */
  const typed = $("#typed");
  if (typed) {
    const roles = [
      "Operational Excellence (OPEX) Leader",
      "Production Planning & Control Specialist",
      "Lean & Six Sigma Practitioner",
      "Production-Process Automation Builder",
      "Industrial & Production Engineer",
    ];
    let ri = 0, ci = 0, del = false;
    const tick = () => {
      const w = roles[ri];
      ci += del ? -1 : 1;
      typed.textContent = w.slice(0, ci);
      let d = del ? 38 : 80;
      if (!del && ci === w.length) { d = 1700; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; d = 320; }
      setTimeout(tick, d);
    };
    if (reduce) typed.textContent = roles[0];
    else setTimeout(tick, 2600);
  }

  /* =========================================================
     REVEAL
     ========================================================= */
  const reveals = $$(".reveal");
  if (reduce) reveals.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const d = Number(e.target.dataset.delay || 0);
          setTimeout(() => e.target.classList.add("in"), d);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* =========================================================
     COUNTERS + RINGS
     ========================================================= */
  const fmtNum = (n, dec) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const counters = $$("[data-target]");
  const cObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.target);
      const dec = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const ring = el.closest(".stat")?.querySelector(".ring .p");
      const ringVal = ring ? Number(ring.dataset.ring || 100) : null;
      const R = 213.6;
      const dur = 1700;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmtNum(target * eased, dec) + suffix;
        if (ring) ring.style.strokeDashoffset = R * (1 - (ringVal / 100) * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + fmtNum(target, dec) + suffix;
      };
      if (reduce) { el.textContent = prefix + fmtNum(target, dec) + suffix; if (ring) ring.style.strokeDashoffset = R * (1 - ringVal / 100); }
      else requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => cObs.observe(c));

  /* =========================================================
     EXPERIENCE TABS
     ========================================================= */
  const expTabs = $$(".exp-tab");
  const expPanels = $$(".exp-panel");
  expTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      expTabs.forEach((t) => t.classList.remove("active"));
      expPanels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = $(`#exp-${tab.dataset.exp}`);
      if (panel) panel.classList.add("active");
    });
  });

  /* =========================================================
     CARD GLOW + TILT + MAGNETIC
     ========================================================= */
  $$(".card, .stat, .proj, .repo, .exp-card, .list-card, .contact-card, .mock, .sys").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (canHover && !reduce) {
        const rx = ((y / r.height) - 0.5) * -5;
        const ry = ((x / r.width) - 0.5) * 5;
        card.style.transform = `perspective(900px) translateY(-7px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });

  if (canHover && !reduce) {
    $$(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
    });
    const aurora = $$(".aurora span");
    let raf = null;
    window.addEventListener("mousemove", (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        aurora.forEach((b, i) => {
          const d = (i + 1) * 16;
          b.style.marginLeft = nx * d + "px";
          b.style.marginTop = ny * d + "px";
        });
        raf = null;
      });
    });
  }

  /* =========================================================
     PARTICLES
     ========================================================= */
  const canvas = $("#particles");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, pts = [];
    const count = window.innerWidth < 780 ? 34 : 74;
    const mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.6,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(148,163,184,0.55)";
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / 130) * 0.35})`;
            ctx.lineWidth = 1; ctx.stroke();
          }
        }
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(34,211,238,${(1 - md / 150) * 0.4})`;
          ctx.lineWidth = 1; ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* =========================================================
     CLOCK / YEAR
     ========================================================= */
  const clock = $("#clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const t = () => (clock.textContent = fmt.format(new Date()));
    t(); setInterval(t, 1000);
  }
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* =========================================================
     CONTACT FORM
     ========================================================= */
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cf-name").value.trim();
      const email = $("#cf-email").value.trim();
      const msg = $("#cf-message").value.trim();
      const note = $("#formNote");
      const subject = encodeURIComponent(`Portfolio enquiry from ${name || "a visitor"}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:marufhossain2707@gmail.com?subject=${subject}&body=${body}`;
      if (note) { note.textContent = "Opening your email app…"; note.classList.add("ok"); }
      form.reset();
    });
  }

  /* =========================================================
     GITHUB (front-end repos only)
     ========================================================= */
  const GH_USER = "marufhossain-portfolio";
  const HIDDEN_REPOS = ["alel-operation-bulletin"];
  const FRONTEND_LANGS = ["HTML", "CSS", "JavaScript", "TypeScript", "Vue", "Svelte", "SCSS"];
  const repoWrap = $("#repos");
  const ghStats = $("#ghStats");
  const langColor = (l) => ({ JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Svelte: "#ff3e00", SCSS: "#c6538c" }[l] || "#22d3ee");
  const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    for (const [n, sec] of [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
      const v = Math.floor(s / sec);
      if (v >= 1) return `${v} ${n}${v > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };
  const loadGitHub = async () => {
    if (!repoWrap) return;
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`https://api.github.com/users/${GH_USER}`),
        fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`),
      ]);
      if (!uRes.ok || !rRes.ok) throw new Error("api");
      const user = await uRes.json();
      const repos = await rRes.json();
      if (ghStats) {
        ghStats.innerHTML = `<span class="live-badge"><span class="pulse-dot"></span>Live · ${user.public_repos} repos · ${user.followers} followers</span>`;
      }
      const picked = repos
        .filter((r) => !r.fork && !HIDDEN_REPOS.includes(r.name) && FRONTEND_LANGS.includes(r.language))
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 6);
      if (!picked.length) {
        repoWrap.innerHTML = `<p style="color:var(--muted)">No public front-end repositories yet.</p>`;
        return;
      }
      repoWrap.innerHTML = picked.map((r) => `
        <a class="repo" href="${r.html_url}" target="_blank" rel="noopener">
          <h4>${r.name}</h4>
          <p>${r.description || "No description provided."}</p>
          <div class="meta">
            ${r.language ? `<span class="lang"><span class="lang-dot" style="background:${langColor(r.language)}"></span>${r.language}</span>` : ""}
            <span>★ ${r.stargazers_count}</span>
            <span>⑂ ${r.forks_count}</span>
            <span>${timeAgo(r.pushed_at)}</span>
          </div>
        </a>`).join("");
    } catch {
      repoWrap.innerHTML = `<div class="repo"><h4>GitHub</h4><p>Live data unavailable right now.</p><div class="meta"><a href="https://github.com/${GH_USER}" target="_blank" rel="noopener" style="color:var(--c3)">github.com/${GH_USER} →</a></div></div>`;
    }
  };
  loadGitHub();
})();
