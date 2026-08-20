'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';
import styles from '../daily-reports.module.css';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatStatus(status) {
  const labels = {
    draft: 'Draft',
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    approved: 'Approved',
  };

  return labels[status] || status || 'Draft';
}

function getStatusClass(status, styles) {
  if (status === 'approved') {
    return styles.statusApproved;
  }

  if (status === 'submitted' || status === 'reviewed') {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
}

export default function DailyReportWorkspacePage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const sections = [
    {
      key: 'general',
      number: '01',
      title: 'General Information',
      description: 'Project, date, work period and report notes.',
    },
    {
      key: 'weather',
      number: '02',
      title: 'Weather & Site Conditions',
      description: 'Weather, temperature and production impact.',
    },
    {
      key: 'workforce',
      number: '03',
      title: 'Workforce',
      description: 'Companies, crews, roles and labor resources.',
    },
    {
      key: 'production',
      number: '04',
      title: 'Production',
      description: 'Planned versus actual field production.',
    },
    {
      key: 'equipment',
      number: '05',
      title: 'Equipment',
      description: 'Equipment usage, idle time and operating status.',
    },
    {
      key: 'materials',
      number: '06',
      title: 'Materials',
      description: 'Materials received and used during the workday.',
    },
    {
      key: 'issues',
      number: '07',
      title: 'Issues & Constraints',
      description: 'Field issues, impacts and corrective actions.',
    },
    {
      key: 'notes',
      number: '08',
      title: 'Notes',
      description: 'General, safety, quality and coordination notes.',
    },
    {
      key: 'attachments',
      number: '09',
      title: 'Photos & Attachments',
      description: 'Photos, videos, documents and field evidence.',
    },
    {
      key: 'approval',
      number: '10',
      title: 'Review & Approval',
      description: 'Submission, review and approval workflow.',
    },
  ];

  useEffect(() => {
    async function loadWorkspace() {
      if (!reportId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

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
        data: reportData,
        error: reportError,
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
          general_notes,
          created_at,
          updated_at,
          submitted_at,
          reviewed_at,
          approved_at
        `)
        .eq('id', reportId)
        .single();

      if (reportError || !reportData) {
        setErrorMessage(
          reportError?.message || 'Daily Report not found.'
        );
        setIsLoading(false);
        return;
      }

      setReport(reportData);

      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          code,
          name,
          client_name,
          organization_id,
          status
        `)
        .eq('id', reportData.project_id)
        .single();

      if (projectError || !projectData) {
        setErrorMessage(
          projectError?.message || 'Project not found.'
        );
        setIsLoading(false);
        return;
      }

      setProject(projectData);
      setIsLoading(false);
    }

    loadWorkspace();
  }, [reportId, supabase]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>DAILY REPORT</p>
          <h1 className={styles.sectionTitle}>
            Loading report workspace...
          </h1>
        </section>
      </main>
    );
  }

  if (errorMessage || !report || !project) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>DAILY REPORT</p>

          <h1 className={styles.sectionTitle}>
            Report unavailable
          </h1>

          <p className={styles.integrationText}>
            {errorMessage || 'The requested Daily Report could not be loaded.'}
          </p>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              router.push('/dashboard/projects/daily-reports')
            }
          >
            ← Back to Daily Reports
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            DAILY REPORT WORKSPACE
          </p>

          <h1 className={styles.title}>
            DR-{String(report.report_number).padStart(4, '0')}
          </h1>

          <p className={styles.description}>
            {project.code || 'Unassigned'} · {project.name} ·{' '}
            {formatDate(report.report_date)}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              report.status,
              styles
            )}`}
          >
            {formatStatus(report.status)}
          </span>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              router.push(
                `/dashboard/projects/daily-reports?projectId=${project.id}`
              )
            }
          >
            ← Daily Report Center
          </button>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Report
            </span>

            <span className={styles.metricIcon}>
              DR
            </span>
          </div>

          <strong className={styles.metricValue}>
            {String(report.report_number).padStart(4, '0')}
          </strong>

          <span className={styles.metricCaption}>
            Project sequence
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Date
            </span>

            <span className={styles.metricIcon}>
              DT
            </span>
          </div>

          <strong
            className={styles.metricValue}
            style={{
              fontSize: '1rem',
              lineHeight: 1.3,
            }}
          >
            {formatDate(report.report_date)}
          </strong>

          <span className={styles.metricCaption}>
            Reporting period
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Status
            </span>

            <span className={styles.metricIcon}>
              ST
            </span>
          </div>

          <strong
            className={styles.metricValue}
            style={{
              fontSize: '1rem',
            }}
          >
            {formatStatus(report.status)}
          </strong>

          <span className={styles.metricCaption}>
            Current workflow stage
          </span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>
              Project
            </span>

            <span className={styles.metricIcon}>
              PJ
            </span>
          </div>

          <strong
            className={styles.metricValue}
            style={{
              fontSize: '1rem',
            }}
          >
            {project.code || '—'}
          </strong>

          <span className={styles.metricCaption}>
            {project.name}
          </span>
        </article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <p className={styles.sectionEyebrow}>
              REPORT CONTENT
            </p>

            <h2 className={styles.sectionTitle}>
              Daily Report sections
            </h2>
          </div>

          <span
            className={`${styles.statusBadge} ${styles.statusDraft}`}
          >
            10 sections
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '12px',
            padding: '18px',
          }}
        >
          {sections.map((section) => (
            <button
              type="button"
              key={section.key}
              onClick={() => {
                router.push(
                  `/dashboard/projects/daily-reports/${report.id}/${section.key}`
                );
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                minHeight: '86px',
                padding: '14px 16px',
                color: '#061b2f',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                background: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '0 0 36px',
                  width: '36px',
                  height: '36px',
                  color: '#087f73',
                  borderRadius: '9px',
                  background: '#d9f6f1',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                }}
              >
                {section.number}
              </span>

              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <strong
                  style={{
                    fontSize: '0.8rem',
                  }}
                >
                  {section.title}
                </strong>

                <span
                  style={{
                    color: '#64748b',
                    fontSize: '0.7rem',
                    lineHeight: 1.45,
                  }}
                >
                  {section.description}
                </span>
              </span>

              <span
                style={{
                  marginLeft: 'auto',
                  color: '#08aa96',
                  fontWeight: 900,
                }}
              >
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            GENERAL
          </p>

          <h2 className={styles.sectionTitle}>
            Current report information
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '18px',
            }}
          >
            <div className={styles.snapshotItem}>
              <span>Work start</span>
              <strong>
                {report.work_start_time || '—'}
              </strong>
            </div>

            <div className={styles.snapshotItem}>
              <span>Work end</span>
              <strong>
                {report.work_end_time || '—'}
              </strong>
            </div>
          </div>
        </article>

        <article className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            WORKFLOW
          </p>

          <h2 className={styles.sectionTitle}>
            Report lifecycle
          </h2>

          <div
            className={styles.integrationFlow}
            style={{ marginTop: '18px' }}
          >
            <span>Draft</span>
            <span className={styles.flowArrow}>→</span>
            <span>Submitted</span>
            <span className={styles.flowArrow}>→</span>
            <span>Reviewed</span>
            <span className={styles.flowArrow}>→</span>
            <span>Approved</span>
          </div>
        </article>
      </section>
    </main>
  );
}
