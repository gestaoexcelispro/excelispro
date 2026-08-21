'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useSearchParams,
} from 'next/navigation';

import {
  createClient,
} from '../../../../lib/supabase/client';

import styles from './operations-dashboard.module.css';

const DAYS_TO_SHOW = 7;

function formatDate(
  value
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }
  ).format(
    date
  );
}

function formatShortDate(
  value
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
    }
  ).format(
    date
  );
}

function formatStatus(
  value
) {
  const labels = {
    draft:
      'Draft',

    submitted:
      'Submitted',

    reviewed:
      'Reviewed',

    approved:
      'Approved',
  };

  return (
    labels[value] ||
    value ||
    'Draft'
  );
}

function getStatusClass(
  status
) {
  if (
    status ===
    'approved'
  ) {
    return styles.statusApproved;
  }

  if (
    status ===
    'reviewed'
  ) {
    return styles.statusReviewed;
  }

  if (
    status ===
    'submitted'
  ) {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
}

function numericValue(
  value
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function SummaryCard({
  label,
  value,
  helper,
  tone,
}) {
  return (
    <div
      className={`${styles.summaryCard} ${
        tone === 'success'
          ? styles.summaryCardSuccess
          : tone === 'warning'
            ? styles.summaryCardWarning
            : tone === 'danger'
              ? styles.summaryCardDanger
              : ''
      }`}
    >
      <div
        className={
          styles.summaryLabel
        }
      >
        {label}
      </div>

      <div
        className={
          styles.summaryValue
        }
      >
        {value}
      </div>

      {helper && (
        <div
          className={
            styles.summaryHelper
          }
        >
          {helper}
        </div>
      )}
    </div>
  );
}

function MiniBar({
  label,
  value,
  max,
}) {
  const percentage =
    max > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              value /
              max
            ) *
              100
          )
        )
      : 0;

  return (
    <div
      className={
        styles.miniBarRow
      }
    >
      <div
        className={
          styles.miniBarLabel
        }
      >
        {label}
      </div>

      <div
        className={
          styles.miniBarTrack
        }
      >
        <div
          className={
            styles.miniBarFill
          }
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>

      <div
        className={
          styles.miniBarValue
        }
      >
        {value}
      </div>
    </div>
  );
}

