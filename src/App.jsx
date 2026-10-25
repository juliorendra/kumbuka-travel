import { useEffect, useState } from "react";
import {
  Plane,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Hotel,
  ShieldCheck,
  MapPin,
  Clock3,
  Mail,
  MessageCircle,
  Compass,
  Globe2,
  HeartHandshake,
  Send,
  CheckCircle2,
  Instagram,
  Facebook,
  LogIn,
  UserPlus,
  X as CloseIcon,
  Users,
  Building2,
} from "lucide-react";

const services = [
  {
    icon: Plane,
    title: "Passagens aéreas",
    text: "Encontre opções de voos nacionais e internacionais para a sua próxima viagem.",
  },
  {
    icon: FileText,
    title: "Assessoria para vistos",
    text: "Orientação durante as etapas da solicitação de visto e preparação dos documentos.",
  },
  {
    icon: Hotel,
    title: "Reserva de hotéis",
    text: "Ajuda para encontrar hospedagens que combinem com o seu destino e orçamento.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro viagem",
    text: "Conheça opções de proteção para viajar com mais tranquilidade.",
  },
  {
    icon: CheckCircle2,
    title: "Documentação",
    text: "Organização e orientação sobre os documentos necessários para viajar.",
  },
];
const destinations = [
  {
    name: "Paris",
    country: "França",
    region: "Europa",
    tagline: "Arte, cultura e bons momentos",
    image: "photo-1431274172761-fca41d930114",
  },
  {
    name: "Dubai",
    country: "Emirados Árabes",
    region: "Oriente Médio",
    tagline: "Arquitetura e experiências únicas",
    image: "photo-1512453979798-5ea266f8880c",
  },
  {
    name: "Tóquio",
    country: "Japão",
    region: "Ásia",
    tagline: "Tradição e futuro lado a lado",
    image: "photo-1540959733332-eab4deabeeaf",
  },
  {
    name: "Nova York",
    country: "Estados Unidos",
    region: "América do Norte",
    tagline: "Uma cidade cheia de possibilidades",
    image: "photo-1496588152823-86ff7695e68f",
  },
  {
    name: "Sydney",
    country: "Austrália",
    region: "Oceania",
    tagline: "Praias, cultura e natureza",
    image: "photo-1506973035872-a4ec16b8e8d9",
  },
  {
    name: "Marrakech",
    country: "Marrocos",
    region: "África",
    tagline: "Cores, mercados e história",
    image: "photo-1489749798305-4fea3ae63d43",
  },
];
const whatsapp =
  "https://wa.me/5511983171592?text=" +
  encodeURIComponent(
    "Olá! Gostaria de planear uma viagem com a Kumbuka Travel.",
  );

