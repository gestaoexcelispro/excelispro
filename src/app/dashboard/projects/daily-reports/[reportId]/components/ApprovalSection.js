'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../../../../../lib/supabase/client';

import styles from '../../daily-reports.module.css';

const labelStyle = {
  color: '#64748b',
  fontSize: '0.7rem',
  fontWeight: 800,
};

const inputStyle = {
  width: '100%',
  minHeight: '42px',
  padding: '10px 12px',
  color: '#061b2f',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#ffffff',
  fontFamily: 'inherit',
  fontSize: '0.78rem',
  boxSizing: 'border-box',
};

const dangerButtonStyle = {
  minHeight: '38px',
  padding: '0 14px',
  color: '#9f2929',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  background: '#fff5f5',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.74rem',
  fontWeight: 800,
};

const warningButtonStyle = {
  minHeight: '38px',
  padding: '0 14px',
  color: '#8a5700',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  background: '#fffbeb',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.74rem',
  fontWeight: 800,
};

const workflowOrder = [
  'draft',
  'submitted',
  'reviewed',
  'approved',
];

const sectionDefinitions = [
  {
    key: 'general',
    number: '01',
    title: 'General Information',
  },
  {
    key: 'weather',
    number: '02',
    title: 'Weather & Site Conditions',
  },
  {
    key: 'workforce',
    number: '03',
    title: 'Workforce',
  },
  {
    key: 'production',
    number: '04',
    title: 'Production',
  },
  {
    key: 'equipment',
    number: '05',
    title: 'Equipment',
  },
  {
    key: 'materials',
    number: '06',
    title: 'Materials',
  },
  {
    key: 'issues',
    number: '07',
    title: 'Issues & Constraints',
  },
  {
    key: 'notes',
    number: '08',
    title: 'Notes & Observations',
  },
  {
    key: 'attachments',
    number: '09',
    title: 'Photos & Attachments',
  },
  {
    key: 'safety',
    number: '10',
    title: 'Safety',
  },
];

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  ).format(date);
}

function formatStatus(status) {
  const labels = {
    draft: 'Draft',
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    approved: 'Approved',
  };

  return (
    labels[status] ||
    status ||
    'Draft'
  );
}

function formatAction(action) {
  const labels = {
    created: 'Created',
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    approved: 'Approved',
    returned: 'Returned',
    reopened: 'Reopened',
  };

  return (
    labels[action] ||
    action
  );
}

function shortUserId(value) {
  if (!value) {
    return 'System';
  }

  if (
    value.length <= 12
  ) {
    return value;
  }

  return `${value.slice(
    0,
    8
  )}…`;
}

