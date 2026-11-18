// Página de entrada, no browser: apresenta o projeto e ensina a instalar a app.
// O calendário (/calendario) só abre na app instalada.
import { InstallButton } from "@/app/components/InstallButton";
import { INSTALLED_CHECK } from "@/lib/device";

// Corre antes de a página aparecer:
// - na app instalada (por exemplo, instalada quando a app ainda abria em "/"), vai
//   logo para o calendário, sem mostrar esta página;
// - guarda o pedido de instalação do browser, que pode chegar antes do React.
const EARLY_SCRIPT = `
if (${INSTALLED_CHECK}) location.replace("/calendario" + location.search);
addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__installPrompt = e; });
`;

const FEATURES = [
  {
    title: "Todos os testes",
    text: "Testes, entregas e apresentações do 1º, 2º e 3º ano de LCC, e os eventos do NECC.",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  {
    title: "Só as tuas cadeiras",
    text: "Filtra por ano ou por UC e vê apenas o que te interessa.",
    icon: "M3 5h18M6 12h12M10 19h4",
  },
  {
    title: "Avisos antes dos testes",
    text: "Dá estrela a um teste e recebe uma notificação na semana antes, até ao próprio dia.",
    icon: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  },
  {
    title: "Funciona sem internet",
    text: "Depois de aberta uma vez, as datas ficam guardadas no telemóvel.",
    icon: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  },
];

export default function Home() {
  return (
    // O resto da app nunca faz scroll (ver globals.css), mas esta página sim.
    <main className="h-dvh overflow-y-auto">
      <script dangerouslySetInnerHTML={{ __html: EARLY_SCRIPT }} />

      <div className="mx-auto max-w-2xl px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/necc-icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
          <span className="font-bold text-lg">NECC Calendário</span>
        </header>

        <section className="pt-14 pb-12 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/necc-icon-512.png"
            alt=""
            className="w-28 h-28 rounded-[1.75rem] shadow-xl shadow-accent/20 mb-8"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
            Os teus testes de LCC, sempre à mão.
          </h1>
          <p className="mt-4 text-base opacity-70 max-w-md text-pretty">
            O calendário de testes e entregas de Ciências da Computação, feito pelo NECC.
            Instala a app no telemóvel para o abrir e receber avisos.
          </p>
          <div className="mt-8 w-full max-w-sm flex justify-center">
            <InstallButton />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 rounded-2xl border border-border">
              <svg
                className="w-6 h-6 text-accent mb-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={f.icon} />
              </svg>
              <h2 className="font-bold">{f.title}</h2>
              <p className="mt-1 text-sm opacity-70">{f.text}</p>
            </div>
          ))}
        </section>

        <footer className="mt-12 text-center text-xs opacity-50">
          Feito pelo NECC · Universidade do Minho
        </footer>
      </div>
    </main>
  );
}