function OperationalDashboardContent() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const searchParams =
    useSearchParams();

  const projectId =
    searchParams.get(
      'projectId'
    );

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    workforce,
    setWorkforce,
  ] = useState([]);

  const [
    workforceRoles,
    setWorkforceRoles,
  ] = useState([]);

  const [
    production,
    setProduction,
  ] = useState([]);

  const [
    issues,
    setIssues,
  ] = useState([]);

  const [
    safety,
    setSafety,
  ] = useState([]);

  const [
    weather,
    setWeather,
  ] = useState([]);

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      if (
        !projectId
      ) {
        setErrorMessage(
          'Select a project to view the Operational Dashboard.'
        );

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      const {
        data:
          userData,

        error:
          userError,
      } =
        await supabase.auth.getUser();

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

      const {
        data:
          projectData,

        error:
          projectError,
      } =
        await supabase
          .from(
            'projects'
          )
          .select(`
            id,
            code,
            name,
            client_name,
            city,
            state_region,
            country_code,
            status
          `)
          .eq(
            'id',
            projectId
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
        data:
          reportsData,

        error:
          reportsError,
      } =
        await supabase
          .from(
            'daily_reports'
          )
          .select(`
            id,
            project_id,
            report_number,
            report_date,
            status,
            work_start_time,
            work_end_time,
            general_notes,
            submitted_at,
            reviewed_at,
            approved_at,
            created_at
          `)
          .eq(
            'project_id',
            projectId
          )
          .order(
            'report_date',
            {
              ascending: false,
            }
          );

      if (
        reportsError
      ) {
        setErrorMessage(
          reportsError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedReports =
        reportsData ||
        [];

      const reportIds =
        loadedReports.map(
          (item) =>
            item.id
        );

      let workforceData = [];
      let workforceRolesData = [];
      let productionData = [];
      let issuesData = [];
      let safetyData = [];
      let weatherData = [];
      let attachmentsData = [];

      if (
        reportIds.length >
        0
      ) {
        const [
          workforceResult,
          productionResult,
          issuesResult,
          safetyResult,
          weatherResult,
          attachmentsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'daily_report_workforce'
              )
              .select(`
                id,
                daily_report_id,
                company_name,
                crew_name,
                regular_hours,
                overtime_hours
              `)
              .in(
                'daily_report_id',
                reportIds
              ),

            supabase
              .from(
                'daily_report_production'
              )
              .select(`
                id,
                daily_report_id,
                location_name,
                service_name,
                unit,
                planned_quantity,
                actual_quantity,
                cumulative_quantity,
                production_status
              `)
              .in(
                'daily_report_id',
                reportIds
              ),

            supabase
              .from(
                'daily_report_issues'
              )
              .select(`
                id,
                daily_report_id,
                title,
                severity,
                status,
                production_impact,
                create_constraint
              `)
              .in(
                'daily_report_id',
                reportIds
              ),

            supabase
              .from(
                'daily_report_safety'
              )
              .select(`
                id,
                daily_report_id,
                overall_status,
                incidents_count,
                near_misses_count,
                unsafe_conditions_count,
                stop_work_event
              `)
              .in(
                'daily_report_id',
                reportIds
              ),

            supabase
              .from(
                'daily_report_weather'
              )
              .select(`
                id,
                daily_report_id,
                production_impact,
                impact_hours
              `)
              .in(
                'daily_report_id',
                reportIds
              ),

            supabase
              .from(
                'daily_report_attachments'
              )
              .select(`
                id,
                daily_report_id,
                attachment_type,
                file_name,
                title,
                created_at
              `)
              .in(
                'daily_report_id',
                reportIds
              ),
          ]);

        const queryError =
          workforceResult.error ||
          productionResult.error ||
          issuesResult.error ||
          safetyResult.error ||
          weatherResult.error ||
          attachmentsResult.error;

        if (
          queryError
        ) {
          setErrorMessage(
            queryError.message
          );

          setIsLoading(false);
          return;
        }

        workforceData =
          workforceResult.data ||
          [];

        productionData =
          productionResult.data ||
          [];

        issuesData =
          issuesResult.data ||
          [];

        safetyData =
          safetyResult.data ||
          [];

        weatherData =
          weatherResult.data ||
          [];

        attachmentsData =
          attachmentsResult.data ||
          [];

        const workforceIds =
          workforceData.map(
            (item) =>
              item.id
          );

        if (
          workforceIds.length >
          0
        ) {
          const {
            data:
              rolesData,

            error:
              rolesError,
          } =
            await supabase
              .from(
                'daily_report_workforce_roles'
              )
              .select(`
                id,
                workforce_id,
                role_name,
                worker_count
              `)
              .in(
                'workforce_id',
                workforceIds
              );

          if (
            rolesError
          ) {
            setErrorMessage(
              rolesError.message
            );

            setIsLoading(false);
            return;
          }

          workforceRolesData =
            rolesData ||
            [];
        }
      }

      setProject(
        projectData
      );

      setReports(
        loadedReports
      );

      setWorkforce(
        workforceData
      );

      setWorkforceRoles(
        workforceRolesData
      );

      setProduction(
        productionData
      );

      setIssues(
        issuesData
      );

      setSafety(
        safetyData
      );

      setWeather(
        weatherData
      );

      setAttachments(
        attachmentsData
      );

      setIsLoading(false);
    }

    loadDashboard();
  }, [
    projectId,
    supabase,
  ]);

  const latestReports =
    reports.slice(
      0,
      DAYS_TO_SHOW
    );

  const latestReport =
    latestReports[0] ||
    null;

  const workforceByCrewId =
    useMemo(
      () =>
        new Map(
          workforce.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [
        workforce,
      ]
    );

  const reportMap =
    useMemo(
      () =>
        new Map(
          reports.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [
        reports,
      ]
    );

  const workforceTotalsByReport =
    useMemo(() => {
      const result =
        new Map();

      workforceRoles.forEach(
        (role) => {
          const crew =
            workforceByCrewId.get(
              role.workforce_id
            );

          if (
            !crew
          ) {
            return;
          }

          const reportId =
            crew.daily_report_id;

          const workers =
            numericValue(
              role.worker_count
            );

          const regularHours =
            numericValue(
              crew.regular_hours
            );

          const overtimeHours =
            numericValue(
              crew.overtime_hours
            );

          const current =
            result.get(
              reportId
            ) || {
              workers: 0,
              laborHours: 0,
            };

          current.workers +=
            workers;

          current.laborHours +=
            workers *
            (
              regularHours +
              overtimeHours
            );

          result.set(
            reportId,
            current
          );
        }
      );

      return result;
    }, [
      workforceRoles,
      workforceByCrewId,
    ]);

  const productionByReport =
    useMemo(() => {
      const result =
        new Map();

      production.forEach(
        (item) => {
          const current =
            result.get(
              item.daily_report_id
            ) || {
              records: 0,
              planned: 0,
              actual: 0,
            };

          current.records +=
            1;

          current.planned +=
            numericValue(
              item.planned_quantity
            );

          current.actual +=
            numericValue(
              item.actual_quantity
            );

          result.set(
            item.daily_report_id,
            current
          );
        }
      );

      return result;
    }, [
      production,
    ]);

  const issuesByReport =
    useMemo(() => {
      const result =
        new Map();

      issues.forEach(
        (item) => {
          const current =
            result.get(
              item.daily_report_id
            ) || {
              total: 0,
              open: 0,
              critical: 0,
            };

          current.total +=
            1;

          if (
            item.status ===
              'open' ||
            item.status ===
              'in_progress'
          ) {
            current.open +=
              1;
          }

          if (
            item.severity ===
            'critical'
          ) {
            current.critical +=
              1;
          }

          result.set(
            item.daily_report_id,
            current
          );
        }
      );

      return result;
    }, [
      issues,
    ]);

  const attachmentsByReport =
    useMemo(() => {
      const result =
        new Map();

      attachments.forEach(
        (item) => {
          const current =
            result.get(
              item.daily_report_id
            ) || {
              total: 0,
              photos: 0,
            };

          current.total +=
            1;

          if (
            item.attachment_type ===
            'photo'
          ) {
            current.photos +=
              1;
          }

          result.set(
            item.daily_report_id,
            current
          );
        }
      );

      return result;
    }, [
      attachments,
    ]);

  const latestWorkforce =
    latestReport
      ? workforceTotalsByReport.get(
          latestReport.id
        ) || {
          workers: 0,
          laborHours: 0,
        }
      : {
          workers: 0,
          laborHours: 0,
        };

  const latestProduction =
    latestReport
      ? productionByReport.get(
          latestReport.id
        ) || {
          records: 0,
          planned: 0,
          actual: 0,
        }
      : {
          records: 0,
          planned: 0,
          actual: 0,
        };

  const openIssues =
    issues.filter(
      (item) =>
        item.status ===
          'open' ||
        item.status ===
          'in_progress'
    ).length;

  const criticalIssues =
    issues.filter(
      (item) =>
        item.severity ===
        'critical'
    ).length;

  const constraintCandidates =
    issues.filter(
      (item) =>
        Boolean(
          item.create_constraint
        )
    ).length;

  const safetyEvents =
    safety.reduce(
      (
        total,
        item
      ) =>
        total +
        numericValue(
          item.incidents_count
        ) +
        numericValue(
          item.near_misses_count
        ) +
        numericValue(
          item.unsafe_conditions_count
        ) +
        (
          item.stop_work_event
            ? 1
            : 0
        ),
      0
    );

  const weatherImpactHours =
    weather.reduce(
      (
        total,
        item
      ) =>
        total +
        numericValue(
          item.impact_hours
        ),
      0
    );

  const approvedReports =
    reports.filter(
      (item) =>
        item.status ===
        'approved'
    ).length;

  const draftReports =
    reports.filter(
      (item) =>
        item.status ===
        'draft'
    ).length;

  const submittedReports =
    reports.filter(
      (item) =>
        item.status ===
        'submitted'
    ).length;

  const reviewedReports =
    reports.filter(
      (item) =>
        item.status ===
        'reviewed'
    ).length;

  const maxWorkers =
    Math.max(
      1,
      ...latestReports.map(
        (item) =>
          workforceTotalsByReport.get(
            item.id
          )?.workers ||
          0
      )
    );

  const maxLaborHours =
    Math.max(
      1,
      ...latestReports.map(
        (item) =>
          workforceTotalsByReport.get(
            item.id
          )?.laborHours ||
          0
      )
    );

  const maxProduction =
    Math.max(
      1,
      ...latestReports.map(
        (item) => {
          const data =
            productionByReport.get(
              item.id
            );

          return Math.max(
            data?.planned ||
              0,
            data?.actual ||
              0
          );
        }
      )
    );

  if (
    isLoading
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.statePanel
          }
        >
          Loading Operational Dashboard...
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !project
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.statePanel
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            OPERATIONAL DASHBOARD
          </p>

          <h1
            className={
              styles.stateTitle
            }
          >
            Dashboard unavailable
          </h1>

          <p
            className={
              styles.stateText
            }
          >
            {errorMessage ||
              'The dashboard could not be loaded.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            FIELD MANAGEMENT
          </p>

          <h1
            className={
              styles.title
            }
          >
            Operational Dashboard
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            {project.code ||
              'Unassigned'}
            {' · '}
            {project.name}
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href={`/dashboard/projects/daily-reports?projectId=${project.id}`}
            className={
              styles.secondaryButton
            }
          >
            Daily Reports
          </Link>

          {latestReport && (
            <Link
              href={`/dashboard/projects/daily-reports/${latestReport.id}`}
              className={
                styles.primaryButton
              }
            >
              Open Latest Report
            </Link>
          )}
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
      >
        <SummaryCard
          label="Today Workforce"
          value={
            latestWorkforce.workers
          }
          helper={
            latestReport
              ? formatDate(
                  latestReport.report_date
                )
              : 'No reports yet'
          }
          tone="success"
        />

        <SummaryCard
          label="Today Labor-Hours"
          value={
            latestWorkforce.laborHours.toFixed(
              1
            )
          }
        />

        <SummaryCard
          label="Production Records"
          value={
            latestProduction.records
          }
        />

        <SummaryCard
          label="Open Issues"
          value={
            openIssues
          }
          helper={`${criticalIssues} critical`}
          tone={
            criticalIssues >
            0
              ? 'danger'
              : openIssues >
                  0
                ? 'warning'
                : undefined
          }
        />

        <SummaryCard
          label="Safety Events"
          value={
            safetyEvents
          }
          tone={
            safetyEvents >
            0
              ? 'warning'
              : 'success'
          }
        />

        <SummaryCard
          label="Weather Impact"
          value={`${weatherImpactHours.toFixed(
            1
          )} h`}
        />

        <SummaryCard
          label="Approved Reports"
          value={
            approvedReports
          }
        />

        <SummaryCard
          label="Total Reports"
          value={
            reports.length
          }
        />
      </section>

      <section
        className={
          styles.dashboardGrid
        }
      >
        <div
          className={
            styles.largePanel
          }
        >
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <p
                className={
                  styles.panelEyebrow
                }
              >
                WORKFORCE TREND
              </p>

              <h2
                className={
                  styles.panelTitle
                }
              >
                Workers & Labor-Hours
              </h2>
            </div>
          </div>

          <div
            className={
              styles.dualTrendGrid
            }
          >
            <div>
              <p
                className={
                  styles.chartLabel
                }
              >
                WORKERS
              </p>

              {latestReports.map(
                (item) => (
                  <MiniBar
                    key={
                      item.id
                    }
                    label={
                      formatShortDate(
                        item.report_date
                      )
                    }
                    value={
                      workforceTotalsByReport.get(
                        item.id
                      )?.workers ||
                      0
                    }
                    max={
                      maxWorkers
                    }
                  />
                )
              )}
            </div>

            <div>
              <p
                className={
                  styles.chartLabel
                }
              >
                LABOR-HOURS
              </p>

              {latestReports.map(
                (item) => (
                  <MiniBar
                    key={
                      item.id
                    }
                    label={
                      formatShortDate(
                        item.report_date
                      )
                    }
                    value={
                      Number(
                        (
                          workforceTotalsByReport.get(
                            item.id
                          )?.laborHours ||
                          0
                        ).toFixed(
                          1
                        )
                      )
                    }
                    max={
                      maxLaborHours
                    }
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div
          className={
            styles.largePanel
          }
        >
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <p
                className={
                  styles.panelEyebrow
                }
              >
                PRODUCTION PERFORMANCE
              </p>

              <h2
                className={
                  styles.panelTitle
                }
              >
                Planned vs Actual
              </h2>
            </div>
          </div>

          <div
            className={
              styles.productionTrend
            }
          >
            {latestReports.map(
              (item) => {
                const data =
                  productionByReport.get(
                    item.id
                  ) || {
                    planned: 0,
                    actual: 0,
                  };

                return (
                  <div
                    key={
                      item.id
                    }
                    className={
                      styles.productionDay
                    }
                  >
                    <div
                      className={
                        styles.productionDate
                      }
                    >
                      {formatShortDate(
                        item.report_date
                      )}
                    </div>

                    <div
                      className={
                        styles.productionBars
                      }
                    >
                      <MiniBar
                        label="Plan"
                        value={
                          Number(
                            data.planned.toFixed(
                              2
                            )
                          )
                        }
                        max={
                          maxProduction
                        }
                      />

                      <MiniBar
                        label="Actual"
                        value={
                          Number(
                            data.actual.toFixed(
                              2
                            )
                          )
                        }
                        max={
                          maxProduction
                        }
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      <section
        className={
          styles.secondaryGrid
        }
      >
        <div
          className={
            styles.panel
          }
        >
          <p
            className={
              styles.panelEyebrow
            }
          >
            REPORT STATUS
          </p>

          <h2
            className={
              styles.panelTitle
            }
          >
            Daily Report Workflow
          </h2>

          <div
            className={
              styles.statusList
            }
          >
            <div>
              <span>
                Approved
              </span>

              <strong>
                {
                  approvedReports
                }
              </strong>
            </div>

            <div>
              <span>
                Reviewed
              </span>

              <strong>
                {
                  reviewedReports
                }
              </strong>
            </div>

            <div>
              <span>
                Submitted
              </span>

              <strong>
                {
                  submittedReports
                }
              </strong>
            </div>

            <div>
              <span>
                Draft
              </span>

              <strong>
                {
                  draftReports
                }
              </strong>
            </div>
          </div>
        </div>

        <div
          className={
            styles.panel
          }
        >
          <p
            className={
              styles.panelEyebrow
            }
          >
            ISSUES & CONSTRAINTS
          </p>

          <h2
            className={
              styles.panelTitle
            }
          >
            Field Attention
          </h2>

          <div
            className={
              styles.statusList
            }
          >
            <div>
              <span>
                Open Issues
              </span>

              <strong>
                {openIssues}
              </strong>
            </div>

            <div>
              <span>
                Critical
              </span>

              <strong>
                {criticalIssues}
              </strong>
            </div>

            <div>
              <span>
                Constraint Candidates
              </span>

              <strong>
                {
                  constraintCandidates
                }
              </strong>
            </div>
          </div>
        </div>

        <div
          className={
            styles.panel
          }
        >
          <p
            className={
              styles.panelEyebrow
            }
          >
            WEATHER & SAFETY
          </p>

          <h2
            className={
              styles.panelTitle
            }
          >
            Site Conditions
          </h2>

          <div
            className={
              styles.statusList
            }
          >
            <div>
              <span>
                Weather Impact
              </span>

              <strong>
                {weatherImpactHours.toFixed(
                  1
                )}{' '}
                h
              </strong>
            </div>

            <div>
              <span>
                Safety Events
              </span>

              <strong>
                {safetyEvents}
              </strong>
            </div>

            <div>
              <span>
                Reports Analyzed
              </span>

              <strong>
                {
                  reports.length
                }
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section
        className={
          styles.reportsPanel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <p
              className={
                styles.panelEyebrow
              }
            >
              RECENT DAILY REPORTS
            </p>

            <h2
              className={
                styles.panelTitle
              }
            >
              Recent Field Activity
            </h2>
          </div>
        </div>

        <div
          className={
            styles.tableWrapper
          }
        >
          <table
            className={
              styles.reportsTable
            }
          >
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Report
                </th>

                <th>
                  Status
                </th>

                <th>
                  Workforce
                </th>

                <th>
                  Labor-Hours
                </th>

                <th>
                  Production
                </th>

                <th>
                  Issues
                </th>

                <th>
                  Photos
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {latestReports.map(
                (item) => {
                  const workforceData =
                    workforceTotalsByReport.get(
                      item.id
                    ) || {
                      workers: 0,
                      laborHours: 0,
                    };

                  const productionData =
                    productionByReport.get(
                      item.id
                    ) || {
                      records: 0,
                    };

                  const issueData =
                    issuesByReport.get(
                      item.id
                    ) || {
                      open: 0,
                    };

                  const attachmentData =
                    attachmentsByReport.get(
                      item.id
                    ) || {
                      photos: 0,
                    };

                  return (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td>
                        {formatDate(
                          item.report_date
                        )}
                      </td>

                      <td>
                        DR-
                        {String(
                          item.report_number
                        ).padStart(
                          4,
                          '0'
                        )}
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {formatStatus(
                            item.status
                          )}
                        </span>
                      </td>

                      <td>
                        {
                          workforceData.workers
                        }
                      </td>

                      <td>
                        {workforceData.laborHours.toFixed(
                          1
                        )}
                      </td>

                      <td>
                        {
                          productionData.records
                        }
                      </td>

                      <td>
                        {
                          issueData.open
                        }
                      </td>

                      <td>
                        {
                          attachmentData.photos
                        }
                      </td>

                      <td>
                        <Link
                          href={`/dashboard/projects/daily-reports/${item.id}`}
                          className={
                            styles.tableLink
                          }
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


export default function OperationalDashboardPage() {
  return (
    <Suspense
      fallback={
        <main
          className={
            styles.page
          }
        >
          <div
            className={
              styles.statePanel
            }
          >
            Loading Operational Dashboard...
          </div>
        </main>
      }
    >
      <OperationalDashboardContent />
    </Suspense>
  );
}