function SummaryCard({
  label,
  value,
  helper,
  emphasis,
}) {
  let background =
    '#f8fafc';

  let color =
    '#061b2f';

  if (
    emphasis ===
    'success'
  ) {
    background =
      '#f2fbf9';

    color =
      '#087f73';
  }

  if (
    emphasis ===
    'warning'
  ) {
    background =
      '#fffbeb';

    color =
      '#9a6700';
  }

  return (
    <div
      style={{
        padding: '14px',
        border:
          '1px solid #e2e8f0',
        borderRadius: '9px',
        background,
      }}
    >
      <div style={labelStyle}>
        {label}
      </div>

      <div
        style={{
          marginTop: '5px',
          color,
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

function SectionStatus({
  number,
  title,
  count,
  onOpen,
}) {
  const completed =
    count > 0;

  return (
    <button
      type="button"
      onClick={
        onOpen
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'space-between',
        gap: '14px',
        width: '100%',
        minHeight: '64px',
        padding: '12px 14px',
        textAlign: 'left',
        border:
          '1px solid #e2e8f0',
        borderRadius: '9px',
        background: '#ffffff',
        cursor: onOpen
          ? 'pointer'
          : 'default',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            flex: '0 0 34px',
            width: '34px',
            height: '34px',
            borderRadius:
              '8px',
            color:
              completed
                ? '#ffffff'
                : '#64748b',
            background:
              completed
                ? '#08aa96'
                : '#f1f5f9',
            fontSize:
              '0.68rem',
            fontWeight:
              800,
          }}
        >
          {number}
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                '#061b2f',
              fontSize:
                '0.78rem',
              fontWeight:
                800,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop:
                '3px',
              color:
                '#64748b',
              fontSize:
                '0.68rem',
            }}
          >
            {completed
              ? count === 1
                ? 'Data recorded'
                : `${count} records`
              : 'No data recorded'}
          </div>
        </div>
      </div>

      <span
        style={{
          color:
            completed
              ? '#087f73'
              : '#94a3b8',
          fontSize:
            '0.72rem',
          fontWeight:
            800,
          whiteSpace:
            'nowrap',
        }}
      >
        {completed
          ? 'Complete'
          : 'Review'}
      </span>
    </button>
  );
}

export default function ApprovalSection({
  report,
  project,
  onReportChange,
  onSectionSelect,
}) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const reportId =
    report?.id;

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    sectionCounts,
    setSectionCounts,
  ] = useState({
    general: 1,
    weather: 0,
    workforce: 0,
    production: 0,
    equipment: 0,
    materials: 0,
    issues: 0,
    notes: 0,
    attachments: 0,
    safety: 0,
  });

  const [
    comments,
    setComments,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isTransitioning,
    setIsTransitioning,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadApprovalData =
    useCallback(
      async () => {
        if (!reportId) {
          setIsLoading(
            false
          );

          return;
        }

        setIsLoading(true);
        setErrorMessage('');

        const [
          weatherResult,
          workforceResult,
          productionResult,
          equipmentResult,
          materialsResult,
          issuesResult,
          notesResult,
          attachmentsResult,
          safetyResult,
          historyResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'daily_report_weather'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_workforce'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_production'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_equipment'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_materials'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_issues'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_notes'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_attachments'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_safety'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head: true,
                }
              )
              .eq(
                'daily_report_id',
                reportId
              ),

            supabase
              .from(
                'daily_report_approval_history'
              )
              .select(`
                id,
                daily_report_id,
                action,
                from_status,
                to_status,
                comments,
                performed_by,
                performed_at
              `)
              .eq(
                'daily_report_id',
                reportId
              )
              .order(
                'performed_at',
                {
                  ascending:
                    false,
                }
              ),
          ]);

        const results = [
          weatherResult,
          workforceResult,
          productionResult,
          equipmentResult,
          materialsResult,
          issuesResult,
          notesResult,
          attachmentsResult,
          safetyResult,
          historyResult,
        ];

        const queryError =
          results.find(
            (result) =>
              result.error
          )?.error;

        if (queryError) {
          setErrorMessage(
            queryError.message
          );

          setIsLoading(false);
          return;
        }

        setSectionCounts({
          general: 1,

          weather:
            weatherResult.count ||
            0,

          workforce:
            workforceResult.count ||
            0,

          production:
            productionResult.count ||
            0,

          equipment:
            equipmentResult.count ||
            0,

          materials:
            materialsResult.count ||
            0,

          issues:
            issuesResult.count ||
            0,

          notes:
            notesResult.count ||
            0,

          attachments:
            attachmentsResult.count ||
            0,

          safety:
            safetyResult.count ||
            0,
        });

        setHistory(
          historyResult.data ||
            []
        );

        setIsLoading(false);
      },
      [
        reportId,
        supabase,
      ]
    );

  useEffect(() => {
    loadApprovalData();
  }, [
    loadApprovalData,
  ]);

  async function refreshReport() {
    if (!reportId) {
      return null;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'daily_reports'
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
        .eq(
          'id',
          reportId
        )
        .single();

    if (error) {
      throw error;
    }

    onReportChange?.(
      data
    );

    return data;
  }

  async function transitionStatus(
    action
  ) {
    if (
      !report ||
      isTransitioning
    ) {
      return;
    }

    const confirmationMessages = {
      submitted:
        'Submit this Daily Report for review? After submission, the report will become read-only.',

      reviewed:
        'Mark this Daily Report as reviewed?',

      approved:
        'Approve this Daily Report? This will finalize the current workflow state.',

      returned:
        'Return this Daily Report to Draft for corrections?',

      reopened:
        'Reopen this approved Daily Report and return it to Draft?',
    };

    const confirmed =
      window.confirm(
        confirmationMessages[
          action
        ] ||
          'Continue with this workflow action?'
      );

    if (!confirmed) {
      return;
    }

    setIsTransitioning(
      true
    );

    setErrorMessage('');
    setSuccessMessage('');

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'transition_daily_report_status',
        {
          p_daily_report_id:
            report.id,

          p_action:
            action,

          p_comments:
            comments.trim() ||
            null,
        }
      );

    if (error) {
      setErrorMessage(
        error.message
      );

      setIsTransitioning(
        false
      );

      return;
    }

    setComments('');

    setSuccessMessage(
      `Daily Report ${
        action ===
        'returned'
          ? 'returned to Draft'
          : action ===
              'reopened'
            ? 'reopened'
            : action
      } successfully.`
    );

    try {
      if (data) {
        onReportChange?.(
          data
        );
      } else {
        await refreshReport();
      }

      await loadApprovalData();
    } catch (
      refreshError
    ) {
      setErrorMessage(
        refreshError.message
      );
    }

    setIsTransitioning(
      false
    );
  }

  const completedSections =
    Object.values(
      sectionCounts
    ).filter(
      (count) =>
        count > 0
    ).length;

  const totalSections =
    10;

  const completionPercentage =
    Math.round(
      (
        completedSections /
        totalSections
      ) *
        100
    );

  if (isLoading) {
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
          11 · REVIEW & APPROVAL
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Review & Approval...
        </h2>
      </section>
    );
  }

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
              11 · REVIEW & APPROVAL
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily Report readiness
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Review report
              content and manage
              the approval workflow
              for{' '}
              {project?.name ||
                'this project'}.
            </p>
          </div>

          <span
            className={`${styles.statusBadge} ${
              completionPercentage ===
              100
                ? styles.statusApproved
                : styles.statusSubmitted
            }`}
          >
            {
              completionPercentage
            }
            % reviewed
          </span>
        </div>

        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <SummaryCard
            label="SECTIONS WITH DATA"
            value={`${completedSections}/${totalSections}`}
            emphasis={
              completionPercentage ===
              100
                ? 'success'
                : undefined
            }
          />

          <SummaryCard
            label="CURRENT STATUS"
            value={
              formatStatus(
                report?.status
              )
            }
          />

          <SummaryCard
            label="SUBMITTED"
            value={
              report?.submitted_at
                ? 'Yes'
                : 'No'
            }
            helper={
              report?.submitted_at
                ? formatDateTime(
                    report.submitted_at
                  )
                : ''
            }
          />

          <SummaryCard
            label="APPROVED"
            value={
              report?.approved_at
                ? 'Yes'
                : 'No'
            }
            helper={
              report?.approved_at
                ? formatDateTime(
                    report.approved_at
                  )
                : ''
            }
          />
        </div>

        <div
          style={{
            height: '8px',
            marginTop: '18px',
            overflow: 'hidden',
            borderRadius:
              '999px',
            background:
              '#e2e8f0',
          }}
        >
          <div
            style={{
              width:
                `${completionPercentage}%`,
              height: '100%',
              borderRadius:
                '999px',
              background:
                '#08aa96',
              transition:
                'width 200ms ease',
            }}
          />
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
              REPORT CONTENT
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Section review
            </h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '10px',
          }}
        >
          {sectionDefinitions.map(
            (section) => (
              <SectionStatus
                key={
                  section.key
                }
                number={
                  section.number
                }
                title={
                  section.title
                }
                count={
                  sectionCounts[
                    section.key
                  ] || 0
                }
                onOpen={
                  onSectionSelect
                    ? () =>
                        onSectionSelect(
                          section.key
                        )
                    : undefined
                }
              />
            )
          )}
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
              WORKFLOW
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Review & approval status
            </h2>
          </div>
        </div>

        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: '10px',
          }}
        >
          {[
            {
              key: 'draft',
              label: 'Draft',
            },
            {
              key: 'submitted',
              label: 'Submitted',
            },
            {
              key: 'reviewed',
              label: 'Reviewed',
            },
            {
              key: 'approved',
              label: 'Approved',
            },
          ].map(
            (
              step,
              index
            ) => {
              const currentIndex =
                workflowOrder.indexOf(
                  report?.status
                );

              const stepIndex =
                workflowOrder.indexOf(
                  step.key
                );

              const active =
                stepIndex <=
                currentIndex;

              return (
                <div
                  key={
                    step.key
                  }
                  style={{
                    padding:
                      '14px',

                    border:
                      active
                        ? '1px solid #b7eee6'
                        : '1px solid #e2e8f0',

                    borderRadius:
                      '9px',

                    background:
                      active
                        ? '#effcf9'
                        : '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      color:
                        active
                          ? '#087f73'
                          : '#94a3b8',

                      fontSize:
                        '0.66rem',

                      fontWeight:
                        800,
                    }}
                  >
                    STEP{' '}
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      '0'
                    )}
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
                    {
                      step.label
                    }
                  </div>
                </div>
              );
            }
          )}
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: '7px',
            marginTop: '18px',
          }}
        >
          <span
            style={
              labelStyle
            }
          >
            Workflow comments
          </span>

          <textarea
            rows={4}
            value={
              comments
            }
            onChange={(
              event
            ) =>
              setComments(
                event.target.value
              )
            }
            placeholder="Optional comments for submission, review, approval, return or reopening..."
            style={{
              ...inputStyle,
              minHeight:
                '100px',
              resize:
                'vertical',
              lineHeight:
                1.5,
            }}
          />
        </label>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '18px',
          }}
        >
          {report?.status ===
            'draft' && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              disabled={
                isTransitioning
              }
              onClick={() =>
                transitionStatus(
                  'submitted'
                )
              }
            >
              {isTransitioning
                ? 'Processing...'
                : 'Submit for Review'}
            </button>
          )}

          {report?.status ===
            'submitted' && (
            <>
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  isTransitioning
                }
                onClick={() =>
                  transitionStatus(
                    'reviewed'
                  )
                }
              >
                Mark as Reviewed
              </button>

              <button
                type="button"
                style={
                  warningButtonStyle
                }
                disabled={
                  isTransitioning
                }
                onClick={() =>
                  transitionStatus(
                    'returned'
                  )
                }
              >
                Return to Draft
              </button>
            </>
          )}

          {report?.status ===
            'reviewed' && (
            <>
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  isTransitioning
                }
                onClick={() =>
                  transitionStatus(
                    'approved'
                  )
                }
              >
                Approve Daily Report
              </button>

              <button
                type="button"
                style={
                  warningButtonStyle
                }
                disabled={
                  isTransitioning
                }
                onClick={() =>
                  transitionStatus(
                    'returned'
                  )
                }
              >
                Return to Draft
              </button>
            </>
          )}

          {report?.status ===
            'approved' && (
            <button
              type="button"
              style={
                dangerButtonStyle
              }
              disabled={
                isTransitioning
              }
              onClick={() =>
                transitionStatus(
                  'reopened'
                )
              }
            >
              Reopen Daily Report
            </button>
          )}
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
              AUDIT TRAIL
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Approval history
            </h2>
          </div>

          <span
            className={`${styles.statusBadge} ${styles.statusDraft}`}
          >
            {
              history.length
            }{' '}
            events
          </span>
        </div>

        {history.length ===
        0 ? (
          <div
            style={{
              padding:
                '24px 0 8px',
              color:
                '#64748b',
              fontSize:
                '0.76rem',
            }}
          >
            No workflow history recorded yet.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '10px',
            }}
          >
            {history.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  style={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      '150px minmax(0, 1fr) 180px',

                    gap: '16px',

                    alignItems:
                      'center',

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
                  <div>
                    <div
                      style={{
                        color:
                          '#061b2f',

                        fontSize:
                          '0.76rem',

                        fontWeight:
                          800,
                      }}
                    >
                      {formatAction(
                        item.action
                      )}
                    </div>

                    <div
                      style={{
                        marginTop:
                          '3px',

                        color:
                          '#64748b',

                        fontSize:
                          '0.66rem',
                      }}
                    >
                      {item.from_status
                        ? formatStatus(
                            item.from_status
                          )
                        : '—'}

                      {' → '}

                      {item.to_status
                        ? formatStatus(
                            item.to_status
                          )
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color:
                          '#334155',

                        fontSize:
                          '0.72rem',

                        lineHeight:
                          1.5,
                      }}
                    >
                      {item.comments ||
                        'No comments.'}
                    </div>

                    <div
                      style={{
                        marginTop:
                          '4px',

                        color:
                          '#94a3b8',

                        fontSize:
                          '0.64rem',
                      }}
                    >
                      Performed by{' '}
                      {shortUserId(
                        item.performed_by
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      color:
                        '#64748b',

                      fontSize:
                        '0.68rem',

                      textAlign:
                        'right',
                    }}
                  >
                    {formatDateTime(
                      item.performed_at
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
