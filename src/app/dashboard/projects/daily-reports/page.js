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
      return stylesObject.statusApproved;

    case 'submitted':
    case 'reviewed':
      return stylesObject.statusSubmitted;

    default:
      return stylesObject.statusDraft;
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

      const {
        data: reportsData,
        error: reportsError,
      } =
        await supabase
          .from(
            'daily_reports'
          )
          .select('*')
          .eq(
            'project_id',
            activeProject.id
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

      if (reportsError) {
        setErrorMessage(
          reportsError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedReports =
        reportsData || [];

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

  if (isLoading) {
    return (
      <main
        className={
          centerStyles.page
        }
      >
        <section
          className={
            centerStyles.loadingPanel
          }
        >
          <div
            className={
              centerStyles.loadingMark
            }
          >
            DR
          </div>

          <div>
            <strong>
              Loading Daily Reports
            </strong>

            <p>
              Preparing your project
              portfolio...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedProject) {
    return (
      <main
        className={
          centerStyles.page
        }
      >
        <section
          className={
            centerStyles.portfolioHeader
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
              access its Daily Reports.
            </p>
          </div>
        </section>

        {errorMessage && (
          <div
            className={
              centerStyles.errorMessage
            }
          >
            {errorMessage}
          </div>
        )}

        {projects.length ===
        0 ? (
          <section
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

            <h2>
              No projects available
            </h2>

            <p>
              Create a project before
              starting Daily Reports.
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
          </section>
        ) : (
          <section
            className={
              centerStyles.projectGrid
            }
          >
            {projects.map(
              (project) => {
                const coverUrl =
                  projectCoverUrls[
                    project.id
                  ] || '';

                const progress =
                  null;

                return (
                  <button
                    type="button"
                    key={
                      project.id
                    }
                    className={
                      centerStyles.projectCard
                    }
                    onClick={() =>
                      openProject(
                        project.id
                      )
                    }
                  >
                    <div
                      className={
                        centerStyles.coverArea
                      }
                    >
                      {coverUrl ? (
                        <img
                          src={
                            coverUrl
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
                          <span
                            className={
                              centerStyles.coverPlaceholderCode
                            }
                          >
                            {project.code ||
                              'PROJECT'}
                          </span>

                          <strong>
                            Project image
                          </strong>

                          <small>
                            Add a cover photo
                            in Project Setup
                          </small>
                        </div>
                      )}

                      <div
                        className={
                          centerStyles.coverGradient
                        }
                      />

                      <div
                        className={
                          centerStyles.coverIdentity
                        }
                      >
                        <span
                          className={
                            centerStyles.coverProjectCode
                          }
                        >
                          {project.code ||
                            'Unassigned'}
                        </span>

                        <strong
                          className={
                            centerStyles.coverProjectName
                          }
                        >
                          {
                            project.name
                          }
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        centerStyles.cardBody
                      }
                    >
                      <div
                        className={
                          centerStyles.projectDetails
                        }
                      >
                        <div>
                          <span
                            className={
                              centerStyles.projectLabel
                            }
                          >
                            PROJECT
                          </span>

                          <h2
                            className={
                              centerStyles.projectName
                            }
                          >
                            {
                              project.name
                            }
                          </h2>

                          <p
                            className={
                              centerStyles.projectMeta
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
                      </div>

                      <div
                        className={
                          centerStyles.progressSection
                        }
                      >
                        <div
                          className={
                            centerStyles.progressHeader
                          }
                        >
                          <span>
                            Overall Progress
                          </span>

                          <strong>
                            {progress ===
                            null
                              ? '—'
                              : `${progress}%`}
                          </strong>
                        </div>

                        <div
                          className={
                            centerStyles.progressTrack
                          }
                        >
                          <div
                            className={
                              centerStyles.progressFill
                            }
                            style={{
                              width:
                                progress ===
                                null
                                  ? '0%'
                                  : `${progress}%`,
                            }}
                          />
                        </div>

                        <p
                          className={
                            centerStyles.progressHelper
                          }
                        >
                          {progress ===
                          null
                            ? 'Production Control data not available yet.'
                            : 'Calculated from Production Control.'}
                        </p>
                      </div>

                      <div
                        className={
                          centerStyles.cardFooter
                        }
                      >
                        <span
                          className={
                            centerStyles.openProjectText
                          }
                        >
                          Open Project
                        </span>

                        <span
                          className={
                            centerStyles.openArrow
                          }
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </section>
        )}
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
              'Unassigned'}
            {' · '}
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
                '32px 22px 18px',
              background:
                'linear-gradient(transparent, rgba(3, 25, 42, 0.82))',
              color:
                '#ffffff',
            }}
          >
            <div
              style={{
                fontSize:
                  '0.7rem',
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
                  '1.25rem',
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

        {filteredReports.length ===
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
                  <th>REPORT</th>
                  <th>DATE</th>
                  <th>PROJECT</th>
                  <th>WEATHER</th>
                  <th>STATUS</th>
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
                            padding: 0,
                            color:
                              '#1677d2',
                            border: 0,
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
                            border: 0,
                            background:
                              'transparent',
                            cursor:
                              'pointer',
                            fontSize:
                              '1rem',
                            fontWeight:
                              800,
                          }}
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
                {workforceToday}
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
                {activitiesToday}
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
                {occurrencesToday}
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
