

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 60);
});

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

function closeMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.remove("open");
  document.body.style.overflow = "";
}


const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 },
);

reveals.forEach((el) => revealObserver.observe(el));

function sendForm() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const servico = document.getElementById("servico").value;
  const destino = document.getElementById("destino").value.trim();
  const mensagem = document.getElementById("mensagem").value.trim();

  if (!nome || !email) {
    showToast("⚠ Por favor, preencha nome e e-mail.");
    return;
  }

  const texto = `Olá, gostaria de planejar uma viagem.

Nome: ${nome}
Email: ${email}
Telefone: ${telefone}
Serviço: ${servico}
Destino: ${destino}

Mensagem:
${mensagem}`;

  const textoFormatado = encodeURIComponent(texto);
  const numero = "5511983171592";

  const url = `https://wa.me/${numero}?text=${textoFormatado}`;

  window.location.href = url;

  document
    .querySelectorAll(
      ".contact-form input, .contact-form select, .contact-form textarea",
    )
    .forEach((el) => (el.value = ""));
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

function goContact() {
  document.getElementById("contato").scrollIntoView({ behavior: "smooth" });
}

const allSections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  let current = "";

  allSections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.id;
    }
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.style.color =
      link.getAttribute("href") === "#" + current ? "var(--gold)" : "";
  });
});


