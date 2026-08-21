'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

import styles from './daily-reports.module.css';
import centerStyles from './daily-reports-center.module.css';

const PROJECT_COVER_BUCKET =
  'project-covers';

const SIGNED_URL_DURATION =
  60 * 60;

function formatDate(dateValue) {
  if (!dateValue) {
    return '—';
  }

  const [year, month, day] =
    dateValue.split('-');

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  ).format(date);
}

function getLocalDateKey(
  date = new Date()
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatReportNumber(
  reportNumber
) {
  if (
    reportNumber === null ||
    reportNumber === undefined
  ) {
    return 'DR-—';
  }

  return `DR-${String(
    reportNumber
  ).padStart(4, '0')}`;
}

function formatStatus(status) {
  if (!status) {
    return 'Draft';
  }

  return status
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getStatusClass(
  status,
  stylesObject
) {
  switch (status) {
    case 'approved':
      return stylesObject
        .statusApproved;

    case 'submitted':
      return stylesObject
        .statusSubmitted;

    case 'reviewed':
      return stylesObject
        .statusSubmitted;

    default:
      return stylesObject
        .statusDraft;
  }
}

function getCenterStatusClass(
  status
) {
  switch (status) {
    case 'approved':
      return centerStyles
        .statusApproved;

    case 'submitted':
      return centerStyles
        .statusSubmitted;

    case 'reviewed':
      return centerStyles
        .statusReviewed;

    default:
      return centerStyles
        .statusDraft;
  }
}

function getWeatherLabel(report) {
  if (!report) {
    return '—';
  }

  if (
    report.weather_summary
  ) {
    return report.weather_summary;
  }

  if (
    report.weather_condition
  ) {
    return report.weather_condition;
  }

  return '—';
}

function formatProjectLocation(
  project
) {
  const parts = [
    project.city,
    project.state_region,
  ].filter(Boolean);

  if (
    parts.length > 0
  ) {
    return parts.join(', ');
  }

  return (
    project.country_code ||
    'Location not specified'
  );
}

function PortfolioSummaryCard({
  label,
  value,
  helper,
  tone,
}) {
  return (
    <article
      className={`${centerStyles.summaryCard} ${
        centerStyles[
          `tone_${tone}`
        ]
      }`}
    >
      <div
        className={
          centerStyles.summaryIcon
        }
      >
        {label
          .split(' ')
          .map(
            (word) =>
              word[0]
          )
          .join('')
          .slice(0, 2)}
      </div>

      <div>
        <strong
          className={
            centerStyles.summaryValue
          }
        >
          {value}
        </strong>

        <p
          className={
            centerStyles.summaryLabel
          }
        >
          {label}
        </p>

        <span
          className={
            centerStyles.summaryHelper
          }
        >
          {helper}
        </span>
      </div>
    </article>
  );
}

function ProjectMetric({
  value,
  label,
  compact = false,
}) {
  return (
    <div
      className={
        centerStyles.metric
      }
    >
      <strong
        className={
          compact
            ? centerStyles
                .metricValueCompact
            : centerStyles
                .metricValue
        }
      >
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  );
}

export default function DailyReportsPage() {
  const router =
    useRouter();

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
    projectCoverUrls,
    setProjectCoverUrls,
  ] = useState({});

  const [
    allReports,
    setAllReports,
  ] = useState([]);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null);

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    todayReport,
    setTodayReport,
  ] = useState(null);

  const [
    workforceToday,
    setWorkforceToday,
  ] = useState(0);

  const [
    activitiesToday,
    setActivitiesToday,
  ] = useState(0);

  const [
    occurrencesToday,
    setOccurrencesToday,
  ] = useState(0);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const today =
    getLocalDateKey();

  useEffect(() => {
    async function loadPage() {
      setIsLoading(true);
      setErrorMessage('');

      const queryParameters =
        new URLSearchParams(
          window.location.search
        );

      const projectId =
        queryParameters.get(
          'projectId'
        );

      const {
        data: userData,
        error: userError,
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
        data: projectData,
        error: projectError,
      } =
        await supabase
          .from('projects')
          .select(`
            id,
            code,
            name,
            client_name,
            organization_id,
            status,
            city,
            state_region,
            country_code,
            cover_image_path,
            created_at
          `)
          .neq(
            'status',
            'archived'
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          );

      if (projectError) {
        setErrorMessage(
          projectError.message
        );

        setIsLoading(false);
        return;
      }

      const availableProjects =
        projectData || [];

      setProjects(
        availableProjects
      );

      /*
       * ------------------------------------------------------
       * LOAD PROJECT COVER IMAGES
       * ------------------------------------------------------
       */

      const coverEntries =
        await Promise.all(
          availableProjects.map(
            async (project) => {
              if (
                !project.cover_image_path
              ) {
                return [
                  project.id,
                  '',
                ];
              }

              const {
                data:
                  signedData,
                error:
                  signedError,
              } =
                await supabase.storage
                  .from(
                    PROJECT_COVER_BUCKET
                  )
                  .createSignedUrl(
                    project.cover_image_path,
                    SIGNED_URL_DURATION
                  );

              if (
                signedError ||
                !signedData
                  ?.signedUrl
              ) {
                console.warn(
                  `Project cover could not be loaded for ${project.name}.`,
                  signedError
                );

                return [
                  project.id,
                  '',
                ];
              }

              return [
                project.id,
                signedData.signedUrl,
              ];
            }
          )
        );

      setProjectCoverUrls(
        Object.fromEntries(
          coverEntries
        )
      );

      /*
       * ------------------------------------------------------
       * LOAD ALL DAILY REPORTS
       * ------------------------------------------------------
       */

      if (
        availableProjects.length ===
        0
      ) {
        setAllReports([]);
        setSelectedProject(
          null
        );
        setReports([]);
        setTodayReport(null);
        setWorkforceToday(0);
        setActivitiesToday(0);
        setOccurrencesToday(0);
        setIsLoading(false);
        return;
      }

      const projectIds =
        availableProjects.map(
          (project) =>
            project.id
        );

      const {
        data: allReportsData,
        error: allReportsError,
      } =
        await supabase
          .from(
            'daily_reports'
          )
          .select('*')
          .in(
            'project_id',
            projectIds
          )
          .order(
            'report_date',
            {
              ascending:
                false,
            }
          )
          .order(
            'report_number',
            {
              ascending:
                false,
            }
          );

      if (
        allReportsError
      ) {
        setErrorMessage(
          allReportsError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedAllReports =
        allReportsData || [];

      setAllReports(
        loadedAllReports
      );

      /*
       * ------------------------------------------------------
       * PROJECT PORTFOLIO MODE
       * ------------------------------------------------------
       *
       * No projectId:
       * show project cards.
       */

      if (!projectId) {
        setSelectedProject(
          null
        );

        setReports([]);
        setTodayReport(null);
        setWorkforceToday(0);
        setActivitiesToday(0);
        setOccurrencesToday(0);

        setIsLoading(false);
        return;
      }

      /*
       * ------------------------------------------------------
       * PROJECT DAILY REPORT CENTER MODE
       * ------------------------------------------------------
       */

      const activeProject =
        availableProjects.find(
          (project) =>
            project.id ===
            projectId
        ) || null;

      if (!activeProject) {
        setErrorMessage(
          'The selected project could not be found or is no longer available.'
        );

        setSelectedProject(
          null
        );

        setReports([]);
        setTodayReport(null);

        setIsLoading(false);
        return;
      }

      setSelectedProject(
        activeProject
      );

      const loadedReports =
        loadedAllReports.filter(
          (report) =>
            report.project_id ===
            activeProject.id
        );

      setReports(
        loadedReports
      );

      const currentReport =
        loadedReports.find(
          (report) =>
            report.report_date ===
            today
        ) || null;

      setTodayReport(
        currentReport
      );

      if (!currentReport) {
        setWorkforceToday(0);
        setActivitiesToday(0);
        setOccurrencesToday(0);

        setIsLoading(false);
        return;
      }

      /*
       * ------------------------------------------------------
       * TODAY SNAPSHOT
       * ------------------------------------------------------
       *
       * Preserves the same queries from the existing
       * Daily Report Center.
       */

      const [
        workforceResult,
        activitiesResult,
        occurrencesResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'daily_report_workforce_roles'
            )
            .select(
              'worker_count'
            )
            .eq(
              'daily_report_id',
              currentReport.id
            ),

          supabase
            .from(
              'daily_report_activities'
            )
            .select('id')
            .eq(
              'daily_report_id',
              currentReport.id
            ),

          supabase
            .from(
              'daily_report_occurrences'
            )
            .select('id')
            .eq(
              'daily_report_id',
              currentReport.id
            ),
        ]);

      if (
        !workforceResult.error
      ) {
        const totalWorkforce =
          (
            workforceResult.data ||
            []
          ).reduce(
            (
              total,
              role
            ) =>
              total +
              Number(
                role.worker_count ||
                  0
              ),
            0
          );

        setWorkforceToday(
          totalWorkforce
        );
      }

      if (
        !activitiesResult.error
      ) {
        setActivitiesToday(
          activitiesResult.data
            ?.length || 0
        );
      }

      if (
        !occurrencesResult.error
      ) {
        setOccurrencesToday(
          occurrencesResult.data
            ?.length || 0
        );
      }

      setIsLoading(false);
    }

    loadPage();
  }, [
    supabase,
    today,
  ]);

  /*
   * ==========================================================
   * PORTFOLIO DATA
   * ==========================================================
   */

  const reportsByProject =
    useMemo(() => {
      const map =
        new Map();

      projects.forEach(
        (project) => {
          map.set(
            project.id,
            []
          );
        }
      );

      allReports.forEach(
        (report) => {
          if (
            !map.has(
              report.project_id
            )
          ) {
            map.set(
              report.project_id,
              []
            );
          }

          map
            .get(
              report.project_id
            )
            .push(report);
        }
      );

      return map;
    }, [
      projects,
      allReports,
    ]);

  const projectCards =
    useMemo(
      () =>
        projects.map(
          (project) => {
            const projectReports =
              reportsByProject.get(
                project.id
              ) || [];

            const latestReport =
              projectReports[0] ||
              null;

            const draftCount =
              projectReports.filter(
                (report) =>
                  report.status ===
                  'draft'
              ).length;

            return {
              ...project,

              reports:
                projectReports,

              latestReport,

              draftCount,

              coverUrl:
                projectCoverUrls[
                  project.id
                ] || '',
            };
          }
        ),
      [
        projects,
        reportsByProject,
        projectCoverUrls,
      ]
    );

  const totalReports =
    allReports.length;

  const totalDraft =
    allReports.filter(
      (report) =>
        report.status ===
        'draft'
    ).length;

  const totalSubmitted =
    allReports.filter(
      (report) =>
        report.status ===
        'submitted'
    ).length;

  const totalReviewed =
    allReports.filter(
      (report) =>
        report.status ===
        'reviewed'
    ).length;

  const totalApproved =
    allReports.filter(
      (report) =>
        report.status ===
        'approved'
    ).length;

  /*
   * ==========================================================
   * SELECTED PROJECT DATA
   * ==========================================================
   */

  const filteredReports =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      if (
        !normalizedSearch
      ) {
        return reports;
      }

      return reports.filter(
        (report) => {
          const reportNumber =
            formatReportNumber(
              report.report_number
            ).toLowerCase();

          const reportDate =
            formatDate(
              report.report_date
            ).toLowerCase();

          const status =
            formatStatus(
              report.status
            ).toLowerCase();

          return (
            reportNumber.includes(
              normalizedSearch
            ) ||
            reportDate.includes(
              normalizedSearch
            ) ||
            status.includes(
              normalizedSearch
            )
          );
        }
      );
    }, [
      reports,
      searchTerm,
    ]);

  const openReports =
    reports.filter(
      (report) =>
        report.status ===
        'draft'
    ).length;

  function openProject(
    projectId
  ) {
    router.push(
      `/dashboard/projects/daily-reports?projectId=${projectId}`
    );
  }

  function openPortfolio() {
    router.push(
      '/dashboard/projects/daily-reports'
    );
  }

  function openNewDailyReport() {
    const projectQuery =
      selectedProject?.id
        ? `?projectId=${selectedProject.id}`
        : '';

    router.push(
      `/dashboard/projects/daily-reports/new${projectQuery}`
    );
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (
    isLoading &&
    projects.length === 0
  ) {
    return (
      <main
        className={
          centerStyles.page
        }
      >
        <section
          className={
            centerStyles.projectsPanel
          }
        >
          <div
            className={
              centerStyles.emptyState
            }
          >
            <div
              className={
                centerStyles.emptyIcon
              }
            >
              DR
            </div>

            <h3>
              Loading Daily Reports
            </h3>

            <p>
              Loading project
              portfolio and field
              records...
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * ==========================================================
   * PORTFOLIO VIEW
   * ==========================================================
   */

  if (!selectedProject) {
    return (
      <main
        className={
          centerStyles.page
        }
      >
        <section
          className={
            centerStyles.header
          }
        >
          <div>
            <p
              className={
                centerStyles.eyebrow
              }
            >
              FIELD MANAGEMENT
            </p>

            <h1
              className={
                centerStyles.title
              }
            >
              Daily Reports
            </h1>

            <p
              className={
                centerStyles.description
              }
            >
              Select a project to
              access its field
              reporting workspace,
              latest Daily Report and
              reporting history.
            </p>
          </div>

          <button
            type="button"
            className={
              centerStyles.primaryButton
            }
            onClick={
              openNewDailyReport
            }
          >
            + New Daily Report
          </button>
        </section>

        {errorMessage && (
          <div
            style={{
              padding:
                '12px 14px',
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

        <section
          className={
            centerStyles.summaryGrid
          }
        >
          <PortfolioSummaryCard
            label="TOTAL REPORTS"
            value={
              totalReports
            }
            helper="All projects"
            tone="teal"
          />

          <PortfolioSummaryCard
            label="DRAFT"
            value={
              totalDraft
            }
            helper="Needs attention"
            tone="amber"
          />

          <PortfolioSummaryCard
            label="SUBMITTED"
            value={
              totalSubmitted
            }
            helper="In review"
            tone="blue"
          />

          <PortfolioSummaryCard
            label="REVIEWED"
            value={
              totalReviewed
            }
            helper="Ready for approval"
            tone="purple"
          />

          <PortfolioSummaryCard
            label="APPROVED"
            value={
              totalApproved
            }
            helper="Completed"
            tone="green"
          />

          <PortfolioSummaryCard
            label="PROJECTS"
            value={
              projects.length
            }
            helper="Available projects"
            tone="teal"
          />
        </section>

        <section
          className={
            centerStyles.projectsPanel
          }
        >
          <div
            className={
              centerStyles.projectsHeader
            }
          >
            <div>
              <p
                className={
                  centerStyles.sectionEyebrow
                }
              >
                PROJECT PORTFOLIO
              </p>

              <h2
                className={
                  centerStyles.sectionTitle
                }
              >
                Projects & Daily Reports
              </h2>

              <p
                className={
                  centerStyles.sectionDescription
                }
              >
                Select a project to
                open its Daily Report
                Center.
              </p>
            </div>

            <span
              className={
                centerStyles.projectCount
              }
            >
              {projects.length ===
              1
                ? '1 project'
                : `${projects.length} projects`}
            </span>
          </div>

          {projectCards.length ===
          0 ? (
            <div
              className={
                centerStyles.emptyState
              }
            >
              <div
                className={
                  centerStyles.emptyIcon
                }
              >
                PR
              </div>

              <h3>
                No projects available
              </h3>

              <p>
                Create a project
                before starting field
                Daily Reports.
              </p>

              <button
                type="button"
                className={
                  centerStyles.primaryButton
                }
                onClick={() =>
                  router.push(
                    '/dashboard/projects/setup?mode=new'
                  )
                }
              >
                Create Project
              </button>
            </div>
          ) : (
            <div
              className={
                centerStyles.projectGrid
              }
            >
              {projectCards.map(
                (project) => {
                  const latest =
                    project.latestReport;

                  return (
                    <article
                      key={
                        project.id
                      }
                      className={
                        centerStyles.projectCard
                      }
                    >
                      <div
                        className={
                          centerStyles.coverArea
                        }
                      >
                        {project.coverUrl ? (
                          <img
                            src={
                              project.coverUrl
                            }
                            alt={`${project.name} project`}
                            className={
                              centerStyles.coverImage
                            }
                          />
                        ) : (
                          <div
                            className={
                              centerStyles.coverPlaceholder
                            }
                          >
                            <span>
                              PROJECT
                            </span>

                            <strong>
                              {project.code ||
                                'Unassigned'}
                            </strong>

                            <small>
                              Add a project
                              image in Project
                              Setup
                            </small>
                          </div>
                        )}

                        {latest && (
                          <span
                            className={`${centerStyles.reportStatus} ${getCenterStatusClass(
                              latest.status
                            )}`}
                          >
                            {formatStatus(
                              latest.status
                            )}
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          centerStyles.cardBody
                        }
                      >
                        <div
                          className={
                            centerStyles.projectIdentity
                          }
                        >
                          <p
                            className={
                              centerStyles.projectCode
                            }
                          >
                            {project.code ||
                              'Unassigned'}
                          </p>

                          <h3
                            className={
                              centerStyles.projectName
                            }
                          >
                            {
                              project.name
                            }
                          </h3>

                          <p
                            className={
                              centerStyles.projectClient
                            }
                          >
                            {project.client_name ||
                              'Client not specified'}
                          </p>

                          <p
                            className={
                              centerStyles.projectLocation
                            }
                          >
                            {formatProjectLocation(
                              project
                            )}
                          </p>
                        </div>

                        <div
                          className={
                            centerStyles.latestReport
                          }
                        >
                          <div>
                            <span>
                              Last Report
                            </span>

                            <strong>
                              {latest
                                ? formatDate(
                                    latest.report_date
                                  )
                                : 'No reports yet'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Report #
                            </span>

                            <strong>
                              {latest
                                ? formatReportNumber(
                                    latest.report_number
                                  )
                                : '—'}
                            </strong>
                          </div>
                        </div>

                        <div
                          className={
                            centerStyles.metrics
                          }
                        >
                          <ProjectMetric
                            value={
                              project
                                .reports
                                .length
                            }
                            label="Reports"
                          />

                          <ProjectMetric
                            value={
                              project
                                .draftCount
                            }
                            label="Draft"
                          />

                          <ProjectMetric
                            value={
                              latest
                                ? formatStatus(
                                    latest.status
                                  )
                                : '—'
                            }
                            label="Latest Status"
                            compact
                          />
                        </div>

                        <div
                          className={
                            centerStyles.cardActions
                          }
                        >
                          <button
                            type="button"
                            className={
                              centerStyles.primaryButton
                            }
                            onClick={() =>
                              openProject(
                                project.id
                              )
                            }
                          >
                            Open Project
                          </button>

                          {latest && (
                            <button
                              type="button"
                              className={
                                centerStyles.secondaryButton
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects/daily-reports/${latest.id}`
                                )
                              }
                            >
                              Latest Report
                            </button>
                          )}

                          {!latest && (
                            <button
                              type="button"
                              className={
                                centerStyles.secondaryButton
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects/daily-reports/new?projectId=${project.id}`
                                )
                              }
                            >
                              Create Report
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>
    );
  }

  /*
   * ==========================================================
   * SELECTED PROJECT DAILY REPORT CENTER
   * ==========================================================
   *
   * This preserves the existing operational Daily Report
   * Center behavior.
   */

  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.pageHeader
        }
      >
        <div>
          <button
            type="button"
            onClick={
              openPortfolio
            }
            style={{
              display:
                'inline-flex',
              alignItems:
                'center',
              gap:
                '6px',
              marginBottom:
                '12px',
              padding: 0,
              color:
                '#087f73',
              border: 0,
              background:
                'transparent',
              cursor:
                'pointer',
              fontFamily:
                'inherit',
              fontSize:
                '0.72rem',
              fontWeight:
                800,
            }}
          >
            ← All Projects
          </button>

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
            Daily Report Center
          </h1>

          <p
            className={
              styles.description
            }
          >
            {selectedProject.code ||
              'Unassigned'}{' '}
            ·{' '}
            {selectedProject.name}
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={
            openNewDailyReport
          }
        >
          + New Daily Report
        </button>
      </section>

      {errorMessage && (
        <div
          style={{
            marginBottom:
              '18px',
            padding:
              '12px 14px',
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

      {projectCoverUrls[
        selectedProject.id
      ] && (
        <section
          style={{
            position:
              'relative',
            height:
              '220px',
            marginBottom:
              '22px',
            overflow:
              'hidden',
            border:
              '1px solid #dce5ed',
            borderRadius:
              '16px',
            background:
              '#edf4f6',
          }}
        >
          <img
            src={
              projectCoverUrls[
                selectedProject.id
              ]
            }
            alt={`${selectedProject.name} project`}
            style={{
              display:
                'block',
              width:
                '100%',
              height:
                '100%',
              objectFit:
                'cover',
            }}
          />

          <div
            style={{
              position:
                'absolute',
              inset:
                'auto 0 0 0',
              padding:
                '28px 22px 18px',
              background:
                'linear-gradient(transparent, rgba(3, 25, 42, 0.82))',
              color:
                '#ffffff',
            }}
          >
            <div
              style={{
                fontSize:
                  '0.72rem',
                fontWeight:
                  800,
                opacity:
                  0.82,
              }}
            >
              {selectedProject.code ||
                'Unassigned'}
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                fontSize:
                  '1.3rem',
                fontWeight:
                  850,
              }}
            >
              {
                selectedProject.name
              }
            </div>
          </div>
        </section>
      )}

      <section
        className={
          styles.metricsGrid
        }
      >
        <article
          className={
            styles.metricCard
          }
        >
          <div
            className={
              styles.metricHeader
            }
          >
            <span>
              Reports
            </span>

            <span
              className={
                styles.metricIcon
              }
            >
              DR
            </span>
          </div>

          <strong
            className={
              styles.metricValue
            }
          >
            {reports.length}
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            Total records
          </span>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <div
            className={
              styles.metricHeader
            }
          >
            <span>
              Open
            </span>

            <span
              className={
                styles.metricIcon
              }
            >
              OP
            </span>
          </div>

          <strong
            className={
              styles.metricValue
            }
          >
            {openReports}
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            Draft reports
          </span>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <div
            className={
              styles.metricHeader
            }
          >
            <span>
              Workforce today
            </span>

            <span
              className={
                styles.metricIcon
              }
            >
              WF
            </span>
          </div>

          <strong
            className={
              styles.metricValue
            }
          >
            {workforceToday}
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            People on site
          </span>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <div
            className={
              styles.metricHeader
            }
          >
            <span>
              Activities today
            </span>

            <span
              className={
                styles.metricIcon
              }
            >
              AC
            </span>
          </div>

          <strong
            className={
              styles.metricValue
            }
          >
            {activitiesToday}
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            Recorded activities
          </span>
        </article>
      </section>

      <section
        className={
          styles.historyCard
        }
      >
        <div
          className={
            styles.historyHeader
          }
        >
          <div>
            <p
              className={
                styles.sectionEyebrow
              }
            >
              DAILY REPORTS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Report history
            </h2>
          </div>

          <div
            className={
              styles.historyActions
            }
          >
            <input
              type="search"
              placeholder="Search reports..."
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target
                    .value
                )
              }
              className={
                styles.searchInput
              }
            />

            <button
              type="button"
              className={
                styles.secondaryButton
              }
            >
              Filters
            </button>
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              padding:
                '28px',
              color:
                '#64748b',
              fontSize:
                '0.8rem',
            }}
          >
            Loading Daily Reports...
          </div>
        ) : filteredReports.length ===
          0 ? (
          <div
            style={{
              padding:
                '32px',
              color:
                '#64748b',
              fontSize:
                '0.8rem',
            }}
          >
            No Daily Reports
            found for this
            project.
          </div>
        ) : (
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table
              className={
                styles.reportTable
              }
            >
              <thead>
                <tr>
                  <th>
                    REPORT
                  </th>

                  <th>
                    DATE
                  </th>

                  <th>
                    PROJECT
                  </th>

                  <th>
                    WEATHER
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredReports.map(
                  (report) => (
                    <tr
                      key={
                        report.id
                      }
                    >
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/daily-reports/${report.id}`
                            )
                          }
                          style={{
                            padding:
                              0,
                            color:
                              '#1677d2',
                            border:
                              0,
                            background:
                              'transparent',
                            cursor:
                              'pointer',
                            fontFamily:
                              'inherit',
                            fontSize:
                              'inherit',
                            fontWeight:
                              800,
                          }}
                        >
                          {formatReportNumber(
                            report.report_number
                          )}
                        </button>
                      </td>

                      <td>
                        {formatDate(
                          report.report_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {
                            selectedProject.name
                          }
                        </strong>

                        <span
                          style={{
                            display:
                              'block',
                            marginTop:
                              '2px',
                            color:
                              '#94a3b8',
                            fontSize:
                              '0.68rem',
                          }}
                        >
                          Daily field
                          record
                        </span>
                      </td>

                      <td>
                        {getWeatherLabel(
                          report
                        )}
                      </td>

                      <td>
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
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/daily-reports/${report.id}`
                            )
                          }
                          style={{
                            padding:
                              '6px 10px',
                            color:
                              '#64748b',
                            border:
                              0,
                            background:
                              'transparent',
                            cursor:
                              'pointer',
                            fontSize:
                              '1rem',
                            fontWeight:
                              800,
                          }}
                          aria-label="Open Daily Report"
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className={
          styles.bottomGrid
        }
      >
        <article
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
                TODAY
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Field snapshot
              </h2>
            </div>

            <span
              className={
                styles.statusApproved
              }
            >
              {todayReport
                ? 'Active'
                : 'No report'}
            </span>
          </div>

          <div
            className={
              styles.snapshotGrid
            }
          >
            <div
              className={
                styles.snapshotItem
              }
            >
              <span>
                Weather
              </span>

              <strong>
                {getWeatherLabel(
                  todayReport
                )}
              </strong>
            </div>

            <div
              className={
                styles.snapshotItem
              }
            >
              <span>
                Workforce
              </span>

              <strong>
                {
                  workforceToday
                }
              </strong>
            </div>

            <div
              className={
                styles.snapshotItem
              }
            >
              <span>
                Activities
              </span>

              <strong>
                {
                  activitiesToday
                }
              </strong>
            </div>

            <div
              className={
                styles.snapshotItem
              }
            >
              <span>
                Occurrences
              </span>

              <strong>
                {
                  occurrencesToday
                }
              </strong>
            </div>
          </div>
        </article>

        <article
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
                INTEGRATION
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Production Control
              </h2>
            </div>

            <span
              className={
                styles.statusSubmitted
              }
            >
              Ready
            </span>
          </div>

          <p
            className={
              styles.integrationText
            }
          >
            Daily Reports can
            operate independently
            or connect field
            records with RitsuFlow
            production planning
            and control.
          </p>

          <div
            className={
              styles.integrationFlow
            }
          >
            <span>
              Daily Report
            </span>

            <span
              className={
                styles.flowArrow
              }
            >
              →
            </span>

            <span>
              Production Data
            </span>

            <span
              className={
                styles.flowArrow
              }
            >
              →
            </span>

            <span>
              Control
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}