function AccessDialog({ mode, onClose }) {
  if (!mode) return null;
  const isLogin = mode === "login";
  const title = isLogin ? "Entrar na Kumbuka Travel" : "Criar a sua conta";
  const action = isLogin ? "Entrar como" : "Registar como";
  const options = isLogin
    ? [
        {
          label: "Cliente",
          detail: "Acompanhe os seus pedidos e documentos",
          href: "https://kumbuka-travel-app.netlify.app/login",
          Icon: Users,
        },
        {
          label: "Parceiro",
          detail: "Aceda à área da sua empresa",
          href: "https://kumbuka-travel-app.netlify.app/parceiro/login",
          Icon: Building2,
        },
      ]
    : [
        {
          label: "Cliente",
          detail: "Crie uma conta para gerir as suas viagens",
          href: "https://kumbuka-travel-app.netlify.app/cadastro",
          Icon: Users,
        },
        {
          label: "Parceiro",
          detail: "Registe a sua empresa na plataforma",
          href: "https://kumbuka-travel-app.netlify.app/parceiro/cadastro",
          Icon: Building2,
        },
      ];
  return (
    <div
      className="access-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="access-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-title"
      >
        <button className="access-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={20} />
        </button>
        <span className="access-kicker">Kumbuka Travel</span>
        <h2 id="access-title">{title}</h2>
        <p>Escolha o tipo de acesso para continuar.</p>
        <div className="access-options">
          {options.map(({ label, detail, href, Icon }) => (
            <a className="access-option" href={href} key={label}>
              <span className="access-option-icon">
                <Icon size={22} />
              </span>
              <span className="access-option-copy">
                <b>
                  {action} {label.toLowerCase()}
                </b>
                <small>{detail}</small>
              </span>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [accessMode, setAccessMode] = useState(null);
  useEffect(() => {
    const onScroll = () =>
      document
        .getElementById("navbar")
        ?.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    ["Sobre", "#sobre"],
    ["Serviços", "#servicos"],
    ["Destinos", "#destinos"],
    ["Depoimentos", "#depoimentos"],
  ];
  return (
    <header className="site-header" id="navbar">
      <a href="#hero" className="brand">
        <img src="/img/logo.png" alt="Kumbuka Travel" />
        <span className="new-cor">
          Kumbuka  <b> Travel</b>
        </span>
      </a>
      <nav className="desktop-nav">
        {links.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
        <button
          className="nav-access nav-login"
          onClick={() => setAccessMode("login")}
        >
          <LogIn size={15} /> Login
        </button>
        <button
          className="nav-access nav-register"
          onClick={() => setAccessMode("register")}
        >
          <UserPlus size={15} /> Registar
        </button>
        <a className="nav-contact" href="#contato">
          Fale connosco <ArrowUpRight size={16} />
        </a>
      </nav>
      <button
        className="menu-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav className="mobile-nav">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <button
            onClick={() => {
              setAccessMode("login");
              setOpen(false);
            }}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            onClick={() => {
              setAccessMode("register");
              setOpen(false);
            }}
          >
            <UserPlus size={16} /> Registar
          </button>
          <a href="#contato" onClick={() => setOpen(false)}>
            Fale connosco <ArrowRight size={16} />
          </a>
        </nav>
      )}
      <AccessDialog mode={accessMode} onClose={() => setAccessMode(null)} />
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-image" aria-hidden="true" />
      <div className="hero-shade" />
      <div className="hero-inner">
        <div className="eyebrow eyebrow-light">
          <span /> Viagens pensadas para si
        </div>
        <h1>
          O mundo é grande.
          <br />
          <em>Vamos descobri-lo.</em>
        </h1>
        <p>
          Da passagem aérea à documentação, ajudamos a organizar a sua viagem
          com clareza, cuidado e atenção a cada detalhe.
        </p>
        <div className="hero-actions">
          <a className="button button-gold" href="#contato">
            Planear viagem <ArrowRight size={17} />
          </a>
          <a className="button button-ghost" href="#destinos">
            Explorar destinos
          </a>
        </div>
        <div className="hero-proof">
          <span>
            <CheckCircle2 size={16} /> Apoio em cada etapa
          </span>
          <span>
            <Globe2 size={16} /> Destinos pelo mundo
          </span>
        </div>
      </div>
      <a href="#servicos" className="hero-scroll">
        Descubra os nossos serviços <ArrowRight size={15} />
      </a>
    </section>
  );
}

function SectionHeading({ eyebrow, title, accent, text, light = false }) {
  return (
    <div className={`section-heading ${light ? "heading-light" : ""}`}>
      <span className="eyebrow">
        <i />
        {eyebrow}
      </span>
      <h2>
        {title} <em>{accent}</em>
      </h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function Services() {
  return (
    <section className="section services-section" id="servicos">
      <div className="container">
        <SectionHeading
          eyebrow="Como podemos ajudar"
          title="Tudo para uma viagem"
          accent="mais tranquila"
          text="Conte connosco para organizar os detalhes importantes, desde a preparação até à partida."
        />
        <div className="services-grid">
          {services.map(({ icon: Icon, title, text }, i) => (
            <article className="service-card" key={title}>
              <span className="service-icon">
                <Icon size={23} strokeWidth={1.7} />
              </span>
              <span className="service-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="#contato" aria-label={`Consultar ${title}`}>
                <ArrowUpRight size={18} />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Destinations() {
  return (
    <section className="section destinations-section" id="destinos">
      <div className="container">
        <div className="destinations-heading">
          <SectionHeading
            eyebrow="Inspire-se"
            title="Há um mundo"
            accent="à sua espera"
            text="Descubra alguns destinos que podem ser o começo da sua próxima história."
          />
          <a className="text-link" href="#contato">
            Falar com a equipa <ArrowRight size={17} />
          </a>
        </div>
        <div className="destinations-grid">
          {destinations.map((d, i) => (
            <a
              href="#contato"
              className={`destination-card destination-${i + 1}`}
              key={d.name}
            >
              <img
                loading="lazy"
                src={`https://images.unsplash.com/${d.image}?auto=format&fit=crop&w=1000&q=85`}
                alt={`${d.name}, ${d.country}`}
                onError={(e) => {
                  if (d.name === "Nova York")
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=1000&q=85";
                }}
              />
              <span className="destination-region">{d.region}</span>
              <div className="destination-info">
                <div>
                  <h3>{d.name}</h3>
                  <p>{d.tagline}</p>
                </div>
                <span className="destination-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section about-section" id="sobre">
      <div className="container about-layout">
        <div className="about-visual">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1100&q=85"
            alt="Viajantes a preparar uma viagem"
            loading="lazy"
          />
          <div className="about-note">
            <Compass size={22} />
            <span>
              O próximo destino
              <br />
              <b>começa aqui.</b>
            </span>
          </div>
        </div>
        <div className="about-copy">
          <SectionHeading
            eyebrow="Sobre a Kumbuka"
            title="Mais do que chegar."
            accent="Viver a viagem."
          />
          <p>
            Acreditamos que viajar é abrir espaço para novas experiências,
            pessoas e oportunidades. Por isso, acompanhamos cada cliente com
            atenção e comunicação clara.
          </p>
          <p>
            A nossa equipa ajuda a organizar os detalhes para que possa tomar
            decisões com mais confiança, desde a escolha do serviço até à
            preparação da partida.
          </p>
          <div className="about-values">
            <div>
              <HeartHandshake size={20} />
              <span>
                <b>Acompanhamento próximo</b>
                <small>Apoio humano em cada etapa.</small>
              </span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>
                <b>Informação clara</b>
                <small>Orientação transparente e responsável.</small>
              </span>
            </div>
          </div>
          <a className="button button-dark" href="#contato">
            Conheça os nossos serviços <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    servico: "",
    destino: "",
    mensagem: "",
  });
  const [notice, setNotice] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) {
      setNotice("Preencha o nome e o e-mail para continuar.");
      return;
    }
    const msg = `Olá, gostaria de planear uma viagem com a Kumbuka Travel.\n\nNome: ${form.nome}\nE-mail: ${form.email}\nTelefone: ${form.telefone}\nServiço: ${form.servico}\nDestino: ${form.destino}\n\nMensagem: ${form.mensagem}`;
    window.open(
      `https://wa.me/5511983171592?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setNotice("O WhatsApp foi aberto com os dados da sua solicitação.");
  };
  return (
    <section className="section contact-section" id="contato">
      <div className="container">
        <SectionHeading
          eyebrow="Vamos conversar"
          title="A sua próxima viagem"
          accent="começa aqui."
          text="Conte-nos o que tem em mente. Vamos ajudar a encontrar o melhor caminho."
        />
        <div className="contact-layout">
          <div className="contact-panel">
            <h3>Estamos aqui para ajudar.</h3>
            <p>Escolha a forma de contacto que for mais conveniente para si.</p>
            <a
              href="https://wa.me/5511983171592"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={19} />
              <span>
                <small>WhatsApp</small>
                <b>+55 (11) 98317-1592</b>
              </span>
              <ArrowUpRight size={17} />
            </a>
            <a href="mailto:contato@kumbukatravel.com.br">
              <Mail size={19} />
              <span>
                <small>E-mail</small>
                <b>contato@kumbukatravel.com.br</b>
              </span>
              <ArrowUpRight size={17} />
            </a>
            <div className="contact-detail">
              <MapPin size={18} />
              <span>São Paulo, Brasil</span>
            </div>
            <div className="contact-detail">
              <Clock3 size={18} />
              <span>Seg–Sex: 7h–22h · Sáb–Dom: 9h–20h</span>
            </div>
          </div>
          <form className="contact-form" onSubmit={submit}>
            <div className="form-fields">
              <label>
                Nome completo
                <input
                  name="nome"
                  value={form.nome}
                  onChange={update}
                  placeholder="Como podemos chamar-lhe?"
                  required
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={update}
                  placeholder="nome@exemplo.com"
                  required
                />
              </label>
              <label>
                Telefone
                <input
                  name="telefone"
                  value={form.telefone}
                  onChange={update}
                  placeholder="+258 ..."
                />
              </label>
              <label>
                Serviço
                <select name="servico" value={form.servico} onChange={update}>
                  <option value="">Escolha um serviço</option>
                  <option>Passagem aérea</option>
                  <option>Assessoria para visto</option>
                  <option>Reserva de hotel</option>
                  <option>Seguro viagem</option>
                  <option>Documentação</option>
                  <option>Pacote completo</option>
                </select>
              </label>
              <label className="field-wide">
                Destino desejado
                <input
                  name="destino"
                  value={form.destino}
                  onChange={update}
                  placeholder="Ex.: Lisboa, Portugal"
                />
              </label>
              <label className="field-wide">
                Como podemos ajudar?
                <textarea
                  name="mensagem"
                  value={form.mensagem}
                  onChange={update}
                  rows="4"
                  placeholder="Conte-nos um pouco sobre a viagem que pretende fazer."
                />
              </label>
            </div>
            <button className="button button-dark form-submit" type="submit">
              Enviar solicitação <Send size={16} />
            </button>
            {notice && (
              <p className="form-notice" role="status">
                {notice}
              </p>
            )}
            <small className="privacy-note">
              Os seus dados serão usados apenas para responder ao seu pedido.
            </small>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <a href="#hero" className="brand">
            <img src="/img/logo footer.jpeg" alt="" />
            <span>
              Kumbuka <b>Travel</b>
            </span>
          </a>
          <p>
            Ajudamos a transformar planos de viagem em experiências bem
            organizadas, com cuidado e informação clara.
          </p>
          <a
            className="footer-whatsapp"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={17} /> Fale connosco
          </a>
        </div>
        <div className="footer-links">
          <div>
            <h4>Explore</h4>
            <a href="#sobre">Sobre nós</a>
            <a href="#servicos">Serviços</a>
            <a href="#destinos">Destinos</a>
            <a href="#depoimentos">Depoimentos</a>
          </div>
          <div>
            <h4>Serviços</h4>
            <a href="#servicos">Passagens aéreas</a>
            <a href="#servicos">Assessoria para vistos</a>
            <a href="#servicos">Hotéis e seguro</a>
            <a href="#contato">Contactos</a>
          </div>
          <div className="footer-social">
            <h4>Redes sociais</h4>
            <a
              href="https://www.instagram.com/kumbukatravel?igsh=MWZzZ3V6YTk2Yml4Yw=="
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={17} /> Instagram
            </a>
            <a
              href="https://web.facebook.com/profile.php?id=61589062168257&locale=pt_BR"
              target="_blank"
              rel="noreferrer"
            >
              <Facebook size={17} /> Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Kumbuka Travel. Todos os direitos
          reservados.
        </span>
        <a href="#hero">Voltar ao início ↑</a>
      </div>
    </footer>
  );
}

export default function App() {
  useEffect(() => {
    const node = document.createElement("script");
    node.src = "/depoimentos.js";
    node.defer = true;
    document.body.appendChild(node);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      node.remove();
    };
  }, []);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Destinations />
        <About />
        <section id="depoimentos" className="section testimonials-section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">
                <i /> Histórias de quem viajou
              </span>
              <h2>
                Experiências que <em>ficam na memória.</em>
              </h2>
              <p>Veja os relatos de quem confiou na Kumbuka Travel.</p>
            </div>
          </div>
        </section>
        <section className="cta-strip">
          <div className="container cta-inner">
            <div>
              <span className="eyebrow eyebrow-light">
                <i /> A sua viagem começa com uma conversa
              </span>
              <h2>Tem um destino em mente?</h2>
              <p>Vamos ajudar a planear os próximos passos.</p>
            </div>
            <a className="button button-gold" href="#contato">
              Fale com a equipa <ArrowRight size={17} />
            </a>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
      <a
        className="floating-whatsapp"
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar pelo WhatsApp"
      >
        <MessageCircle size={23} />
      </a>
    </>
  );
}
