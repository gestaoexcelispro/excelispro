'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../../../../../../lib/supabase/client';

import styles from '../../daily-reports.module.css';

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

const readOnlyInputStyle = {
  ...inputStyle,
  color: '#64748b',
  background: '#f8fafc',
};

function formatReportNumber(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  return `DR-${String(
    value
  ).padStart(
    4,
    '0'
  )}`;
}

function calculateWorkHours(
  start,
  end
) {
  if (
    !start ||
    !end
  ) {
    return null;
  }

  const [
    startHour,
    startMinute,
  ] =
    start
      .slice(0, 5)
      .split(':')
      .map(Number);

  const [
    endHour,
    endMinute,
  ] =
    end
      .slice(0, 5)
      .split(':')
      .map(Number);

  if (
    [
      startHour,
      startMinute,
      endHour,
      endMinute,
    ].some(
      Number.isNaN
    )
  ) {
    return null;
  }

  const startMinutes =
    startHour * 60 +
    startMinute;

  const endMinutes =
    endHour * 60 +
    endMinute;

  const difference =
    endMinutes -
    startMinutes;

  if (
    difference < 0
  ) {
    return null;
  }

  const hours =
    Math.floor(
      difference / 60
    );

  const minutes =
    difference % 60;

  return `${hours}h ${String(
    minutes
  ).padStart(
    2,
    '0'
  )}m`;
}

