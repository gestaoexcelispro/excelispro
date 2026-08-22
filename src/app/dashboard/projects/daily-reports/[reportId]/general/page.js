'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../../lib/supabase/client';
import styles from '../../daily-reports.module.css';

function formatDate(value) {
  if (!value) return '—';

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

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
};

const labelStyle = {
  color: '#64748b',
  fontSize: '0.7rem',
  fontWeight: 800,
};

const inputStyle = {
  width: '100%',
  minHeight: '42px',
  padding: '0 12px',
  color: '#061b2f',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#ffffff',
  fontFamily: 'inherit',
  fontSize: '0.78rem',
  boxSizing: 'border-box',
};

export default function DailyReportGeneralPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [reportDate, setReportDate] = useState('');
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadGeneralInformation() {
      if (!reportId) return;

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
          updated_at
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
          organization_id
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

      setReport(reportData);
      setProject(projectData);

      setReportDate(reportData.report_date || '');
      setWorkStartTime(reportData.work_start_time || '');
      setWorkEndTime(reportData.work_end_time || '');
      setGeneralNotes(reportData.general_notes || '');

      setIsLoading(false);
    }

    loadGeneralInformation();
  }, [reportId, supabase]);

  async function saveGeneralInformation(event) {
    event.preventDefault();

    if (!report || isSaving) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (
      workStartTime &&
      workEndTime &&
      workEndTime <= workStartTime
    ) {
      setErrorMessage(
        'Work end must be later than work start.'
      );
      setIsSaving(false);
      return;
    }

    const {
      data: duplicateReport,
      error: duplicateError,
    } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('project_id', report.project_id)
      .eq('report_date', reportDate)
      .neq('id', report.id)
      .maybeSingle();

    if (duplicateError) {
      setErrorMessage(duplicateError.message);
      setIsSaving(false);
      return;
    }

    if (duplicateReport) {
      setErrorMessage(
        'Another Daily Report already exists for this project and date.'
      );
      setIsSaving(false);
      return;
    }

    const {
      data: updatedReport,
      error: updateError,
    } = await supabase
      .from('daily_reports')
      .update({
        report_date: reportDate,
        work_start_time: workStartTime || null,
        work_end_time: workEndTime || null,
        general_notes: generalNotes.trim() || null,
      })
      .eq('id', report.id)
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
        updated_at
      `)
      .single();

    if (updateError) {
      setErrorMessage(updateError.message);
      setIsSaving(false);
      return;
    }

    setReport(updatedReport);
    setSuccessMessage('General information saved successfully.');
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            Loading General Information...
          </h1>
        </section>
      </main>
    );
  }

  if (errorMessage && (!report || !project)) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            General Information unavailable
          </h1>

          <p className={styles.integrationText}>
            {errorMessage}
          </p>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              router.push('/dashboard/projects/daily-reports')
            }
          >
            ← Daily Report Center
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
            DAILY REPORT · GENERAL INFORMATION
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
                `/dashboard/projects/daily-reports/${report.id}`
              )
            }
          >
            ← Report Workspace
          </button>
        </div>
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

      {successMessage && (
        <div
          style={{
            padding: '12px 14px',
            color: '#087f73',
            border: '1px solid #b7eee6',
            borderRadius: '9px',
            background: '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={saveGeneralInformation}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                01 · GENERAL INFORMATION
              </p>

              <h2 className={styles.sectionTitle}>
                Report identification
              </h2>
            </div>

            <span
              className={`${styles.statusBadge} ${styles.statusDraft}`}
            >
              Core record
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <label style={fieldStyle}>
              <span style={labelStyle}>
                Project
              </span>

              <input
                value={`${project.code || 'Unassigned'} · ${project.name}`}
                disabled
                style={{
                  ...inputStyle,
                  color: '#64748b',
                  background: '#f8fafc',
                }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Client
              </span>

              <input
                value={project.client_name || '—'}
                disabled
                style={{
                  ...inputStyle,
                  color: '#64748b',
                  background: '#f8fafc',
                }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Report number
              </span>

              <input
                value={`DR-${String(
                  report.report_number
                ).padStart(4, '0')}`}
                disabled
                style={{
                  ...inputStyle,
                  color: '#64748b',
                  background: '#f8fafc',
                }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Report date
              </span>

              <input
                type="date"
                required
                value={reportDate}
                onChange={(event) =>
                  setReportDate(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        <section
          className={styles.infoCard}
          style={{ marginTop: '14px' }}
        >
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                WORK PERIOD
              </p>

              <h2 className={styles.sectionTitle}>
                Site working hours
              </h2>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <label style={fieldStyle}>
              <span style={labelStyle}>
                Work start
              </span>

              <input
                type="time"
                value={workStartTime}
                onChange={(event) =>
                  setWorkStartTime(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Work end
              </span>

              <input
                type="time"
                value={workEndTime}
                onChange={(event) =>
                  setWorkEndTime(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        <section
          className={styles.infoCard}
          style={{ marginTop: '14px' }}
        >
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                NOTES
              </p>

              <h2 className={styles.sectionTitle}>
                General report notes
              </h2>
            </div>
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              General notes
            </span>

            <textarea
              rows={7}
              value={generalNotes}
              onChange={(event) =>
                setGeneralNotes(event.target.value)
              }
              disabled={report.status !== 'draft'}
              placeholder="Record general information relevant to the workday..."
              style={{
                ...inputStyle,
                minHeight: '150px',
                padding: '12px',
                lineHeight: 1.55,
                resize: 'vertical',
              }}
            />
          </label>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              router.push(
                `/dashboard/projects/daily-reports/${report.id}`
              )
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={
              report.status !== 'draft' ||
              !reportDate ||
              isSaving
            }
          >
            {isSaving
              ? 'Saving...'
              : 'Save General Information'}
          </button>
        </div>
      </form>
    </main>
  );
}
