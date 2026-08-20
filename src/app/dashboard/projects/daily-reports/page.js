'use client';

import { useMemo, useState } from 'react';
import styles from './daily-reports.module.css';

const reportRows = [
  {
    id: 'DR-0024',
    date: 'Aug 20, 2026',
    project: 'Smart Center – Thiago Loriggio',
    weather: 'Clear',
    workforce: 18,
    activities: 6,
    status: 'Draft',
  },
  {
    id: 'DR-0023',
    date: 'Aug 19, 2026',
    project: 'Smart Center – Thiago Loriggio',
    weather: 'Clear',
    workforce: 21,
    activities: 7,
    status: 'Submitted',
  },
  {
    id: 'DR-0022',
    date: 'Aug 18, 2026',
    project: 'Smart Center – Thiago Loriggio',
    weather: 'Cloudy',
    workforce: 17,
    activities: 5,
    status: 'Approved',
  },
  {
    id: 'DR-0021',
    date: 'Aug 17, 2026',
    project: 'Smart Center – Thiago Loriggio',
    weather: 'Rain',
    workforce: 14,
    activities: 4,
    status: 'Approved',
  },
];

const statusClassName = (status) => {
  if (status === 'Approved') {
    return styles.statusApproved;
  }

  if (status === 'Submitted') {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
};

export default function DailyReportsPage() {
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return reportRows;
    }

    return reportRows.filter((report) => {
      return (
        report.id.toLowerCase().includes(term) ||
        report.date.toLowerCase().includes(term) ||
        report.project.toLowerCase().includes(term) ||
        report.status.toLowerCase().includes(term)
      );
    });
  }, [search]);

  return (
    <main className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>FIELD MANAGEMENT</p>

          <h1 className={styles.title}>Daily Report Center</h1>

          <p className={styles.description}>
            Record field conditions, workforce, production and project events
            in one operational daily record.
          </p>
        </div>

        <button className={styles.primaryButton} type="button">
          + New Daily Report
        </button>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Reports</span>
            <span className={styles.metricIcon}>DR</span>
          </div>

          <strong className={styles.metricValue}>24</strong>
          <span className={styles.metricCaption}>Total records</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Open</span>
            <span className={styles.metricIcon}>OP</span>
          </div>

          <strong className={styles.metricValue}>1</strong>
          <span className={styles.metricCaption}>Draft report</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Workforce today</span>
            <span className={styles.metricIcon}>WF</span>
          </div>

          <strong className={styles.metricValue}>18</strong>
          <span className={styles.metricCaption}>People on site</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Activities today</span>
            <span className={styles.metricIcon}>AC</span>
          </div>

          <strong className={styles.metricValue}>6</strong>
          <span className={styles.metricCaption}>Recorded activities</span>
        </article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <p className={styles.sectionEyebrow}>DAILY REPORTS</p>
            <h2 className={styles.sectionTitle}>Report history</h2>
          </div>

          <div className={styles.workspaceActions}>
            <input
              className={styles.searchInput}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reports..."
              aria-label="Search daily reports"
            />

            <button className={styles.secondaryButton} type="button">
              Filters
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report</th>
                <th>Date</th>
                <th>Project</th>
                <th>Weather</th>
                <th>Workforce</th>
                <th>Activities</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <button className={styles.reportLink} type="button">
                      {report.id}
                    </button>
                  </td>

                  <td>{report.date}</td>

                  <td>
                    <div className={styles.projectCell}>
                      <strong>{report.project}</strong>
                      <span>Daily field record</span>
                    </div>
                  </td>

                  <td>{report.weather}</td>

                  <td>{report.workforce}</td>

                  <td>{report.activities}</td>

                  <td>
                    <span
                      className={`${styles.statusBadge} ${statusClassName(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className={styles.moreButton}
                      type="button"
                      aria-label={`Open actions for ${report.id}`}
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td className={styles.emptyState} colSpan={8}>
                    No daily reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>TODAY</p>
              <h2 className={styles.sectionTitle}>Field snapshot</h2>
            </div>

            <span className={styles.liveBadge}>Active</span>
          </div>

          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotItem}>
              <span>Weather</span>
              <strong>Clear</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Workforce</span>
              <strong>18</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Activities</span>
              <strong>6</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Occurrences</span>
              <strong>0</strong>
            </div>
          </div>
        </article>

        <article className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>INTEGRATION</p>
              <h2 className={styles.sectionTitle}>Production Control</h2>
            </div>

            <span className={styles.integrationBadge}>Ready</span>
          </div>

          <p className={styles.integrationText}>
            Daily Reports can operate independently or connect field records
            with RitsuFlow production planning and control.
          </p>

          <div className={styles.integrationFlow}>
            <span>Daily Report</span>
            <span className={styles.flowArrow}>→</span>
            <span>Production Data</span>
            <span className={styles.flowArrow}>→</span>
            <span>Control</span>
          </div>
        </article>
      </section>
    </main>
  );
}
