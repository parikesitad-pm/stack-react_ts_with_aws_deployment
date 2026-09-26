import { ArrowUpRight, GitFork, Globe } from 'lucide-react';

export type ProjectStatus = 'live' | 'under-reconstruction';

export interface ModulaProject {
  name: string;
  repoUrl: string;
  liveUrl?: string;
  status: ProjectStatus;
  isCurrentSystem?: boolean;
}

export const MODULA_PROJECTS: ModulaProject[] = [
  {
    name: 'STACK',
    repoUrl:
      'https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment.git',
    liveUrl: 'https://stack-md.online',
    status: 'live',
    isCurrentSystem: true,
  },
  {
    name: 'Smart Auto Failover',
    repoUrl: 'https://github.com/parikesitad-pm/smart_auto_failover',
    liveUrl: 'https://dist-jade-seven-59.vercel.app',
    status: 'live',
  },
  {
    name: 'Landing Page (React TS)',
    repoUrl: 'https://github.com/parikesitad-pm/landingpage_sena_reactts',
    liveUrl: 'https://luca-senna.vercel.app',
    status: 'live',
  },
  {
    name: 'forge',
    repoUrl: 'https://github.com/parikesitad-pm/forge',
    status: 'under-reconstruction',
  },
  {
    name: 'POINT',
    repoUrl:
      'https://github.com/parikesitad-pm/point_by_modula_project_frontend',
    status: 'under-reconstruction',
  },
];

