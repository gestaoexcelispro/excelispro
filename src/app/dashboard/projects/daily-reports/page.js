'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import styles from './daily-reports.module.css';

const statusClassName = (status) => {
  if (status === 'approved') {
    return styles.statusApproved;
  }

  if (status === 'submitted' || status === 'reviewed') {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
};

const statusLabel = (status) => {
  if (status === 'approved') {
    return 'Approved';
  }

  if (status === 'submitted') {
    return 'Submitted';
  }

  if (status === 'reviewed') {
    return 'Reviewed';
  }

  return 'Draft';
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatReportNumber = (number) => {
  return `DR-${String(number || 0).padStart(4, '0')}`;
};

export default function DailyReportsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadDailyReports() {
      setIsLoading(true);
      setErrorMessage('');

      const queryParameters = new URLSearchParams(
        window.location.search
      );

      const selectedProjectId =
        queryParameters.get('projectId');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        );
        setIsLoading(false);
        return;
      }

      const {
        data: projectsData,
        error: projectsError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          code,
          name,
          client_name,
          organization_id,
          status,
          created_at
        `)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (projectsError) {
        setErrorMessage(projectsError.message);
        setIsLoading(false);
        return;
      }

      const availableProjects = projectsData || [];

      setProjects(availableProjects);

      if (!selectedProjectId) {
        setSelectedProject(null);
        setReports([]);
        setIsLoading(false);
        return;
      }

      const activeProject = availableProjects.find(
        (project) => project.id === selectedProjectId
      );

      if (!activeProject) {
        setSelectedProject(null);
        setReports([]);
        setErrorMessage(
          'The selected project does not exist or your account cannot access it.'
        );
        setIsLoading(false);
        return;
      }

      setSelectedProject(activeProject);

      const {
        data: reportsData,
        error: reportsError,
      } = await supabase
        .from('daily_reports')
        .select(`
          id,
          organization_id,
          project_id,
          report_number,
          report_date,
          status,
          work_start_time,
          work_end_time,
          created_at,
          updated_at
        `)
        .eq('project_id', selectedProjectId)
        .order('report_date', { ascending: false })
        .order('report_number', { ascending: false });

      if (reportsError) {
        setReports([]);
        setErrorMessage(reportsError.message);
        setIsLoading(false);
        return;
      }

      setReports(reportsData || []);
      setIsLoading(false);
    }

    loadDailyReports();
  }, [supabase]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return reports;
    }

    return reports.filter((report) => {
      const reportNumber = formatReportNumber(
        report.report_number
      ).toLowerCase();

      const date = formatDate(
        report.report_date
      ).toLowerCase();

      const status = statusLabel(
        report.status
      ).toLowerCase();

      const projectText = selectedProject
        ? [
            selectedProject.code,
            selectedProject.name,
            selectedProject.client_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        : '';

      return (
        reportNumber.includes(term) ||
        date.includes(term) ||
        status.includes(term) ||
        projectText.includes(term)
      );
    });
  }, [reports, search, selectedProject]);

  function changeProject(projectId) {
    window.location.href =
      `/dashboard/projects/daily-reports?projectId=${projectId}`;
  }

  const draftReports = reports.filter(
    (report) => report.status === 'draft'
  ).length;

  return (
    <main className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            FIELD MANAGEMENT
          </p>

          <h1 className={styles.title}>
            Daily Report Center
          </h1>

          <p className={styles.description}>
            Record field conditions, workforce, production and
            project events in one operational daily record.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          type="button"
        >
          + New Daily Report
        </button>
      </section>

      {projects.length > 0 && (
        <section>
          <label
            htmlFor="daily-report-project"
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#64748b',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Active project
          </label>

          <select
            id="daily-report-project"
            value={selectedProject?.id || ''}
            onChange={(event) =>
              changeProject(event.target.value)
            }
            style={{
              minWidth: '320px',
              minHeight: '40px',
              padding: '0 12px',
              color: '#061b2f',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <option value="" disabled>
              Select a project
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.code || 'Unassigned'} · {project.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Reports
            </span>

            <span className={styles.metricIcon}>
              DR
            </span>
          </div>

          <strong className={styles.metricValue}>
            {reports.length}
          </strong>

          <span className={styles.metricCaption}>
            Total records
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Open
            </span>

            <span className={styles.metricIcon}>
              OP
            </span>
          </div>

          <strong className={styles.metricValue}>
            {draftReports}
          </strong>

          <span className={styles.metricCaption}>
            Draft reports
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Workforce today
            </span>

            <span className={styles.metricIcon}>
              WF
            </span>
          </div>

          <strong className={styles.metricValue}>
            —
          </strong>

          <span className={styles.metricCaption}>
            Connected next
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Activities today
            </span>

            <span className={styles.metricIcon}>
              AC
            </span>
          </div>

          <strong className={styles.metricValue}>
            —
          </strong>

          <span className={styles.metricCaption}>
            Connected next
          </span>
        </article>
      </section>

      {errorMessage && (
        <div
          style={{
            padding: '12px 14px',
            color: '#9f2929',
            border: '1px solid #fecaca',
            borderRadius: '9px',
            background: '#fff5f5',
            fontSize: '0.76rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <p className={styles.sectionEyebrow}>
              DAILY REPORTS
            </p>

            <h2 className={styles.sectionTitle}>
              Report history
            </h2>
          </div>

          <div className={styles.workspaceActions}>
            <input
              className={styles.searchInput}
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search reports..."
              aria-label="Search daily reports"
            />

            <button
              className={styles.secondaryButton}
              type="button"
            >
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
                <th>Status</th>
                <th>Last update</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.emptyState}
                  >
                    Loading Daily Reports...
                  </td>
                </tr>
              ) : !selectedProject ? (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.emptyState}
                  >
                    Select a project to view its Daily Reports.
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.emptyState}
                  >
                    No Daily Reports found for this project.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <button
                        className={styles.reportLink}
                        type="button"
                      >
                        {formatReportNumber(
                          report.report_number
                        )}
                      </button>
                    </td>

                    <td>
                      {formatDate(report.report_date)}
                    </td>

                    <td>
                      <div className={styles.projectCell}>
                        <strong>
                          {selectedProject.name}
                        </strong>

                        <span>
                          {selectedProject.code ||
                            'Project without code'}
                          {selectedProject.client_name
                            ? ` · ${selectedProject.client_name}`
                            : ''}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${statusClassName(
                          report.status
                        )}`}
                      >
                        {statusLabel(report.status)}
                      </span>
                    </td>

                    <td>
                      {report.updated_at
                        ? new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                          }).format(
                            new Date(report.updated_at)
                          )
                        : '—'}
                    </td>

                    <td>
                      <button
                        className={styles.moreButton}
                        type="button"
                        aria-label={`Open actions for ${formatReportNumber(
                          report.report_number
                        )}`}
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                TODAY
              </p>

              <h2 className={styles.sectionTitle}>
                Field snapshot
              </h2>
            </div>

            <span className={styles.liveBadge}>
              Next step
            </span>
          </div>

          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotItem}>
              <span>Weather</span>
              <strong>—</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Workforce</span>
              <strong>—</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Activities</span>
              <strong>—</strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Occurrences</span>
              <strong>—</strong>
            </div>
          </div>
        </article>

        <article className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                INTEGRATION
              </p>

              <h2 className={styles.sectionTitle}>
                Production Control
              </h2>
            </div>

            <span className={styles.integrationBadge}>
              Ready
            </span>
          </div>

          <p className={styles.integrationText}>
            Daily Reports can operate independently or connect
            field records with RitsuFlow production planning and
            control.
          </p>

          <div className={styles.integrationFlow}>
            <span>Daily Report</span>
            <span className={styles.flowArrow}>
              →
            </span>
            <span>Production Data</span>
            <span className={styles.flowArrow}>
              →
            </span>
            <span>Control</span>
          </div>
        </article>
      </section>
    </main>
  );
}