function SummaryItem({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          '13px 14px',
        border:
          '1px solid #e2e8f0',
        borderRadius:
          '9px',
        background:
          '#f8fafc',
      }}
    >
      <div
        style={
          labelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            '5px',
          color:
            '#061b2f',
          fontSize:
            '0.82rem',
          fontWeight:
            800,
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

export default function GeneralSection({
  report,
  project,
  onReportChange,
  onCountChange,
}) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    reportDate,
    setReportDate,
  ] = useState('');

  const [
    workStartTime,
    setWorkStartTime,
  ] = useState('');

  const [
    workEndTime,
    setWorkEndTime,
  ] = useState('');

  const [
    generalNotes,
    setGeneralNotes,
  ] = useState('');

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    if (!report) {
      return;
    }

    setReportDate(
      report.report_date ||
        ''
    );

    setWorkStartTime(
      report.work_start_time
        ? String(
            report.work_start_time
          ).slice(
            0,
            5
          )
        : ''
    );

    setWorkEndTime(
      report.work_end_time
        ? String(
            report.work_end_time
          ).slice(
            0,
            5
          )
        : ''
    );

    setGeneralNotes(
      report.general_notes ||
        ''
    );

    onCountChange?.(
      1
    );
  }, [
    report,
    onCountChange,
  ]);

  async function saveGeneral(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      isSaving ||
      report.status !==
        'draft'
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!reportDate) {
      setErrorMessage(
        'Report date is required.'
      );

      setIsSaving(false);
      return;
    }

    if (
      workStartTime &&
      workEndTime
    ) {
      const workHours =
        calculateWorkHours(
          workStartTime,
          workEndTime
        );

      if (
        workHours === null
      ) {
        setErrorMessage(
          'Work End must be later than or equal to Work Start.'
        );

        setIsSaving(false);
        return;
      }
    }

    const payload = {
      report_date:
        reportDate,

      work_start_time:
        workStartTime ||
        null,

      work_end_time:
        workEndTime ||
        null,

      general_notes:
        generalNotes.trim() ||
        null,
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'daily_reports'
        )
        .update(
          payload
        )
        .eq(
          'id',
          report.id
        )
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
          submitted_by,
          submitted_at,
          reviewed_by,
          reviewed_at,
          approved_by,
          approved_at,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      setErrorMessage(
        error.message
      );

      setIsSaving(false);
      return;
    }

    onReportChange?.(
      data
    );

    onCountChange?.(
      1
    );

    setSuccessMessage(
      'General information saved successfully.'
    );

    setIsSaving(false);
  }

  if (!report) {
    return (
      <section
        className={
          styles.infoCard
        }
      >
        <p
          className={
            styles.sectionEyebrow
          }
        >
          01 · GENERAL INFORMATION
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading General Information...
        </h2>
      </section>
    );
  }

  const isReadOnly =
    report.status !==
    'draft';

  const workHours =
    calculateWorkHours(
      workStartTime,
      workEndTime
    );

  const notesLength =
    generalNotes.length;

  return (
    <div>
      {errorMessage && (
        <div
          style={{
            padding:
              '12px 14px',
            marginBottom:
              '14px',
            color:
              '#9f2929',
            border:
              '1px solid #fecaca',
            borderRadius:
              '9px',
            background:
              '#fff5f5',
            fontSize:
              '0.76rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding:
              '12px 14px',
            marginBottom:
              '14px',
            color:
              '#087f73',
            border:
              '1px solid #b7eee6',
            borderRadius:
              '9px',
            background:
              '#effcf9',
            fontSize:
              '0.76rem',
            fontWeight:
              700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form
        onSubmit={
          saveGeneral
        }
      >
        <section
          className={
            styles.infoCard
          }
        >
          <div
            className={
              styles.infoCardHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionEyebrow
                }
              >
                01 · GENERAL INFORMATION
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Report basics
              </h2>

              <p
                className={
                  styles.integrationText
                }
              >
                Project, reporting
                date, work period
                and general notes
                for the day.
              </p>
            </div>

            <span
              className={`${styles.statusBadge} ${styles.statusApproved}`}
            >
              Complete
            </span>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                '2fr 1fr 1fr',
              gap:
                '16px',
              marginTop:
                '16px',
            }}
          >
            <label
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Project
              </span>

              <input
                type="text"
                value={`${
                  project?.code ||
                  'Unassigned'
                } · ${
                  project?.name ||
                  'Project'
                }`}
                disabled
                style={
                  readOnlyInputStyle
                }
              />
            </label>

            <label
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Report Date
              </span>

              <input
                type="date"
                value={
                  reportDate
                }
                onChange={(
                  event
                ) => {
                  setReportDate(
                    event.target.value
                  );

                  setSuccessMessage('');
                }}
                disabled={
                  isReadOnly
                }
                style={
                  inputStyle
                }
              />
            </label>

            <label
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Report #
              </span>

              <input
                type="text"
                value={
                  formatReportNumber(
                    report.report_number
                  )
                }
                disabled
                style={
                  readOnlyInputStyle
                }
              />
            </label>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap:
                '16px',
              marginTop:
                '18px',
            }}
          >
            <label
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Work Start
              </span>

              <input
                type="time"
                value={
                  workStartTime
                }
                onChange={(
                  event
                ) => {
                  setWorkStartTime(
                    event.target.value
                  );

                  setSuccessMessage('');
                }}
                disabled={
                  isReadOnly
                }
                style={
                  inputStyle
                }
              />
            </label>

            <label
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Work End
              </span>

              <input
                type="time"
                value={
                  workEndTime
                }
                onChange={(
                  event
                ) => {
                  setWorkEndTime(
                    event.target.value
                  );

                  setSuccessMessage('');
                }}
                disabled={
                  isReadOnly
                }
                style={
                  inputStyle
                }
              />
            </label>

            <div
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Work Period
              </span>

              <div
                style={{
                  display:
                    'flex',
                  minHeight:
                    '42px',
                  alignItems:
                    'center',
                  padding:
                    '0 12px',
                  border:
                    '1px solid #d7eee9',
                  borderRadius:
                    '8px',
                  background:
                    '#f2fbf9',
                  color:
                    '#087f73',
                  fontSize:
                    '0.78rem',
                  fontWeight:
                    800,
                  boxSizing:
                    'border-box',
                }}
              >
                {workHours ||
                  '—'}
              </div>
            </div>
          </div>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop:
              '14px',
          }}
        >
          <div
            className={
              styles.infoCardHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionEyebrow
                }
              >
                GENERAL NOTES
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily observations
              </h2>
            </div>

            <span
              style={{
                color:
                  notesLength > 500
                    ? '#9f2929'
                    : '#94a3b8',
                fontSize:
                  '0.66rem',
                fontWeight:
                  700,
              }}
            >
              {notesLength} / 500
            </span>
          </div>

          <label
            style={
              fieldStyle
            }
          >
            <span
              style={
                labelStyle
              }
            >
              General Notes
            </span>

            <textarea
              rows={6}
              maxLength={500}
              value={
                generalNotes
              }
              onChange={(
                event
              ) => {
                setGeneralNotes(
                  event.target.value
                );

                setSuccessMessage('');
              }}
              disabled={
                isReadOnly
              }
              placeholder="Enter general notes about the day..."
              style={{
                ...inputStyle,
                minHeight:
                  '140px',
                padding:
                  '12px',
                lineHeight:
                  1.55,
                resize:
                  'vertical',
              }}
            />
          </label>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop:
              '14px',
          }}
        >
          <div
            className={
              styles.infoCardHeader
            }
          >
            <div>
              <p
                className={
                  styles.sectionEyebrow
                }
              >
                TODAY AT A GLANCE
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Report information
              </h2>
            </div>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
              gap:
                '12px',
            }}
          >
            <SummaryItem
              label="PROJECT"
              value={
                project?.code ||
                'Unassigned'
              }
            />

            <SummaryItem
              label="CLIENT"
              value={
                project?.client_name ||
                'Not specified'
              }
            />

            <SummaryItem
              label="REPORT"
              value={
                formatReportNumber(
                  report.report_number
                )
              }
            />

            <SummaryItem
              label="WORK HOURS"
              value={
                workHours ||
                'Not defined'
              }
            />
          </div>
        </section>

        {!isReadOnly && (
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'flex-end',
              marginTop:
                '18px',
            }}
          >
            <button
              type="submit"
              className={
                styles.primaryButton
              }
              disabled={
                isSaving
              }
            >
              {isSaving
                ? 'Saving...'
                : 'Save General Information'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
