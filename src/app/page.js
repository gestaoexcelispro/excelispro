import styles from './landing.module.css'

const workflowSteps = [
  {
    number: '01',
    title: 'Master Plan',
    description:
      'Structure the project by locations, production sequence, milestones, and strategic flow.',
  },
  {
    number: '02',
    title: 'Lookahead Planning',
    description:
      'Identify constraints, prepare upcoming work, and protect production continuity.',
  },
  {
    number: '03',
    title: 'Weekly Planning',
    description:
      'Transform ready work into reliable weekly commitments for field execution.',
  },
  {
    number: '04',
    title: 'Flow Control',
    description:
      'Monitor progress, production rhythm, deviations, and plan reliability.',
  },
]

const capabilities = [
  {
    icon: 'LB',
    title: 'Location Breakdown',
    description:
      'Organize the project around physical locations and production zones.',
  },
  {
    icon: 'FL',
    title: 'Flow-Based Planning',
    description:
      'Connect activities through sequence, continuity, rhythm, and handoffs.',
  },
  {
    icon: 'CM',
    title: 'Constraint Management',
    description:
      'Identify and remove restrictions before they interrupt production.',
  },
  {
    icon: 'WP',
    title: 'Weekly Commitments',
    description:
      'Build executable weekly plans from work that is genuinely ready.',
  },
  {
    icon: 'PC',
    title: 'Planning Control',
    description:
      'Measure PPC, deviations, production stability, and corrective actions.',
  },
  {
    icon: 'BI',
    title: 'Production Intelligence',
    description:
      'Turn planning and field information into actionable management insight.',
  },
]

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.navigation}>
        <div className={styles.navigationInner}>
          <a href="/" className={styles.brand} aria-label="RitsuFlow home">
            <span className={styles.brandMark} aria-hidden="true" />
            <span>RitsuFlow</span>
          </a>

          <nav
            className={styles.navigationLinks}
            aria-label="Primary navigation"
          >
            <a href="#workflow">Workflow</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#platform">Platform</a>
          </nav>

          <div className={styles.navigationActions}>
            <a href="/login" className={styles.secondaryButton}>
              Sign in
            </a>

            <a href="/login" className={styles.primaryButton}>
              Open platform
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Location-based construction planning
            </p>

            <h1>
              Plan by location.
              <br />
              Control by <span>flow.</span>
            </h1>

            <p className={styles.heroDescription}>
              RitsuFlow connects master planning, lookahead preparation,
              weekly commitments, and production control in one integrated
              construction workflow.
            </p>

            <div className={styles.heroActions}>
              <a href="#workflow" className={styles.primaryButton}>
                Explore the workflow
              </a>

              <a href="/login" className={styles.secondaryButton}>
                Access RitsuFlow
              </a>
            </div>

            <p className={styles.heroNote}>
              Built for contractors, planners, and production teams.
            </p>
          </div>

          <div className={styles.preview} id="platform">
            <div className={styles.previewHeader}>
              <p className={styles.previewTitle}>Production Flow Overview</p>
              <span className={styles.previewStatus}>Plan synchronized</span>
            </div>

            <div className={styles.flowPanel}>
              <div className={styles.flowHeading}>
                <span>Locations</span>
                <span>Production sequence</span>
              </div>

              <div className={styles.flowGrid}>
                <div className={styles.flowColumn}>
                  <span className={styles.flowLocation}>ZONE 01</span>
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockTeal}`}
                  />
                  <div className={styles.flowBlock} />
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockLight}`}
                  />
                </div>

                <div className={styles.flowColumn}>
                  <span className={styles.flowLocation}>ZONE 02</span>
                  <div className={styles.flowBlock} />
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockTeal}`}
                  />
                  <div className={styles.flowBlock} />
                </div>

                <div className={styles.flowColumn}>
                  <span className={styles.flowLocation}>ZONE 03</span>
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockLight}`}
                  />
                  <div className={styles.flowBlock} />
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockTeal}`}
                  />
                </div>

                <div className={styles.flowColumn}>
                  <span className={styles.flowLocation}>ZONE 04</span>
                  <div className={styles.flowBlock} />
                  <div
                    className={`${styles.flowBlock} ${styles.flowBlockLight}`}
                  />
                  <div className={styles.flowBlock} />
                </div>
              </div>
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Plan reliability</div>
                <div className={styles.metricValue}>86%</div>
              </div>

              <div className={styles.metric}>
                <div className={styles.metricLabel}>Open constraints</div>
                <div className={styles.metricValue}>12</div>
              </div>

              <div className={styles.metric}>
                <div className={styles.metricLabel}>Flow variance</div>
                <div className={styles.metricValue}>-4%</div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.sectionMuted}`}
          id="workflow"
        >
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                One connected planning system
              </p>

              <h2>
                From long-term strategy to reliable field commitments.
              </h2>

              <p>
                Each planning level prepares the conditions required by the
                next, creating a continuous flow of information and
                production decisions.
              </p>
            </div>

            <div className={styles.workflowGrid}>
              {workflowSteps.map((step) => (
                <article className={styles.workflowCard} key={step.number}>
                  <span className={styles.workflowNumber}>
                    {step.number}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} id="capabilities">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Built around production flow
              </p>

              <h2>
                A construction planning platform designed for execution.
              </h2>

              <p>
                RitsuFlow brings locations, activities, constraints,
                commitments, and performance indicators into the same
                operational environment.
              </p>
            </div>

            <div className={styles.capabilityGrid}>
              {capabilities.map((capability) => (
                <article
                  className={styles.capabilityCard}
                  key={capability.title}
                >
                  <span className={styles.capabilityIcon}>
                    {capability.icon}
                  </span>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <h2>Build a more predictable production system.</h2>

          <p>
            Connect planning horizons, prepare work before execution, and
            control construction flow through locations.
          </p>

          <a href="/login" className={styles.primaryButton}>
            Open RitsuFlow
          </a>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} RitsuFlow. All rights reserved.
        </span>
        <span>Location-based planning and flow control.</span>
      </footer>
    </div>
  )
}
