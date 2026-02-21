import Head from 'next/head';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { PROJECT_REGISTRY } from '../lib/projects/registry';
import type { ProjectDefinition } from '../lib/projects/registry';
import { useTheme } from '../lib/useTheme';

function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <Link
      href={`/${project.slug}`}
      className="group block bg-cw-bg-1 border border-cw-border rounded-[10px] p-6 hover:border-cw-accent transition-all duration-200 hover:shadow-[0_0_30px_rgba(29,111,232,0.12)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <h2 className="text-[22px] font-extrabold tracking-[0.04em]" style={{ color: project.color }}>
          {project.name}
        </h2>
        <span className="font-mono text-[12px] text-cw-text-2 tracking-[0.05em]">
          {project.version}
        </span>
      </div>
      <p className="text-[14px] text-cw-text-1 leading-relaxed mb-4">
        {project.description}
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-cw-text-2">
          {Object.keys(project.paramMeta).length} parametrů
        </span>
        <span className="text-cw-text-2">·</span>
        <span className="font-mono text-[12px] text-cw-text-2">
          {project.presetCities.length} presetů
        </span>
      </div>
      <div className="mt-4 text-[13px] font-semibold text-cw-accent group-hover:text-cw-accent-hi transition-colors">
        Otevřít kalkulátor →
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const projects = Object.values(PROJECT_REGISTRY);

  return (
    <>
      <Head>
        <title>Cenové modely — Výběr projektu</title>
        <meta name="description" content="Výběr cenového modelu pro správu silniční infrastruktury" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-cw-bg-0 text-cw-text-0 antialiased">
        {/* Header */}
        <header className="h-[58px] bg-cw-bg-1 border-b border-cw-border flex items-center px-4 md:px-6">
          <span className="text-[19px] font-extrabold tracking-[0.06em] text-cw-text-0">
            CENOVÉ MODELY
          </span>
          <div className="flex-1" />
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-[6px] text-cw-text-2 hover:text-cw-text-0 hover:bg-cw-bg-2 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <h1 className="text-[13px] font-bold tracking-[0.12em] uppercase text-cw-text-2 mb-6">
            Vyberte projekt
          </h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
