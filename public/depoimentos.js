
(() => {
  "use strict";

  // ──────────────────────────────────────────────────────
  // CONFIGURAÇÕES SUPABASE
  // ──────────────────────────────────────────────────────

  const SUPABASE_URL = "https://txfncrxzionvqcfowkun.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4Zm5jcnh6aW9udnFjZm93a3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzI2NzcsImV4cCI6MjA5MjY0ODY3N30.6Z6Ch_CvSdT9h5NrAzckjuZR-I-1u_-U3V8_Ao0_bF0";
  const TABLE   = "depoimentos";
  const BUCKET  = "videos-depoimentos";

  // ──────────────────────────────────────────────────────
  // CONFIGURAÇÕES GERAIS
  // ──────────────────────────────────────────────────────

  const CONFIG = {
    MAX_TEXT_LENGTH    : 400,
    MAX_NAME_LENGTH    : 60,
    MAX_VIDEO_SIZE_MB  : 500,        // Aceita até 500MB — comprime antes do upload
    ALLOWED_VIDEO_TYPES: ["video/mp4","video/webm","video/ogg","video/quicktime"],
    NEW_BADGE_HOURS    : 48,
    // Compressão de vídeo (FFmpeg.wasm)
    VIDEO_MAX_WIDTH    : 1920,       // 1080p largura máxima
    VIDEO_MAX_HEIGHT   : 1080,       // 1080p altura máxima
    VIDEO_CRF          : "23",       // Qualidade (18=alta, 28=baixa, 23=padrão)
    VIDEO_PRESET       : "fast",     // Velocidade de compressão
  };

  // ──────────────────────────────────────────────────────
  // DEPOIMENTOS ESTÁTICOS (sempre visíveis, não vão ao banco)
  // ──────────────────────────────────────────────────────

  const STATIC = [
    { id:"s1", name:"Ana Ferreira",   initials:"AF", stars:5, destination:"Paris, França",   status:"approved", video_url:null, created_at:null, isStatic:true,
      text:"A Kumbuka cuidou de absolutamente tudo para minha viagem a Paris. Visto, passagem, hotel... fui e voltei sem nenhuma dor de cabeça. Simplesmente perfeito!" },
    { id:"s2", name:"Rafael Costa",   initials:"RC", stars:5, destination:"Nova York, EUA",  status:"approved", video_url:null, created_at:null, isStatic:true,
      text:"Precisava de ajuda urgente com meu visto americano e a equipe foi incrível. Profissionalismo do início ao fim. Minha viagem a Nova York foi inesquecível!" },
    { id:"s3", name:"Mariana Santos", initials:"MS", stars:5, destination:"Tóquio, Japão",   status:"approved", video_url:null, created_at:null, isStatic:true,
      text:"Viagem em família para o Japão — cinco pessoas, tudo organizado pela Kumbuka. Cada detalhe foi pensado. Recomendo de olhos fechados para qualquer viagem internacional." },
  ];

  // ──────────────────────────────────────────────────────
  // ESTADO
  // ──────────────────────────────────────────────────────

  let selectedStars    = 0;
  let selectedVideoFile = null;
  let isAdminMode      = false;
  let adminAccessToken = null;
  let videoModalEl     = null;

  // ──────────────────────────────────────────────────────
  // API SUPABASE
  // ──────────────────────────────────────────────────────

  const headers = (extra = {}) => ({
    "Content-Type" : "application/json",
    "apikey"       : SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${adminAccessToken || SUPABASE_ANON_KEY}`,
    ...extra,
  });

  async function fetchTestimonials() {
    let url = `${SUPABASE_URL}/rest/v1/${TABLE}?order=created_at.desc`;
    if (!isAdminMode) url += `&status=eq.approved`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error("Erro ao buscar depoimentos");
    return res.json();
  }

  async function insertTestimonial(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method : "POST",
      headers: headers({ "Prefer": "return=representation" }),
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erro ao inserir"); }
    return res.json();
  }

  async function approveTestimonial(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method : "PATCH",
      headers: headers({ "Prefer": "return=representation" }),
      body   : JSON.stringify({ status: "approved" }),
    });
    if (!res.ok) throw new Error("Erro ao aprovar");
  }

  async function deleteTestimonial(id, videoUrl) {
    if (videoUrl) {
      const path = videoUrl.match(/public\/videos-depoimentos\/(.+)$/)?.[1];
      if (path) await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method : "DELETE",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${adminAccessToken || SUPABASE_ANON_KEY}` },
      });
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method : "DELETE",
      headers: headers(),
    });
    if (!res.ok) throw new Error("Erro ao excluir");
  }

  // ──────────────────────────────────────────────────────
  // COMPRESSÃO DE VÍDEO — API nativa do browser
  // Usa MediaRecorder + Canvas para redimensionar para 1080p
  // Funciona em localhost e produção sem restrições de segurança
  // ──────────────────────────────────────────────────────

  /**
   * Comprime e redimensiona o vídeo para 1080p usando
   * a API nativa do browser (sem bibliotecas externas).
   *
   * Processo:
   * 1. Carrega o vídeo num elemento <video> oculto
   * 2. Desenha cada frame num <canvas> redimensionado
   * 3. Captura o canvas com MediaRecorder → novo vídeo comprimido
   * 4. Retorna o ficheiro comprimido como File
   */
  async function compressVideo(file) {
    showProgressPanel(true);
    updateProgress(5, "Lendo vídeo...");

    // Verifica suporte ao MediaRecorder
    if (!window.MediaRecorder) {
      console.warn("MediaRecorder não suportado, enviando sem compressão.");
      showProgressPanel(false);
      return file;
    }

    return new Promise((resolve) => {
      const originalMB = (file.size / (1024 * 1024)).toFixed(1);
      const videoURL   = URL.createObjectURL(file);

      // Elemento de vídeo oculto para decodificar o ficheiro original
      const videoEl = document.createElement("video");
      videoEl.src      = videoURL;
      videoEl.muted    = true;
      videoEl.playsInline = true;
      videoEl.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px";
      document.body.appendChild(videoEl);

      videoEl.addEventListener("loadedmetadata", () => {
        updateProgress(15, "Analisando dimensões...");

        // Calcula dimensões de saída mantendo proporção (máx 1920x1080)
        const MAX_W = CONFIG.VIDEO_MAX_WIDTH;
        const MAX_H = CONFIG.VIDEO_MAX_HEIGHT;
        let outW = videoEl.videoWidth;
        let outH = videoEl.videoHeight;

        if (outW > MAX_W || outH > MAX_H) {
          const ratio = Math.min(MAX_W / outW, MAX_H / outH);
          outW = Math.round(outW * ratio);
          outH = Math.round(outH * ratio);
        }

        // Garante dimensões pares (necessário para alguns codecs)
        outW = outW % 2 === 0 ? outW : outW - 1;
        outH = outH % 2 === 0 ? outH : outH - 1;

        const duration = videoEl.duration;
        updateProgress(20, `Preparando canvas ${outW}×${outH}...`);

        // Canvas onde cada frame será desenhado e redimensionado
        const canvas  = document.createElement("canvas");
        canvas.width  = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");

        // Escolhe o melhor codec disponível no browser
        const mimeType = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
          "video/mp4",
        ].find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";

        // Bitrate adaptativo: 1080p usa 4Mbps, menor resolução usa menos
        const pixels  = outW * outH;
        const bitrate = Math.min(4_000_000, Math.max(800_000, pixels * 2));

        const recorder = new MediaRecorder(canvas.captureStream(30), {
          mimeType,
          videoBitsPerSecond: bitrate,
        });

        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
          URL.revokeObjectURL(videoURL);
          document.body.removeChild(videoEl);

          const blob        = new Blob(chunks, { type: mimeType });
          const compMB      = (blob.size / (1024 * 1024)).toFixed(1);
          const reduction   = Math.max(0, Math.round((1 - blob.size / file.size) * 100));

          updateProgress(100, "Compressão concluída! ✔");
          updateProgressLabel(`✔ ${originalMB}MB → ${compMB}MB (${reduction}% menor)`);
          setTimeout(() => showProgressPanel(false), 2500);

          const ext      = mimeType.includes("mp4") ? "mp4" : "webm";
          const outFile  = new File([blob], `video_depoimento.${ext}`, { type: mimeType });
          resolve(outFile);
        };

        // Inicia gravação e reprodução
        recorder.start(100); // Chunk a cada 100ms
        videoEl.currentTime = 0;
        videoEl.play();

        // Loop: desenha cada frame no canvas enquanto o vídeo toca
        let lastTime = -1;
        function drawFrame() {
          if (videoEl.ended || videoEl.paused) {
            recorder.stop();
            return;
          }

          // Só redesenha se o frame mudou
          if (videoEl.currentTime !== lastTime) {
            ctx.drawImage(videoEl, 0, 0, outW, outH);
            lastTime = videoEl.currentTime;

            // Atualiza progresso com base no tempo do vídeo
            if (duration > 0) {
              const pct = Math.round(20 + (videoEl.currentTime / duration) * 75);
              updateProgress(pct, `Comprimindo vídeo... ${pct}%`);
            }
          }

          requestAnimationFrame(drawFrame);
        }

        videoEl.addEventListener("play", drawFrame, { once: true });

        // Timeout de segurança: se demorar mais de 5 min, cancela e envia original
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, 300_000);

      }); // fim loadedmetadata

      videoEl.addEventListener("error", () => {
        console.warn("Erro ao ler vídeo, enviando sem compressão.");
        URL.revokeObjectURL(videoURL);
        document.body.removeChild(videoEl);
        showProgressPanel(false);
        resolve(file);
      });

    }); // fim Promise
  }

  // ── UI da barra de progresso ──

  function showProgressPanel(show) {
    let panel = document.getElementById("videoProgressPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "videoProgressPanel";
      panel.innerHTML = `
        <div class="vp-label" id="vpLabel">Preparando...</div>
        <div class="vp-bar-wrap">
          <div class="vp-bar" id="vpBar"></div>
        </div>
        <div class="vp-sublabel" id="vpSublabel"></div>`;
      // Insere após o upload area
      const uploadArea = document.getElementById("videoUploadArea");
      uploadArea?.parentNode?.insertBefore(panel, uploadArea.nextSibling);

      // Estilos inline (para não depender do CSS externo)
      const style = document.createElement("style");
      style.textContent = `
        #videoProgressPanel {
          background: rgba(13,27,42,0.04);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 12px;
          padding: 1rem 1.2rem;
          margin-top: 0.8rem;
          display: none;
        }
        #videoProgressPanel.show { display: block; }
        .vp-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--deep);
          margin-bottom: 0.6rem;
        }
        .vp-bar-wrap {
          background: rgba(13,27,42,0.08);
          border-radius: 20px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 0.4rem;
        }
        .vp-bar {
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(to right, var(--gold), var(--teal-light));
          width: 0%;
          transition: width 0.4s ease;
        }
        .vp-sublabel {
          font-size: 0.75rem;
          color: var(--gray);
        }`;
      document.head.appendChild(style);
    }
    panel.classList.toggle("show", show);
    if (show) { updateProgress(0, "Iniciando..."); }
  }

  function updateProgress(pct, label) {
    const bar   = document.getElementById("vpBar");
    const lbl   = document.getElementById("vpLabel");
    if (bar) bar.style.width = `${pct}%`;
    if (lbl) lbl.textContent = label || "";
  }

  function updateProgressLabel(sublabel) {
    const el = document.getElementById("vpSublabel");
    if (el) el.textContent = sublabel;
  }

  /**
   * Faz upload do vídeo (já comprimido) para o Supabase Storage.
   * Retorna a URL pública.
   */
  async function uploadVideo(file, tempId) {
    const ext  = file.name.split(".").pop() || "mp4";
    const path = `${tempId}.${ext}`;
    const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method : "POST",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                 "Content-Type": file.type, "x-upsert": "true" },
      body   : file,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erro no upload"); }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  // ──────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────

  const getInitials = (name) =>
    name.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()||"").join("");

  const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

  function formatDate(d) {
    if (!d) return "";
    const diff  = Date.now() - new Date(d).getTime();
    const mins  = Math.floor(diff/60000);
    const hours = Math.floor(diff/3600000);
    const days  = Math.floor(diff/86400000);
    if (mins  < 1 ) return "agora mesmo";
    if (mins  < 60) return `há ${mins} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days  <  7) return `há ${days} dia${days>1?"s":""}`;
    return new Date(d).toLocaleDateString("pt-BR");
  }

  const isNew       = (d) => d && Date.now() - new Date(d).getTime() < CONFIG.NEW_BADGE_HOURS * 3600000;
  const renderStars = (n) => "★".repeat(n) + "☆".repeat(5-n);
  const sanitize    = (s) => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // ──────────────────────────────────────────────────────
  // RENDERIZAÇÃO
  // ──────────────────────────────────────────────────────

  function createCard(t, animate = false) {
    const card = document.createElement("div");
    card.className = `testi-card${t.status==="pending"?" pending":""}${animate?" new-entry":""}`;
    card.dataset.id = t.id;

    const newBadge     = isNew(t.created_at) ? `<span class="testi-badge-new">✦ Novo</span>` : "";
    const videoSection = t.video_url
      ? `<div class="testi-video-wrap"><video src="${t.video_url}" controls preload="metadata"></video></div>` : "";
    const dateSection  = t.created_at ? `<div class="testi-date">${formatDate(t.created_at)}</div>` : "";
    const adminActions = t.isStatic ? "" : `
      <div class="testi-admin-actions">
        ${t.status==="pending" ? `<button class="admin-btn approve" data-id="${t.id}">✔ Aprovar</button>` : ""}
        <button class="admin-btn delete" data-id="${t.id}" data-video="${t.video_url||""}">✕ Excluir</button>
      </div>`;

    card.innerHTML = `
      <div class="testi-quote">"</div>
      <div class="testi-stars">${renderStars(t.stars)}</div>
      <p class="testi-text">${sanitize(t.text)}</p>
      <div class="testi-author">
        <div class="testi-avatar">${sanitize(t.initials||getInitials(t.name))}</div>
        <div>
          <div class="testi-name">${sanitize(t.name)}${newBadge}</div>
          ${t.destination ? `<div class="testi-dest">${sanitize(t.destination)}</div>` : ""}
          ${dateSection}
        </div>
      </div>
      ${videoSection}
      ${adminActions}`;

    card.querySelector(".admin-btn.approve")?.addEventListener("click", e => { e.stopPropagation(); handleApprove(t.id, card); });
    card.querySelector(".admin-btn.delete") ?.addEventListener("click", e => { e.stopPropagation(); handleDelete(t.id, t.video_url, card); });
    if (t.video_url) card.querySelector("video")?.addEventListener("click", () => openVideoModal(t.video_url));

    return card;
  }

  async function renderAll() {
    const grid = document.getElementById("testiGrid");
    if (!grid) return;

    grid.innerHTML = `<div class="testi-empty">
      <div class="testi-empty-icon" style="animation:spin 1s linear infinite;display:inline-block">⟳</div>
      <p class="testi-empty-text">Carregando depoimentos...</p></div>`;

    try {
      const dynamic = await fetchTestimonials();
      grid.innerHTML = "";

      const all     = [...dynamic, ...STATIC];
      const visible = isAdminMode ? all : all.filter(t => t.status === "approved");

      if (visible.length === 0) {
        grid.innerHTML = `<div class="testi-empty">
          <div class="testi-empty-icon">💬</div>
          <p class="testi-empty-text">Seja o primeiro a deixar um depoimento!</p></div>`;
        return;
      }

      visible.forEach(t => grid.appendChild(createCard(t)));
      updateAdminBadge(dynamic.filter(t => t.status === "pending").length);

    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="testi-empty">
        <div class="testi-empty-icon">⚠️</div>
        <p class="testi-empty-text">Erro ao carregar. Tente recarregar a página.</p></div>`;
    }
  }

  // ──────────────────────────────────────────────────────
  // AÇÕES ADMIN
  // ──────────────────────────────────────────────────────

  async function handleApprove(id, cardEl) {
    try {
      await approveTestimonial(id);
      cardEl.classList.remove("pending");
      cardEl.querySelector(".admin-btn.approve")?.remove();
      cardEl.style.cssText = "opacity:1;border:none";
      showToastInternal("✔ Depoimento aprovado! Já está visível para todos.");
      const d = await fetchTestimonials();
      updateAdminBadge(d.filter(t => t.status === "pending").length);
    } catch { showToastInternal("⚠ Erro ao aprovar. Tente novamente."); }
  }

  async function handleDelete(id, videoUrl, cardEl) {
    if (!confirm("Deseja excluir este depoimento?")) return;
    cardEl.style.cssText = "transition:opacity .3s,transform .3s;opacity:0;transform:scale(.95)";
    try {
      await deleteTestimonial(id, videoUrl);
      setTimeout(() => renderAll(), 350);
      showToastInternal("🗑 Depoimento excluído.");
    } catch {
      cardEl.style.cssText = "";
      showToastInternal("⚠ Erro ao excluir. Tente novamente.");
    }
  }

  function updateAdminBadge(count) {
    const badge = document.getElementById("adminBadgeCount");
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? "inline-flex" : "none"; }
  }

  // ──────────────────────────────────────────────────────
  // MODAL DE VÍDEO
  // ──────────────────────────────────────────────────────

  function openVideoModal(src) {
    if (!videoModalEl) return;
    const v = videoModalEl.querySelector("video");
    v.src = src; v.play();
    videoModalEl.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    if (!videoModalEl) return;
    const v = videoModalEl.querySelector("video");
    v.pause(); v.src = "";
    videoModalEl.classList.remove("open");
    document.body.style.overflow = "";
  }

  // ──────────────────────────────────────────────────────
  // FORMULÁRIO
  // ──────────────────────────────────────────────────────

  function validateForm() {
    const name = document.getElementById("testiName")?.value.trim();
    const text = document.getElementById("testiText")?.value.trim();
    const errors = {}; let valid = true;

    if (!name)                              { errors.name = "Por favor, informe seu nome."; valid = false; }
    else if (name.length > CONFIG.MAX_NAME_LENGTH) { errors.name = `Máx. ${CONFIG.MAX_NAME_LENGTH} caracteres.`; valid = false; }
    if (!text)                              { errors.text = "Por favor, escreva seu depoimento."; valid = false; }
    else if (text.length < 20)             { errors.text = "Mínimo 20 caracteres."; valid = false; }
    else if (text.length > CONFIG.MAX_TEXT_LENGTH) { errors.text = `Máx. ${CONFIG.MAX_TEXT_LENGTH} caracteres.`; valid = false; }
    if (selectedStars === 0)               { errors.stars = "Selecione pelo menos 1 estrela."; valid = false; }

    return { valid, errors };
  }

  function showErrors({ stars, name, text }) {
    document.querySelectorAll(".field-error").forEach(el => { el.textContent=""; el.classList.remove("show"); });
    document.querySelectorAll(".testi-form-group input,.testi-form-group textarea").forEach(el => el.classList.remove("error"));
    if (name)  showFieldError("testiName", name);
    if (text)  showFieldError("testiText", text);
    if (stars) { const el = document.getElementById("starError"); if(el){ el.textContent=stars; el.classList.add("show"); } }
  }

  function showFieldError(id, msg) {
    document.getElementById(id)?.classList.add("error");
    const el = document.getElementById(id+"Error");
    if (el) { el.textContent = msg; el.classList.add("show"); }
  }

  function clearFieldError(id) {
    document.getElementById(id)?.classList.remove("error");
    const el = document.getElementById(id+"Error");
    if (el) { el.textContent=""; el.classList.remove("show"); }
  }

  async function handleSubmit() {
    const { valid, errors } = validateForm();
    if (!valid) { showErrors(errors); return; }

    const btn = document.getElementById("testiSubmitBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = `<span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Enviando...`; }

    try {
      const name        = document.getElementById("testiName").value.trim();
      const destination = document.getElementById("testiDestination")?.value.trim() || "";
      const text        = document.getElementById("testiText").value.trim();
      const tempId      = generateId();

      let videoUrl = null;
      if (selectedVideoFile) {
        showToastInternal("🎬 Comprimindo vídeo, aguarde...");
        const compressed = await compressVideo(selectedVideoFile);
        const compMB = (compressed.size / (1024 * 1024)).toFixed(1);
        showToastInternal(`⬆️ Enviando vídeo (${compMB}MB)...`);
        videoUrl = await uploadVideo(compressed, tempId);
      }

      await insertTestimonial({
        name, initials: getInitials(name), destination,
        stars: selectedStars, text, video_url: videoUrl, status: "pending",
      });

      resetForm();
      toggleFormPanel(false);
      await renderAll();
      showToastInternal("✔ Depoimento enviado! Será publicado após análise. Obrigado!");
      setTimeout(() => document.getElementById("depoimentos")?.scrollIntoView({ behavior:"smooth", block:"start" }), 400);

    } catch (err) {
      console.error(err);
      showToastInternal("⚠ Erro ao enviar. Verifique sua conexão e tente novamente.");
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `✈ Enviar depoimento`; }
    }
  }

  function resetForm() {
    ["testiName","testiText","testiDestination"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
    selectedStars = 0; selectedVideoFile = null;
    document.querySelectorAll('.star-selector input[type="radio"]').forEach(r => r.checked = false);
    const vi = document.getElementById("testiVideo"); if(vi) vi.value="";
    document.getElementById("videoFileInfo")?.classList.remove("show");
    document.querySelector(".video-upload-area")?.classList.remove("has-file");
    document.querySelectorAll(".field-error").forEach(el => el.classList.remove("show"));
    document.querySelectorAll(".testi-form-group input,.testi-form-group textarea").forEach(el => el.classList.remove("error"));
    const counter = document.getElementById("textCounter");
    if (counter) { counter.textContent = `0 / ${CONFIG.MAX_TEXT_LENGTH}`; counter.className = "char-counter"; }
  }

  function toggleFormPanel(force) {
    const panel = document.getElementById("testiFormPanel");
    const btn   = document.getElementById("testiAddBtn");
    if (!panel) return;
    const open = force !== undefined ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    btn?.classList.toggle("open", open);
    if (open) setTimeout(() => document.getElementById("testiName")?.focus(), 400);
  }

  // ──────────────────────────────────────────────────────
  // MODO ADMIN
  // ──────────────────────────────────────────────────────

  async function loginAdmin() {
    const email = prompt("E-mail do administrador do Supabase:");
    if (!email) return;
    const password = prompt("Senha da conta administradora:");
    if (!password) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        showToastInternal("Não foi possível entrar. Verifique o e-mail e a senha.");
        return;
      }
      adminAccessToken = data.access_token;
      enableAdminMode();
    } catch (error) {
      showToastInternal("Falha de ligação ao Supabase. Tente novamente.");
    }
  }

  function enableAdminMode() {
    isAdminMode = true;
    document.body.classList.add("admin-mode");
    renderAll();
    document.getElementById("adminPanel")?.scrollIntoView({ behavior:"smooth" });
    showToastInternal("🔑 Modo admin ativado. Você pode aprovar e excluir depoimentos.");
  }

  function disableAdminMode() {
    isAdminMode = false;
    adminAccessToken = null;
    document.body.classList.remove("admin-mode");
    renderAll();
    showToastInternal("Modo admin desativado.");
  }

  // ──────────────────────────────────────────────────────
  // TOAST
  // ──────────────────────────────────────────────────────

  function showToastInternal(msg) {
    if (typeof showToast === "function") { showToast(msg); return; }
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 4000);
  }

  // ──────────────────────────────────────────────────────
  // INJEÇÃO DO HTML
  // ──────────────────────────────────────────────────────

  function injectHTML() {
    const section = document.getElementById("depoimentos");
    if (!section) return;

    section.innerHTML = `
      <div class="admin-panel" id="adminPanel">
        <div class="admin-panel-label">Modo Admin
          <span class="admin-badge-count" id="adminBadgeCount" style="display:none">0</span>
        </div>
        <button class="admin-exit-btn" id="adminExitBtn">✕ Sair do modo admin</button>
      </div>

      <div class="testi-header reveal">
        <div class="section-label">Depoimentos</div>
        <h2 class="section-title">O que nossos <span>clientes dizem</span></h2>
        <p class="section-sub">Histórias reais de quem confiou na Kumbuka Travel para realizar suas viagens dos sonhos.</p>
        <button class="testi-add-btn" id="testiAddBtn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Deixar meu depoimento
        </button>
      </div>

      <div class="testi-form-panel" id="testiFormPanel">
        <div class="testi-form-inner">
          <h3 class="testi-form-title">Compartilhe sua experiência ✈</h3>
          <p class="testi-form-subtitle">Sua opinião ajuda outros viajantes a conhecerem a Kumbuka Travel.</p>

          <span class="star-selector-label">Sua avaliação *</span>
          <div class="star-selector">
            <input type="radio" id="star5" name="stars" value="5"><label for="star5">★</label>
            <input type="radio" id="star4" name="stars" value="4"><label for="star4">★</label>
            <input type="radio" id="star3" name="stars" value="3"><label for="star3">★</label>
            <input type="radio" id="star2" name="stars" value="2"><label for="star2">★</label>
            <input type="radio" id="star1" name="stars" value="1"><label for="star1">★</label>
          </div>
          <span class="field-error" id="starError"></span>

          <div class="testi-form-row">
            <div class="testi-form-group">
              <label for="testiName">Seu nome *</label>
              <input type="text" id="testiName" placeholder="Ex: Maria Silva" maxlength="${CONFIG.MAX_NAME_LENGTH}" autocomplete="name"/>
              <span class="field-error" id="testiNameError"></span>
            </div>
            <div class="testi-form-group">
              <label for="testiDestination">Destino visitado</label>
              <input type="text" id="testiDestination" placeholder="Ex: Lisboa, Portugal" maxlength="80"/>
            </div>
          </div>

          <div class="testi-form-group">
            <label for="testiText">Seu depoimento *</label>
            <textarea id="testiText" rows="4" placeholder="Conte como foi sua experiência com a Kumbuka Travel..." maxlength="${CONFIG.MAX_TEXT_LENGTH}"></textarea>
            <span class="field-error" id="testiTextError"></span>
            <div class="char-counter" id="textCounter">0 / ${CONFIG.MAX_TEXT_LENGTH}</div>
          </div>

          <div class="testi-form-group">
            <label>Vídeo depoimento <span style="font-weight:400;text-transform:none;color:var(--gray)">(opcional)</span></label>
            <div class="video-upload-area" id="videoUploadArea">
              <span class="video-upload-icon">🎥</span>
              <p class="video-upload-text">Clique ou arraste um vídeo aqui</p>
              <p class="video-upload-hint">MP4, WebM ou MOV — máx. ${CONFIG.MAX_VIDEO_SIZE_MB}MB · Comprimido automaticamente para 1080p</p>
              <input type="file" id="testiVideo" accept="${CONFIG.ALLOWED_VIDEO_TYPES.join(",")}"/>
            </div>
            <div class="video-file-info" id="videoFileInfo">
              <span>🎬</span>
              <span class="video-file-name" id="videoFileName">—</span>
              <button class="video-file-remove" id="videoRemoveBtn">✕</button>
            </div>
            <span class="field-error" id="testiVideoError"></span>
          </div>

          <button class="testi-submit-btn" id="testiSubmitBtn">✈ Enviar depoimento</button>

          <div class="moderation-notice">
            <span class="moderation-notice-icon">🔍</span>
            <p class="moderation-notice-text">
              <strong>Seu depoimento será revisado</strong> pela nossa equipe antes de ser publicado.
            </p>
          </div>
        </div>
      </div>

      <div class="testi-divider">Depoimentos publicados</div>
      <div class="testi-grid" id="testiGrid"></div>

      <div class="video-modal-overlay" id="videoModal">
        <div class="video-modal-content">
          <button class="video-modal-close" id="videoModalClose">✕</button>
          <video controls></video>
        </div>
      </div>`;
  }

  // ──────────────────────────────────────────────────────
  // INICIALIZAÇÃO
  // ──────────────────────────────────────────────────────

  async function init() {
    injectHTML();
    await renderAll();
    videoModalEl = document.getElementById("videoModal");

    document.getElementById("testiAddBtn")?.addEventListener("click", () => toggleFormPanel());

    document.querySelectorAll('.star-selector input[type="radio"]').forEach(r => {
      r.addEventListener("change", () => {
        selectedStars = parseInt(r.value, 10);
        document.getElementById("starError")?.classList.remove("show");
      });
    });

    document.getElementById("testiText")?.addEventListener("input", e => {
      const len = e.target.value.length;
      const c   = document.getElementById("textCounter");
      if (!c) return;
      c.textContent = `${len} / ${CONFIG.MAX_TEXT_LENGTH}`;
      c.className   = "char-counter";
      if (len > CONFIG.MAX_TEXT_LENGTH * 0.8 ) c.classList.add("warning");
      if (len > CONFIG.MAX_TEXT_LENGTH * 0.95) c.classList.add("danger");
      clearFieldError("testiText");
    });

    document.getElementById("testiName")?.addEventListener("input", () => clearFieldError("testiName"));

    document.getElementById("testiVideo")?.addEventListener("change", e => {
      const file  = e.target.files?.[0];
      const errEl = document.getElementById("testiVideoError");
      if (!file) { selectedVideoFile = null; return; }
      if (!CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type)) {
        if (errEl) { errEl.textContent = "Formato inválido. Use MP4, WebM ou MOV."; errEl.classList.add("show"); }
        e.target.value = ""; selectedVideoFile = null; return;
      }
      if (file.size / (1024*1024) > CONFIG.MAX_VIDEO_SIZE_MB) {
        if (errEl) { errEl.textContent = `Arquivo muito grande. Máx: ${CONFIG.MAX_VIDEO_SIZE_MB}MB.`; errEl.classList.add("show"); }
        e.target.value = ""; selectedVideoFile = null; return;
      }
      if (errEl) errEl.classList.remove("show");
      selectedVideoFile = file;
      document.getElementById("videoFileInfo")?.classList.add("show");
      const fn = document.getElementById("videoFileName");
      if (fn) fn.textContent = file.name;
      document.querySelector(".video-upload-area")?.classList.add("has-file");
    });

    document.getElementById("videoRemoveBtn")?.addEventListener("click", () => {
      selectedVideoFile = null;
      const vi = document.getElementById("testiVideo"); if(vi) vi.value="";
      document.getElementById("videoFileInfo")?.classList.remove("show");
      document.querySelector(".video-upload-area")?.classList.remove("has-file");
    });

    const uploadArea = document.getElementById("videoUploadArea");
    if (uploadArea) {
      uploadArea.addEventListener("dragover",  e => { e.preventDefault(); uploadArea.style.borderColor="var(--gold)"; });
      uploadArea.addEventListener("dragleave", () => { uploadArea.style.borderColor=""; });
      uploadArea.addEventListener("drop", e => {
        e.preventDefault(); uploadArea.style.borderColor="";
        const file = e.dataTransfer.files?.[0];
        if (file) {
          const dt = new DataTransfer(); dt.items.add(file);
          const input = document.getElementById("testiVideo");
          if (input) { input.files = dt.files; input.dispatchEvent(new Event("change")); }
        }
      });
    }

    document.getElementById("testiSubmitBtn")  ?.addEventListener("click", handleSubmit);
    document.getElementById("videoModalClose") ?.addEventListener("click", closeVideoModal);
    document.getElementById("adminExitBtn")    ?.addEventListener("click", disableAdminMode);
    videoModalEl?.addEventListener("click", e => { if (e.target === videoModalEl) closeVideoModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeVideoModal(); });

    // Atalho Ctrl + Shift + A: autenticação através do Supabase Auth.
    document.addEventListener("keydown", e => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (!isAdminMode) loginAdmin();
        else disableAdminMode();
      }
    });

    // Reinicia IntersectionObserver para elementos injectados
    setTimeout(() => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
        { threshold: 0.12 }
      );
      document.querySelectorAll("#depoimentos .reveal").forEach(el => obs.observe(el));
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

// Spinner CSS
const s = document.createElement("style");
s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(s);