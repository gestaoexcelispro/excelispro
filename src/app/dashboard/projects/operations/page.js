'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  createClient,
} from '../../../../lib/supabase/client';

import styles from './operations-dashboard.module.css';

const DAYS_TO_SHOW = 7;

function getLocalDateString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

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

export default function OperationalDashboardPage() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    projects,
    setProjects,
  ] = useState([]);

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
          projectsData,

        error:
          projectsError,
      } =
        await supabase
          .from(
            'projects'
          )
          .select(`
            id,
            organization_id,
            code,
            name,
            client_name,
            city,
            state_region,
            country_code,
            status,
            created_at
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          );

      if (
        projectsError
      ) {
        setErrorMessage(
          projectsError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedProjects =
        projectsData ||
        [];

      const projectIds =
        loadedProjects.map(
          (project) =>
            project.id
        );

      let reportsData = [];

      if (
        projectIds.length >
        0
      ) {
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
              submitted_at,
              reviewed_at,
              approved_at,
              created_at
            `)
            .in(
              'project_id',
              projectIds
            )
            .order(
              'report_date',
              {
                ascending: false,
              }
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

        if (
          error
        ) {
          setErrorMessage(
            error.message
          );

          setIsLoading(false);
          return;
        }

        reportsData =
          data ||
          [];
      }

      const reportIds =
        reportsData.map(
          (report) =>
            report.id
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

      setProjects(
        loadedProjects
      );

      setReports(
        reportsData
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
    supabase,
  ]);

  const today =
    getLocalDateString();

  const projectMap =
    useMemo(
      () =>
        new Map(
          projects.map(
            (project) => [
              project.id,
              project,
            ]
          )
        ),
      [
        projects,
      ]
    );

  const reportMap =
    useMemo(
      () =>
        new Map(
          reports.map(
            (report) => [
              report.id,
              report,
            ]
          )
        ),
      [
        reports,
      ]
    );

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
              impacted: 0,
              constraints: 0,
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

          if (
            item.production_impact &&
            item.production_impact !==
              'none'
          ) {
            current.impacted +=
              1;
          }

          if (
            item.create_constraint
          ) {
            current.constraints +=
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

  const safetyByReport =
    useMemo(() => {
      const result =
        new Map();

      safety.forEach(
        (item) => {
          const events =
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
            );

          result.set(
            item.daily_report_id,
            {
              events,
              status:
                item.overall_status,
            }
          );
        }
      );

      return result;
    }, [
      safety,
    ]);

  const weatherByReport =
    useMemo(() => {
      const result =
        new Map();

      weather.forEach(
        (item) => {
          const current =
            result.get(
              item.daily_report_id
            ) || {
              impactHours: 0,
              impactedPeriods: 0,
            };

          current.impactHours +=
            numericValue(
              item.impact_hours
            );

          if (
            item.production_impact &&
            item.production_impact !==
              'none'
          ) {
            current.impactedPeriods +=
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
      weather,
    ]);

  const reportsToday =
    reports.filter(
      (report) =>
        report.report_date ===
        today
    );

  const reportIdsToday =
    new Set(
      reportsToday.map(
        (report) =>
          report.id
      )
    );

  const activeProjects =
    projects.filter(
      (project) =>
        project.status ===
        'active'
    );

  const todayWorkforce =
    reportsToday.reduce(
      (
        total,
        report
      ) =>
        total +
        (
          workforceTotalsByReport.get(
            report.id
          )?.workers ||
          0
        ),
      0
    );

  const todayLaborHours =
    reportsToday.reduce(
      (
        total,
        report
      ) =>
        total +
        (
          workforceTotalsByReport.get(
            report.id
          )?.laborHours ||
          0
        ),
      0
    );

  const todayProductionRecords =
    production.filter(
      (item) =>
        reportIdsToday.has(
          item.daily_report_id
        )
    ).length;

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

  const pendingApproval =
    reports.filter(
      (report) =>
        report.status ===
          'submitted' ||
        report.status ===
          'reviewed'
    ).length;

  const approvedReports =
    reports.filter(
      (report) =>
        report.status ===
        'approved'
    ).length;

  const draftReports =
    reports.filter(
      (report) =>
        report.status ===
        'draft'
    ).length;

  const submittedReports =
    reports.filter(
      (report) =>
        report.status ===
        'submitted'
    ).length;

  const reviewedReports =
    reports.filter(
      (report) =>
        report.status ===
        'reviewed'
    ).length;

  const lastSevenDates =
    useMemo(() => {
      const dates = [];

      const base =
        new Date();

      for (
        let index = 0;
        index < DAYS_TO_SHOW;
        index += 1
      ) {
        const date =
          new Date(
            base
          );

        date.setDate(
          base.getDate() -
          index
        );

        const year =
          date.getFullYear();

        const month =
          String(
            date.getMonth() +
              1
          ).padStart(
            2,
            '0'
          );

        const day =
          String(
            date.getDate()
          ).padStart(
            2,
            '0'
          );

        dates.push(
          `${year}-${month}-${day}`
        );
      }

      return dates.reverse();
    }, []);

  const dailyPortfolioTrend =
    useMemo(
      () =>
        lastSevenDates.map(
          (date) => {
            const dayReports =
              reports.filter(
                (report) =>
                  report.report_date ===
                  date
              );

            let workers = 0;
            let laborHours = 0;
            let planned = 0;
            let actual = 0;

            dayReports.forEach(
              (report) => {
                const workforceData =
                  workforceTotalsByReport.get(
                    report.id
                  );

                const productionData =
                  productionByReport.get(
                    report.id
                  );

                workers +=
                  workforceData
                    ?.workers ||
                  0;

                laborHours +=
                  workforceData
                    ?.laborHours ||
                  0;

                planned +=
                  productionData
                    ?.planned ||
                  0;

                actual +=
                  productionData
                    ?.actual ||
                  0;
              }
            );

            return {
              date,
              reports:
                dayReports.length,
              workers,
              laborHours,
              planned,
              actual,
            };
          }
        ),
      [
        lastSevenDates,
        reports,
        workforceTotalsByReport,
        productionByReport,
      ]
    );

  const maxWorkers =
    Math.max(
      1,
      ...dailyPortfolioTrend.map(
        (item) =>
          item.workers
      )
    );

  const maxLaborHours =
    Math.max(
      1,
      ...dailyPortfolioTrend.map(
        (item) =>
          item.laborHours
      )
    );

  const maxProduction =
    Math.max(
      1,
      ...dailyPortfolioTrend.map(
        (item) =>
          Math.max(
            item.planned,
            item.actual
          )
      )
    );

  const projectOperations =
    useMemo(
      () =>
        projects.map(
          (project) => {
            const projectReports =
              reports.filter(
                (report) =>
                  report.project_id ===
                  project.id
              );

            const latestReport =
              projectReports[0] ||
              null;

            const todayReport =
              projectReports.find(
                (report) =>
                  report.report_date ===
                  today
              ) ||
              null;

            const operationalReport =
              todayReport ||
              latestReport;

            const workforceData =
              operationalReport
                ? workforceTotalsByReport.get(
                    operationalReport.id
                  )
                : null;

            const productionData =
              operationalReport
                ? productionByReport.get(
                    operationalReport.id
                  )
                : null;

            const issueData =
              projectReports.reduce(
                (
                  totals,
                  report
                ) => {
                  const data =
                    issuesByReport.get(
                      report.id
                    );

                  totals.open +=
                    data?.open ||
                    0;

                  totals.critical +=
                    data?.critical ||
                    0;

                  return totals;
                },
                {
                  open: 0,
                  critical: 0,
                }
              );

            const projectSafetyEvents =
              projectReports.reduce(
                (
                  total,
                  report
                ) =>
                  total +
                  (
                    safetyByReport.get(
                      report.id
                    )?.events ||
                    0
                  ),
                0
              );

            const photoCount =
              operationalReport
                ? attachmentsByReport.get(
                    operationalReport.id
                  )?.photos ||
                  0
                : 0;

            return {
              project,
              latestReport,
              todayReport,
              operationalReport,

              workers:
                workforceData
                  ?.workers ||
                0,

              laborHours:
                workforceData
                  ?.laborHours ||
                0,

              productionRecords:
                productionData
                  ?.records ||
                0,

              openIssues:
                issueData.open,

              criticalIssues:
                issueData.critical,

              safetyEvents:
                projectSafetyEvents,

              photos:
                photoCount,
            };
          }
        ),
      [
        projects,
        reports,
        today,
        workforceTotalsByReport,
        productionByReport,
        issuesByReport,
        safetyByReport,
        attachmentsByReport,
      ]
    );

  const recentReports =
    reports.slice(
      0,
      10
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
    errorMessage
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
            {errorMessage}
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
            Portfolio operational
            overview across all
            accessible projects.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href="/dashboard/projects"
            className={
              styles.secondaryButton
            }
          >
            Projects
          </Link>

          <Link
            href="/dashboard/projects/daily-reports"
            className={
              styles.primaryButton
            }
          >
            Daily Reports
          </Link>
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
      >
        <SummaryCard
          label="Active Projects"
          value={
            activeProjects.length
          }
          helper={`${projects.length} total projects`}
          tone="success"
        />

        <SummaryCard
          label="Today Workforce"
          value={
            todayWorkforce
          }
          helper={`${reportsToday.length} reports today`}
          tone="success"
        />

        <SummaryCard
          label="Today Labor-Hours"
          value={
            todayLaborHours.toFixed(
              1
            )
          }
          helper="Across all projects"
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
          helper="Portfolio total"
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
          helper="Portfolio total"
        />

        <SummaryCard
          label="Reports Today"
          value={
            reportsToday.length
          }
          helper={`${activeProjects.length} active projects`}
        />

        <SummaryCard
          label="Pending Approval"
          value={
            pendingApproval
          }
          helper="Submitted or reviewed"
          tone={
            pendingApproval >
            0
              ? 'warning'
              : undefined
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
                PORTFOLIO WORKFORCE
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

              {dailyPortfolioTrend.map(
                (item) => (
                  <MiniBar
                    key={
                      item.date
                    }
                    label={
                      formatShortDate(
                        item.date
                      )
                    }
                    value={
                      item.workers
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

              {dailyPortfolioTrend.map(
                (item) => (
                  <MiniBar
                    key={
                      item.date
                    }
                    label={
                      formatShortDate(
                        item.date
                      )
                    }
                    value={
                      Number(
                        item.laborHours.toFixed(
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
                PRODUCTION ACTIVITY
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
            {dailyPortfolioTrend.map(
              (item) => (
                <div
                  key={
                    item.date
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
                      item.date
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
                          item.planned.toFixed(
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
                          item.actual.toFixed(
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
              )
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
            Portfolio Attention
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
            TODAY
          </p>

          <h2
            className={
              styles.panelTitle
            }
          >
            Field Activity
          </h2>

          <div
            className={
              styles.statusList
            }
          >
            <div>
              <span>
                Reports Today
              </span>

              <strong>
                {
                  reportsToday.length
                }
              </strong>
            </div>

            <div>
              <span>
                Production Records
              </span>

              <strong>
                {
                  todayProductionRecords
                }
              </strong>
            </div>

            <div>
              <span>
                Active Projects
              </span>

              <strong>
                {
                  activeProjects.length
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
              PROJECT OPERATIONS
            </p>

            <h2
              className={
                styles.panelTitle
              }
            >
              Portfolio Status by Project
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
                  Project
                </th>

                <th>
                  Daily Report
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
                  Open Issues
                </th>

                <th>
                  Safety
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
              {projectOperations.map(
                (item) => (
                  <tr
                    key={
                      item.project.id
                    }
                  >
                    <td>
                      <strong>
                        {item.project.code ||
                          '—'}
                      </strong>

                      <div
                        style={{
                          marginTop:
                            '3px',
                          color:
                            '#64748b',
                          fontSize:
                            '0.62rem',
                        }}
                      >
                        {
                          item.project.name
                        }
                      </div>
                    </td>

                    <td>
                      {item.operationalReport ? (
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            item.operationalReport
                              .status
                          )}`}
                        >
                          {formatStatus(
                            item.operationalReport
                              .status
                          )}
                        </span>
                      ) : (
                        'No report'
                      )}
                    </td>

                    <td>
                      {
                        item.workers
                      }
                    </td>

                    <td>
                      {item.laborHours.toFixed(
                        1
                      )}
                    </td>

                    <td>
                      {
                        item.productionRecords
                      }
                    </td>

                    <td>
                      {
                        item.openIssues
                      }

                      {item.criticalIssues >
                        0 &&
                        ` (${item.criticalIssues} critical)`}
                    </td>

                    <td>
                      {
                        item.safetyEvents
                      }
                    </td>

                    <td>
                      {
                        item.photos
                      }
                    </td>

                    <td>
                      <Link
                        href={`/dashboard/projects/daily-reports?projectId=${item.project.id}`}
                        className={
                          styles.tableLink
                        }
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              )}

              {projectOperations.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '28px',
                      color:
                        '#64748b',
                    }}
                  >
                    No projects available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  Project
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
              {recentReports.map(
                (report) => {
                  const project =
                    projectMap.get(
                      report.project_id
                    );

                  const workforceData =
                    workforceTotalsByReport.get(
                      report.id
                    ) || {
                      workers: 0,
                      laborHours: 0,
                    };

                  const productionData =
                    productionByReport.get(
                      report.id
                    ) || {
                      records: 0,
                    };

                  const issueData =
                    issuesByReport.get(
                      report.id
                    ) || {
                      open: 0,
                    };

                  const attachmentData =
                    attachmentsByReport.get(
                      report.id
                    ) || {
                      photos: 0,
                    };

                  return (
                    <tr
                      key={
                        report.id
                      }
                    >
                      <td>
                        {formatDate(
                          report.report_date
                        )}
                      </td>

                      <td>
                        {project?.code ||
                          '—'}
                      </td>

                      <td>
                        DR-
                        {String(
                          report.report_number
                        ).padStart(
                          4,
                          '0'
                        )}
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {formatStatus(
                            report.status
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
                          href={`/dashboard/projects/daily-reports/${report.id}`}
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

              {recentReports.length ===
                0 && (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '28px',
                      color:
                        '#64748b',
                    }}
                  >
                    No Daily Reports available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
