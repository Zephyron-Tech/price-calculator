import Head from 'next/head';
import Link from 'next/link';
import { Sun, Moon, Lock } from 'lucide-react';
import { PROJECT_REGISTRY } from '../lib/projects/registry';
import type { ProjectDefinition } from '../lib/projects/registry';
import { useTheme } from '../lib/useTheme';
import { useAuth } from '../lib/authContext';

function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <Link
      href={`/${project.slug}`}
      className="group block bg-cw-bg-2 border border-cw-border rounded-[10px] p-6 hover:border-cw-accent transition-all duration-200 hover:shadow-[0_0_30px_rgba(66,53,229,0.14)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}66` }}
        />
        <h2 className="font-display text-[20px] font-bold tracking-[0.04em]" style={{ color: project.color }}>
          {project.name}
        </h2>
        <span className="font-mono text-[11px] text-cw-text-2 tracking-[0.05em] bg-cw-bg-3 border border-cw-border px-1.5 py-0.5 rounded-[4px]">
          {project.version}
        </span>
      </div>
      <p className="text-[15px] font-normal text-cw-text-1 leading-[1.65] mb-4">
        {project.description}
      </p>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[12px] text-cw-text-2">
          {Object.keys(project.paramMeta).length} param.
        </span>
        <span className="text-cw-border">·</span>
        <span className="font-mono text-[12px] text-cw-text-2">
          {project.presetCities.length} presetů
        </span>
      </div>
      <div className="text-[13px] font-semibold text-cw-accent group-hover:text-cw-accent-hi transition-colors flex items-center gap-1.5">
        Otevřít kalkulátor
        <span className="group-hover:translate-x-1 transition-transform duration-150">→</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { lock } = useAuth();
  const projects = Object.values(PROJECT_REGISTRY);

  return (
    <>
      <Head>
        <title>Cenové modely — Zephyron Tech</title>
        <meta name="description" content="Cenové kalkulátory pro projekty ClearWay a DALRIS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-cw-bg-0 text-cw-text-0 antialiased">
        {/* Header — same bg as page to avoid two-tone split */}
        <header className="h-[58px] bg-cw-bg-0 border-b border-cw-border flex items-center px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            {/* <div className="w-2 h-2 rounded-full bg-cw-accent shadow-[0_0_8px_var(--cw-accent)]" /> */}
            <span className="font-display text-[19px] font-bold tracking-[0.08em] text-cw-text-0">
              Zephyron Tech
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-[8px] text-cw-text-2 hover:text-cw-text-0 hover:bg-cw-bg-2 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Světlý motiv' : 'Tmavý motiv'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={lock}
              className="flex items-center justify-center w-9 h-9 rounded-[8px] text-cw-text-2 hover:text-cw-red hover:bg-cw-bg-2 transition-colors cursor-pointer"
              title="Zamknout"
              aria-label="Zamknout aplikaci"
            >
              <Lock size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="mb-8">
            <div className="font-sans text-[13px] font-semibold tracking-[0.18em] uppercase text-cw-accent mb-3">
              Cenové modely
            </div>
            <h1 className="font-display text-[38px] md:text-[48px] tracking-[0.02em] text-cw-text-0 leading-none">
              Vyberte projekt
            </h1>
          </div>
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