export function ModulaProjectRegistry() {
  // Sort projects: 'live' first, then 'under-reconstruction', preserving source order within group
  const sortedProjects = [...MODULA_PROJECTS].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'live' ? -1 : 1;
  });

  const totalCount = MODULA_PROJECTS.length;
  const liveCount = MODULA_PROJECTS.filter((p) => p.status === 'live').length;
  const reconstructionCount = MODULA_PROJECTS.filter(
    (p) => p.status === 'under-reconstruction'
  ).length;

  return (
    <section className="font-mono text-stack-bone w-full">
      {/* Registry Avionics Header */}
      <header className="border-b border-stack-metal pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stack-steel uppercase">
            <span>MODULA PROJECT</span>
            <span className="text-stack-metal">/</span>
            <span>PROJECT REGISTRY</span>
            <span className="text-stack-metal">/</span>
            <span className="text-stack-silver">2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stack-bone">
            Independent systems. Shared engineering principles.
          </h1>

          <p className="text-xs sm:text-sm text-stack-steel max-w-2xl mt-1">
            An index of production utilities, workspace engines, and system
            toolchains engineered under the Modula umbrella.
          </p>
        </div>

        {/* Telemetry Counter Strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-stack-metal/60">
          <div className="border border-stack-metal/70 bg-stack-surface/60 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-stack-steel">
              TOTAL PROJECTS
            </div>
            <div className="mt-1 text-2xl font-bold text-stack-bone tabular-nums">
              {String(totalCount).padStart(2, '0')}
            </div>
          </div>

          <div className="border border-stack-metal/70 bg-stack-surface/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stack-steel">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-[pulse_2s_ease-out_1]"
                aria-hidden="true"
              />
              <span>LIVE</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-stack-bone tabular-nums">
              {String(liveCount).padStart(2, '0')}
            </div>
          </div>

          <div className="border border-stack-metal/70 bg-stack-surface/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stack-steel">
              <span
                className="w-1.5 h-1.5 rounded-full bg-stack-steel"
                aria-hidden="true"
              />
              <span>UNDER RECONSTRUCTION</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-stack-silver tabular-nums">
              {String(reconstructionCount).padStart(2, '0')}
            </div>
          </div>
        </div>
      </header>

      {/* Roster Manifest Column Header (Desktop & Tablet) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 text-[11px] font-semibold tracking-wider text-stack-steel uppercase border-b border-stack-metal/80 bg-stack-surface/40 mt-6">
        <div className="col-span-1">SEQ</div>
        <div className="col-span-4">SYSTEM</div>
        <div className="col-span-3">STATUS</div>
        <div className="col-span-4 text-right">OPERATIONAL LINKS</div>
      </div>

      {/* Mission Roster Rows */}
      <div className="divide-y divide-stack-metal/70 border-b border-stack-metal/70">
        {sortedProjects.map((project, idx) => {
          const isLive = project.status === 'live';
          const sequenceNumber = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={project.name}
              className={`px-4 py-5 md:py-4 transition-colors ${
                isLive
                  ? 'hover:bg-stack-surface/50 text-stack-bone'
                  : 'hover:bg-stack-surface/30 text-stack-silver'
              }`}
            >
              {/* Desktop / Tablet Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 items-center text-xs">
                {/* Sequence */}
                <div className="col-span-1 font-mono text-stack-steel tabular-nums text-xs">
                  {sequenceNumber}
                </div>

                {/* System Name + Current Badge */}
                <div className="col-span-4 flex items-center gap-2.5">
                  <span
                    className={`font-semibold tracking-tight text-sm ${
                      isLive ? 'text-stack-bone' : 'text-stack-silver'
                    }`}
                  >
                    {project.name}
                  </span>
                  {project.isCurrentSystem && (
                    <span className="inline-flex items-center px-1.5 py-0.5 border border-stack-metal text-[10px] font-mono uppercase tracking-wider text-stack-steel bg-stack-surface">
                      CURRENT SYSTEM
                    </span>
                  )}
                </div>

                {/* Status Lamp + Text */}
                <div className="col-span-3 flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive
                        ? 'bg-emerald-400 motion-safe:animate-[pulse_2s_ease-out_1]'
                        : 'bg-stack-steel/50'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[11px] uppercase tracking-wider font-medium ${
                      isLive ? 'text-stack-bone' : 'text-stack-steel'
                    }`}
                  >
                    {isLive ? 'LIVE' : 'UNDER RECONSTRUCTION'}
                  </span>
                </div>

                {/* Action Links */}
                <div className="col-span-4 flex items-center justify-end gap-5">
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Repository for ${project.name} on GitHub`}
                    className="group inline-flex items-center gap-1.5 text-xs text-stack-silver hover:text-stack-bone transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-red-slate px-1 py-0.5"
                  >
                    <GitFork
                      className="w-3.5 h-3.5 text-stack-steel group-hover:text-stack-silver transition-colors"
                      aria-hidden="true"
                    />
                    <span>Repository</span>
                    <ArrowUpRight
                      className="w-3 h-3 text-stack-steel group-hover:text-stack-bone group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </a>

                  {isLive && project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open deployment for ${project.name}`}
                      className="group inline-flex items-center gap-1.5 text-xs text-stack-bone hover:text-stack-bone transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-red-slate border border-stack-metal/80 hover:border-stack-steel bg-stack-surface px-2.5 py-1"
                    >
                      <Globe
                        className="w-3.5 h-3.5 text-stack-silver group-hover:text-stack-bone transition-colors"
                        aria-hidden="true"
                      />
                      <span>Open deployment</span>
                      <ArrowUpRight
                        className="w-3 h-3 text-stack-silver group-hover:text-stack-bone group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                </div>
              </div>

              {/* Mobile View (390px - 767px) - Strict Stacked Technical Row, No Generic Cards */}
              <div className="md:hidden flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-stack-steel tabular-nums">
                      {sequenceNumber}
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        isLive ? 'text-stack-bone' : 'text-stack-silver'
                      }`}
                    >
                      {project.name}
                    </span>
                  </div>

                  {project.isCurrentSystem && (
                    <span className="inline-flex items-center px-1.5 py-0.5 border border-stack-metal text-[9px] font-mono uppercase tracking-wider text-stack-steel bg-stack-surface">
                      CURRENT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-stack-metal/30">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive
                        ? 'bg-emerald-400 motion-safe:animate-[pulse_2s_ease-out_1]'
                        : 'bg-stack-steel/50'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[10px] uppercase tracking-wider font-medium ${
                      isLive ? 'text-stack-bone' : 'text-stack-steel'
                    }`}
                  >
                    {isLive ? 'LIVE' : 'UNDER RECONSTRUCTION'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Repository for ${project.name} on GitHub`}
                    className="group inline-flex items-center gap-1.5 text-xs text-stack-silver hover:text-stack-bone transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-red-slate"
                  >
                    <GitFork className="w-3.5 h-3.5 text-stack-steel" />
                    <span>Repository</span>
                    <ArrowUpRight className="w-3 h-3 text-stack-steel group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>

                  {isLive && project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open deployment for ${project.name}`}
                      className="group inline-flex items-center gap-1.5 text-xs text-stack-bone border border-stack-metal bg-stack-surface px-2 py-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-red-slate ml-auto"
                    >
                      <Globe className="w-3 h-3 text-stack-silver" />
                      <span>Open deployment</span>
                      <ArrowUpRight className="w-3 h-3 text-stack-silver group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
