import Link from 'next/link'
import styles from './overview.module.css'

const metrics = [
  {
    label: 'Active projects',
    value: '0',
    detail: 'No projects configured',
    icon: 'PR',
  },
  {
    label: 'Locations',
    value: '0',
    detail: 'No locations configured',
    icon: 'LB',
  },
  {
    label: 'Open constraints',
    value: '0',
    detail: 'No constraint data',
    icon: 'CM',
  },
  {
    label: 'Plan reliability',
    value: '—',
    detail: 'No weekly plan data',
    icon: 'PPC',
  },
]

const planningCycle = [
  {
    number: '01',
    title: 'Master Plan',
    description:
      'Define locations, production sequence, milestones, and long-term flow.',
    href: '/dashboard/projetos/masterplan',
  },
  {
    number: '02',
    title: 'Lookahead Planning',
    description:
      'Prepare upcoming work and remove constraints before execution.',
    href: '/dashboard/projetos/lookahead',
  },
  {
    number: '03',
    title: 'Weekly Planning',
    description:
      'Convert ready work into reliable field commitments.',
    href: '/dashboard/projetos/semanal',
  },
  {
    number: '04',
    title: 'Flow Control',
    description:
      'Monitor progress, rhythm, deviations, and production reliability.',
    href: '/dashboard/projetos/matriz-status',
  },
]

const readinessItems = [
  {
    icon: '✓',
    name: 'Secure authentication',
    status: 'Complete',
    statusClass: styles.statusComplete,
  },
  {
    icon: '01',
    name: 'Project structure',
    status: 'Not configured',
    statusClass: styles.statusPlanned,
  },
  {
    icon: '02',
    name: 'Location breakdown structure',
    status: 'Not configured',
    statusClass: styles.statusPlanned,
  },
  {
    icon: '03',
    name: 'Planning workspace',
    status: 'In preparation',
    statusClass: styles.statusProgress,
  },
]

export default function DashboardHome() {
  return (
    <div className={styles.container}>
      <section className={styles.heading}>
        <div className={styles.headingContent}>
          <p className={styles.eyebrow}>
            Production planning workspace
          </p>

          <h2 className={styles.title}>
            Production Overview
          </h2>

          <p className={styles.description}>
            Connect projects, locations, planning horizons,
            constraints, and production performance in one
            operational view.
          </p>
        </div>

        <div className={styles.developmentBadge}>
          <span className={styles.developmentDot} />
          Private development
        </div>
      </section>

      <section
        className={styles.metricsGrid}
        aria-label="Production metrics"
      >
        {metrics.map((metric) => (
          <article
            className={styles.metricCard}
            key={metric.label}
          >
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>
                {metric.label}
              </span>

              <span className={styles.metricIcon}>
                {metric.icon}
              </span>
            </div>

            <p className={styles.metricValue}>
              {metric.value}
            </p>

            <p className={styles.metricDetail}>
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>
              Planning cycle
            </h3>

            <p className={styles.sectionDescription}>
              Move from strategic planning to reliable
              production control.
            </p>
          </div>
        </div>

        <div className={styles.cycleGrid}>
          {planningCycle.map((step) => (
            <Link
              href={step.href}
              className={styles.cycleCard}
              key={step.number}
            >
              <span className={styles.cycleNumber}>
                {step.number}
              </span>

              <h4 className={styles.cycleTitle}>
                {step.title}
              </h4>

              <p className={styles.cycleDescription}>
                {step.description}
              </p>

              <span
                className={styles.cycleArrow}
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>
            Project readiness
          </h3>

          <p className={styles.panelDescription}>
            Complete the project foundation before activating
            the planning cycle.
          </p>

          <div className={styles.progressList}>
            {readinessItems.map((item) => (
              <div
                className={styles.progressItem}
                key={item.name}
              >
                <div className={styles.progressIdentity}>
                  <span className={styles.progressIcon}>
                    {item.icon}
                  </span>

                  <span className={styles.progressName}>
                    {item.name}
                  </span>
                </div>

                <span className={item.statusClass}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article
          className={`${styles.panel} ${styles.startPanel}`}
        >
          <div>
            <h3 className={styles.panelTitle}>
              Start with the project structure.
            </h3>

            <p className={styles.panelDescription}>
              Register the project, define its production
              locations, and prepare the foundation for
              location-based planning.
            </p>
          </div>

          <Link
            href="/dashboard/projetos/coleta"
            className={styles.primaryButton}
          >
            Configure project
          </Link>
        </article>
      </section>
    </div>
  )
}
