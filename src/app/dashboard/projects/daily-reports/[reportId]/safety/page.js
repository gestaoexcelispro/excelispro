'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../../lib/supabase/client';
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

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

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

function getStatusClass(status, stylesObject) {
  if (status === 'approved') {
    return stylesObject.statusApproved;
  }

  if (
    status === 'submitted' ||
    status === 'reviewed'
  ) {
    return stylesObject.statusSubmitted;
  }

  return stylesObject.statusDraft;
}

function formatSafetyStatus(value) {
  const labels = {
    normal: 'Normal',
    attention: 'Attention',
    critical: 'Critical',
  };

  return labels[value] || value;
}

function formatPpeCompliance(value) {
  const labels = {
    compliant: 'Compliant',
    minor_issues: 'Minor Issues',
    non_compliant: 'Non-Compliant',
    not_applicable: 'Not Applicable',
  };

  return labels[value] || value;
}

function SummaryCard({
  label,
  value,
  helper,
}) {
  return (
    <div
      style={{
        padding: '14px',
        border: '1px solid #e2e8f0',
        borderRadius: '9px',
        background: '#f8fafc',
      }}
    >
      <div style={labelStyle}>
        {label}
      </div>

      <div
        style={{
          marginTop: '5px',
          color: '#061b2f',
          fontSize: '1.35rem',
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      {helper && (
        <div
          style={{
            marginTop: '3px',
            color: '#64748b',
            fontSize: '0.66rem',
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}

export default function DailyReportSafetyPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [userId, setUserId] = useState(null);

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [safetyId, setSafetyId] = useState(null);

  const [overallStatus, setOverallStatus] =
    useState('normal');

  const [toolboxTalkHeld, setToolboxTalkHeld] =
    useState(false);

  const [toolboxTalkTopic, setToolboxTalkTopic] =
    useState('');

  const [
    toolboxTalkAttendees,
    setToolboxTalkAttendees,
  ] = useState('');

  const [
    safetyInspectionCompleted,
    setSafetyInspectionCompleted,
  ] = useState(false);

  const [inspectorName, setInspectorName] =
    useState('');

  const [ppeCompliance, setPpeCompliance] =
    useState('compliant');

  const [incidentsCount, setIncidentsCount] =
    useState('0');

  const [nearMissesCount, setNearMissesCount] =
    useState('0');

  const [
    unsafeConditionsCount,
    setUnsafeConditionsCount,
  ] = useState('0');

  const [stopWorkEvent, setStopWorkEvent] =
    useState(false);

  const [
    stopWorkDescription,
    setStopWorkDescription,
  ] = useState('');

  const [
    correctiveActionsSummary,
    setCorrectiveActionsSummary,
  ] = useState('');

  const [generalNotes, setGeneralNotes] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  useEffect(() => {
    async function loadSafety() {
      if (!reportId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData?.user
      ) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        );

        setIsLoading(false);
        return;
      }

      setUserId(
        userData.user.id
      );

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
          status
        `)
        .eq('id', reportId)
        .single();

      if (
        reportError ||
        !reportData
      ) {
        setErrorMessage(
          reportError?.message ||
            'Daily Report not found.'
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
        .eq(
          'id',
          reportData.project_id
        )
        .single();

      if (
        projectError ||
        !projectData
      ) {
        setErrorMessage(
          projectError?.message ||
            'Project not found.'
        );

        setIsLoading(false);
        return;
      }

      const {
        data: safetyData,
        error: safetyError,
      } = await supabase
        .from(
          'daily_report_safety'
        )
        .select(`
          id,
          daily_report_id,
          overall_status,
          toolbox_talk_held,
          toolbox_talk_topic,
          toolbox_talk_attendees,
          safety_inspection_completed,
          inspector_name,
          ppe_compliance,
          incidents_count,
          near_misses_count,
          unsafe_conditions_count,
          stop_work_event,
          stop_work_description,
          corrective_actions_summary,
          general_notes,
          created_by,
          created_at,
          updated_at
        `)
        .eq(
          'daily_report_id',
          reportData.id
        )
        .maybeSingle();

      if (safetyError) {
        setErrorMessage(
          safetyError.message
        );

        setIsLoading(false);
        return;
      }

      setReport(reportData);
      setProject(projectData);

      if (safetyData) {
        setSafetyId(
          safetyData.id
        );

        setOverallStatus(
          safetyData.overall_status ||
            'normal'
        );

        setToolboxTalkHeld(
          Boolean(
            safetyData.toolbox_talk_held
          )
        );

        setToolboxTalkTopic(
          safetyData.toolbox_talk_topic ||
            ''
        );

        setToolboxTalkAttendees(
          safetyData.toolbox_talk_attendees !==
            null &&
          safetyData.toolbox_talk_attendees !==
            undefined
            ? String(
                safetyData.toolbox_talk_attendees
              )
            : ''
        );

        setSafetyInspectionCompleted(
          Boolean(
            safetyData.safety_inspection_completed
          )
        );

        setInspectorName(
          safetyData.inspector_name ||
            ''
        );

        setPpeCompliance(
          safetyData.ppe_compliance ||
            'compliant'
        );

        setIncidentsCount(
          String(
            safetyData.incidents_count ??
              0
          )
        );

        setNearMissesCount(
          String(
            safetyData.near_misses_count ??
              0
          )
        );

        setUnsafeConditionsCount(
          String(
            safetyData.unsafe_conditions_count ??
              0
          )
        );

        setStopWorkEvent(
          Boolean(
            safetyData.stop_work_event
          )
        );

        setStopWorkDescription(
          safetyData.stop_work_description ||
            ''
        );

        setCorrectiveActionsSummary(
          safetyData.corrective_actions_summary ||
            ''
        );

        setGeneralNotes(
          safetyData.general_notes ||
            ''
        );
      }

      setIsLoading(false);
    }

    loadSafety();
  }, [
    reportId,
    supabase,
  ]);

  async function saveSafety(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      !userId ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const attendees =
      toolboxTalkAttendees === ''
        ? null
        : Number(
            toolboxTalkAttendees
          );

    const incidents =
      Number(
        incidentsCount
      );

    const nearMisses =
      Number(
        nearMissesCount
      );

    const unsafeConditions =
      Number(
        unsafeConditionsCount
      );

    if (
      attendees !== null &&
      (
        !Number.isInteger(
          attendees
        ) ||
        attendees < 0
      )
    ) {
      setErrorMessage(
        'Toolbox talk attendees must be a whole number equal to or greater than zero.'
      );

      setIsSaving(false);
      return;
    }

    if (
      !Number.isInteger(
        incidents
      ) ||
      incidents < 0
    ) {
      setErrorMessage(
        'Incidents count must be a whole number equal to or greater than zero.'
      );

      setIsSaving(false);
      return;
    }

    if (
      !Number.isInteger(
        nearMisses
      ) ||
      nearMisses < 0
    ) {
      setErrorMessage(
        'Near misses count must be a whole number equal to or greater than zero.'
      );

      setIsSaving(false);
      return;
    }

    if (
      !Number.isInteger(
        unsafeConditions
      ) ||
      unsafeConditions < 0
    ) {
      setErrorMessage(
        'Unsafe conditions count must be a whole number equal to or greater than zero.'
      );

      setIsSaving(false);
      return;
    }

    if (
      toolboxTalkHeld &&
      !toolboxTalkTopic.trim()
    ) {
      setErrorMessage(
        'Enter the toolbox talk topic.'
      );

      setIsSaving(false);
      return;
    }

    if (
      safetyInspectionCompleted &&
      !inspectorName.trim()
    ) {
      setErrorMessage(
        'Enter the safety inspector name.'
      );

      setIsSaving(false);
      return;
    }

    if (
      stopWorkEvent &&
      !stopWorkDescription.trim()
    ) {
      setErrorMessage(
        'Describe the Stop Work event.'
      );

      setIsSaving(false);
      return;
    }

    const payload = {
      daily_report_id:
        report.id,

      overall_status:
        overallStatus,

      toolbox_talk_held:
        toolboxTalkHeld,

      toolbox_talk_topic:
        toolboxTalkHeld
          ? toolboxTalkTopic.trim() ||
            null
          : null,

      toolbox_talk_attendees:
        toolboxTalkHeld
          ? attendees
          : null,

      safety_inspection_completed:
        safetyInspectionCompleted,

      inspector_name:
        safetyInspectionCompleted
          ? inspectorName.trim() ||
            null
          : null,

      ppe_compliance:
        ppeCompliance,

      incidents_count:
        incidents,

      near_misses_count:
        nearMisses,

      unsafe_conditions_count:
        unsafeConditions,

      stop_work_event:
        stopWorkEvent,

      stop_work_description:
        stopWorkEvent
          ? stopWorkDescription.trim() ||
            null
          : null,

      corrective_actions_summary:
        correctiveActionsSummary.trim() ||
        null,

      general_notes:
        generalNotes.trim() ||
        null,
    };

    let result;

    if (safetyId) {
      result = await supabase
        .from(
          'daily_report_safety'
        )
        .update(
          payload
        )
        .eq(
          'id',
          safetyId
        )
        .select('id')
        .single();
    } else {
      result = await supabase
        .from(
          'daily_report_safety'
        )
        .insert({
          ...payload,

          created_by:
            userId,
        })
        .select('id')
        .single();
    }

    if (result.error) {
      setErrorMessage(
        result.error.message
      );

      setIsSaving(false);
      return;
    }

    setSafetyId(
      result.data.id
    );

    setSuccessMessage(
      'Safety information saved successfully.'
    );

    setIsSaving(false);
  }

  const totalSafetyEvents =
    Number(
      incidentsCount || 0
    ) +
    Number(
      nearMissesCount || 0
    ) +
    Number(
      unsafeConditionsCount || 0
    );

  if (isLoading) {
    return (
      <main className={styles.page}>
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
            DAILY REPORT
          </p>

          <h1
            className={
              styles.sectionTitle
            }
          >
            Loading Safety...
          </h1>
        </section>
      </main>
    );
  }

  if (
    errorMessage &&
    (!report || !project)
  ) {
    return (
      <main className={styles.page}>
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
            DAILY REPORT
          </p>

          <h1
            className={
              styles.sectionTitle
            }
          >
            Safety information unavailable
          </h1>

          <p
            className={
              styles.integrationText
            }
          >
            {errorMessage}
          </p>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                '/dashboard/projects/daily-reports'
              )
            }
          >
            ← Daily Report Center
          </button>
        </section>
      </main>
    );
  }

  const isReadOnly =
    report.status !== 'draft';

  return (
    <main className={styles.page}>
      <section
        className={
          styles.pageHeader
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            DAILY REPORT · SAFETY
          </p>

          <h1
            className={
              styles.title
            }
          >
            DR-
            {String(
              report.report_number
            ).padStart(
              4,
              '0'
            )}
          </h1>

          <p
            className={
              styles.description
            }
          >
            {project.code ||
              'Unassigned'}{' '}
            · {project.name} ·{' '}
            {formatDate(
              report.report_date
            )}
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
            {formatStatus(
              report.status
            )}
          </span>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
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
            border:
              '1px solid #fecaca',
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
            border:
              '1px solid #b7eee6',
            borderRadius: '9px',
            background: '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form
        onSubmit={
          saveSafety
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
                10 · SAFETY
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily safety summary
              </h2>
            </div>

            <span
              className={`${styles.statusBadge} ${
                overallStatus ===
                'normal'
                  ? styles.statusApproved
                  : overallStatus ===
                      'attention'
                    ? styles.statusSubmitted
                    : styles.statusDraft
              }`}
            >
              {formatSafetyStatus(
                overallStatus
              )}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <SummaryCard
              label="OVERALL STATUS"
              value={
                formatSafetyStatus(
                  overallStatus
                )
              }
            />

            <SummaryCard
              label="TOOLBOX TALK"
              value={
                toolboxTalkHeld
                  ? 'Held'
                  : 'Not Held'
              }
              helper={
                toolboxTalkHeld &&
                toolboxTalkAttendees !==
                  ''
                  ? `${toolboxTalkAttendees} attendees`
                  : ''
              }
            />

            <SummaryCard
              label="INSPECTION"
              value={
                safetyInspectionCompleted
                  ? 'Completed'
                  : 'Not Completed'
              }
            />

            <SummaryCard
              label="SAFETY EVENTS"
              value={
                totalSafetyEvents
              }
              helper={
                stopWorkEvent
                  ? 'Stop Work event recorded'
                  : ''
              }
            />
          </div>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                SAFETY STATUS
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Overall site safety condition
              </h2>
            </div>
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
              Overall safety status
            </span>

            <select
              value={
                overallStatus
              }
              onChange={(
                event
              ) =>
                setOverallStatus(
                  event.target
                    .value
                )
              }
              disabled={
                isReadOnly
              }
              style={
                inputStyle
              }
            >
              <option value="normal">
                Normal
              </option>

              <option value="attention">
                Attention
              </option>

              <option value="critical">
                Critical
              </option>
            </select>
          </label>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                TOOLBOX TALK
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily safety briefing
              </h2>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: '10px',
              minHeight:
                '42px',
            }}
          >
            <input
              type="checkbox"
              checked={
                toolboxTalkHeld
              }
              onChange={(
                event
              ) =>
                setToolboxTalkHeld(
                  event.target
                    .checked
                )
              }
              disabled={
                isReadOnly
              }
            />

            <span
              style={{
                color:
                  '#061b2f',
                fontSize:
                  '0.78rem',
                fontWeight:
                  800,
              }}
            >
              Toolbox talk held
            </span>
          </label>

          {toolboxTalkHeld && (
            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '2fr 1fr',
                gap: '16px',
                marginTop:
                  '14px',
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
                  Topic
                </span>

                <input
                  type="text"
                  value={
                    toolboxTalkTopic
                  }
                  onChange={(
                    event
                  ) =>
                    setToolboxTalkTopic(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    isReadOnly
                  }
                  placeholder="e.g. Fall protection"
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
                  Attendees
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    toolboxTalkAttendees
                  }
                  onChange={(
                    event
                  ) =>
                    setToolboxTalkAttendees(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    isReadOnly
                  }
                  placeholder="0"
                  style={
                    inputStyle
                  }
                />
              </label>
            </div>
          )}
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                SAFETY INSPECTION
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Inspection & PPE compliance
              </h2>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: '10px',
              minHeight:
                '42px',
            }}
          >
            <input
              type="checkbox"
              checked={
                safetyInspectionCompleted
              }
              onChange={(
                event
              ) =>
                setSafetyInspectionCompleted(
                  event.target
                    .checked
                )
              }
              disabled={
                isReadOnly
              }
            />

            <span
              style={{
                color:
                  '#061b2f',
                fontSize:
                  '0.78rem',
                fontWeight:
                  800,
              }}
            >
              Safety inspection completed
            </span>
          </label>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '16px',
              marginTop:
                '14px',
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
                Inspector
              </span>

              <input
                type="text"
                value={
                  inspectorName
                }
                onChange={(
                  event
                ) =>
                  setInspectorName(
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly ||
                  !safetyInspectionCompleted
                }
                placeholder="Inspector name"
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
                PPE compliance
              </span>

              <select
                value={
                  ppeCompliance
                }
                onChange={(
                  event
                ) =>
                  setPpeCompliance(
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly
                }
                style={
                  inputStyle
                }
              >
                <option value="compliant">
                  Compliant
                </option>

                <option value="minor_issues">
                  Minor Issues
                </option>

                <option value="non_compliant">
                  Non-Compliant
                </option>

                <option value="not_applicable">
                  Not Applicable
                </option>
              </select>
            </label>
          </div>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                SAFETY EVENTS
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily event counts
              </h2>
            </div>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: '16px',
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
                Incidents
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  incidentsCount
                }
                onChange={(
                  event
                ) =>
                  setIncidentsCount(
                    event.target
                      .value
                  )
                }
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
                Near misses
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  nearMissesCount
                }
                onChange={(
                  event
                ) =>
                  setNearMissesCount(
                    event.target
                      .value
                  )
                }
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
                Unsafe conditions
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  unsafeConditionsCount
                }
                onChange={(
                  event
                ) =>
                  setUnsafeConditionsCount(
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly
                }
                style={
                  inputStyle
                }
              />
            </label>
          </div>
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                STOP WORK
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Stop Work event
              </h2>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: '10px',
              minHeight:
                '42px',
            }}
          >
            <input
              type="checkbox"
              checked={
                stopWorkEvent
              }
              onChange={(
                event
              ) =>
                setStopWorkEvent(
                  event.target
                    .checked
                )
              }
              disabled={
                isReadOnly
              }
            />

            <span
              style={{
                color:
                  '#061b2f',
                fontSize:
                  '0.78rem',
                fontWeight:
                  800,
              }}
            >
              Stop Work event occurred
            </span>
          </label>

          {stopWorkEvent && (
            <label
              style={{
                ...fieldStyle,
                marginTop:
                  '14px',
              }}
            >
              <span
                style={
                  labelStyle
                }
              >
                Stop Work description
              </span>

              <textarea
                rows={4}
                value={
                  stopWorkDescription
                }
                onChange={(
                  event
                ) =>
                  setStopWorkDescription(
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly
                }
                placeholder="Describe why work was stopped and what occurred..."
                style={{
                  ...inputStyle,
                  minHeight:
                    '100px',
                  padding:
                    '10px 12px',
                  lineHeight:
                    1.5,
                  resize:
                    'vertical',
                }}
              />
            </label>
          )}
        </section>

        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop: '14px',
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
                CORRECTIVE ACTIONS
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily safety actions
              </h2>
            </div>
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
              Corrective actions summary
            </span>

            <textarea
              rows={4}
              value={
                correctiveActionsSummary
              }
              onChange={(
                event
              ) =>
                setCorrectiveActionsSummary(
                  event.target
                    .value
                )
              }
              disabled={
                isReadOnly
              }
              placeholder="Record safety corrective actions, follow-up items or preventive measures..."
              style={{
                ...inputStyle,
                minHeight:
                  '100px',
                padding:
                  '10px 12px',
                lineHeight:
                  1.5,
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
            marginTop: '14px',
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
                Safety observations
              </h2>
            </div>
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
              Safety notes
            </span>

            <textarea
              rows={5}
              value={
                generalNotes
              }
              onChange={(
                event
              ) =>
                setGeneralNotes(
                  event.target
                    .value
                )
              }
              disabled={
                isReadOnly
              }
              placeholder="Record additional safety observations for the reporting period..."
              style={{
                ...inputStyle,
                minHeight:
                  '120px',
                padding:
                  '10px 12px',
                lineHeight:
                  1.5,
                resize:
                  'vertical',
              }}
            />
          </label>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                `/dashboard/projects/daily-reports/${report.id}/attachments`
              )
            }
          >
            ← Photos & Attachments
          </button>

          <button
            type="submit"
            className={
              styles.primaryButton
            }
            disabled={
              isReadOnly ||
              isSaving
            }
          >
            {isSaving
              ? 'Saving...'
              : 'Save Safety'}
          </button>
        </div>
      </form>
    </main>
  );
}
