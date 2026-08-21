'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { createClient } from '../../../../../lib/supabase/client';

import styles from './report-workspace.module.css';

const PROJECT_COVER_BUCKET =
  'project-covers';

const SIGNED_URL_DURATION =
  60 * 60;

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] =
    value
      .split('-')
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
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

function formatTime(value) {
  if (!value) {
    return '—';
  }

  return String(value)
    .slice(0, 5);
}

function getStatusClass(
  status
) {
  if (
    status === 'approved'
  ) {
    return styles.statusApproved;
  }

  if (
    status === 'reviewed'
  ) {
    return styles.statusReviewed;
  }

  if (
    status === 'submitted'
  ) {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
}

function HeroMetric({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.heroMetric
      }
    >
      <span
        className={
          styles.heroMetricLabel
        }
      >
        {label}
      </span>

      <strong
        className={
          styles.heroMetricValue
        }
      >
        {value}
      </strong>
    </div>
  );
}

function GeneralItem({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.generalItem
      }
    >
      <span
        className={
          styles.generalLabel
        }
      >
        {label}
      </span>

      <strong
        className={
          styles.generalValue
        }
      >
        {value || '—'}
      </strong>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
}) {
  return (
    <div
      className={
        styles.overviewCard
      }
    >
      <span
        className={
          styles.overviewIcon
        }
      >
        {icon}
      </span>

      <div
        className={
          styles.overviewContent
        }
      >
        <span
          className={
            styles.overviewLabel
          }
        >
          {label}
        </span>

        <strong
          className={
            styles.overviewValue
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

export default function DailyReportWorkspacePage() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const params =
    useParams();

  const router =
    useRouter();

  const reportId =
    params?.reportId;

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    coverUrl,
    setCoverUrl,
  ] = useState('');

  const [
    weatherCount,
    setWeatherCount,
  ] = useState(0);

  const [
    workforceCount,
    setWorkforceCount,
  ] = useState(0);

  const [
    productionCount,
    setProductionCount,
  ] = useState(0);

  const [
    equipmentCount,
    setEquipmentCount,
  ] = useState(0);

  const [
    materialsCount,
    setMaterialsCount,
  ] = useState(0);

  const [
    issuesCount,
    setIssuesCount,
  ] = useState(0);

  const [
    notesCount,
    setNotesCount,
  ] = useState(0);

  const [
    attachmentsCount,
    setAttachmentsCount,
  ] = useState(0);

  const [
    safetyCount,
    setSafetyCount,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const sections =
    useMemo(
      () => [
        {
          key:
            'general',

          number:
            '01',

          title:
            'General Information',

          shortTitle:
            'General',

          description:
            'Project, date, work period and report notes.',

          count:
            report ? 1 : 0,
        },

        {
          key:
            'weather',

          number:
            '02',

          title:
            'Weather & Site Conditions',

          shortTitle:
            'Weather',

          description:
            'Weather, temperature and production impact.',

          count:
            weatherCount,
        },

        {
          key:
            'workforce',

          number:
            '03',

          title:
            'Workforce',

          shortTitle:
            'Workforce',

          description:
            'Companies, crews, roles and labor resources.',

          count:
            workforceCount,
        },

        {
          key:
            'production',

          number:
            '04',

          title:
            'Production',

          shortTitle:
            'Production',

          description:
            'Planned versus actual field production.',

          count:
            productionCount,
        },

        {
          key:
            'equipment',

          number:
            '05',

          title:
            'Equipment',

          shortTitle:
            'Equipment',

          description:
            'Equipment usage, idle time and operating status.',

          count:
            equipmentCount,
        },

        {
          key:
            'materials',

          number:
            '06',

          title:
            'Materials',

          shortTitle:
            'Materials',

          description:
            'Materials received and used during the workday.',

          count:
            materialsCount,
        },

        {
          key:
            'issues',

          number:
            '07',

          title:
            'Issues & Constraints',

          shortTitle:
            'Issues',

          description:
            'Field issues, impacts and corrective actions.',

          count:
            issuesCount,
        },

        {
          key:
            'notes',

          number:
            '08',

          title:
            'Notes & Observations',

          shortTitle:
            'Notes',

          description:
            'General, safety, quality and coordination notes.',

          count:
            notesCount,
        },

        {
          key:
            'attachments',

          number:
            '09',

          title:
            'Photos & Attachments',

          shortTitle:
            'Attachments',

          description:
            'Photos, videos, documents and field evidence.',

          count:
            attachmentsCount,
        },

        {
          key:
            'safety',

          number:
            '10',

          title:
            'Safety',

          shortTitle:
            'Safety',

          description:
            'Toolbox talks, inspections and daily safety events.',

          count:
            safetyCount,
        },

        {
          key:
            'approval',

          number:
            '11',

          title:
            'Review & Approval',

          shortTitle:
            'Approval',

          description:
            'Submission, review and approval workflow.',

          count:
            report?.status !==
            'draft'
              ? 1
              : 0,
        },
      ],
      [
        report,
        weatherCount,
        workforceCount,
        productionCount,
        equipmentCount,
        materialsCount,
        issuesCount,
        notesCount,
        attachmentsCount,
        safetyCount,
      ]
    );

  useEffect(() => {
    async function loadWorkspace() {
      if (!reportId) {
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
          reportData,

        error:
          reportError,
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
            created_at,
            updated_at,
            submitted_at,
            reviewed_at,
            approved_at
          `)
          .eq(
            'id',
            reportId
          )
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
            organization_id,
            status,
            city,
            state_region,
            country_code,
            cover_image_path
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

      setReport(
        reportData
      );

      setProject(
        projectData
      );

      /*
       * ------------------------------------------------------
       * PROJECT COVER
       * ------------------------------------------------------
       */

      if (
        projectData.cover_image_path
      ) {
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
              projectData.cover_image_path,
              SIGNED_URL_DURATION
            );

        if (
          !signedError &&
          signedData?.signedUrl
        ) {
          setCoverUrl(
            signedData.signedUrl
          );
        }
      }

      /*
       * ------------------------------------------------------
       * SECTION COUNTS
       * ------------------------------------------------------
       */

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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
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

                head:
                  true,
              }
            )
            .eq(
              'daily_report_id',
              reportId
            ),
        ]);

      setWeatherCount(
        weatherResult.count ||
          0
      );

      setWorkforceCount(
        workforceResult.count ||
          0
      );

      setProductionCount(
        productionResult.count ||
          0
      );

      setEquipmentCount(
        equipmentResult.count ||
          0
      );

      setMaterialsCount(
        materialsResult.count ||
          0
      );

      setIssuesCount(
        issuesResult.count ||
          0
      );

      setNotesCount(
        notesResult.count ||
          0
      );

      setAttachmentsCount(
        attachmentsResult.count ||
          0
      );

      setSafetyCount(
        safetyResult.count ||
          0
      );

      setIsLoading(false);
    }

    loadWorkspace();
  }, [
    reportId,
    supabase,
  ]);

  const completedSections =
    sections.filter(
      (section) =>
        section.count > 0
    ).length;

  const completionPercentage =
    Math.round(
      (
        completedSections /
        sections.length
      ) *
        100
    );

  if (isLoading) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.contentPanel
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <p
                className={
                  styles.contentEyebrow
                }
              >
                DAILY REPORT
              </p>

              <h1
                className={
                  styles.contentTitle
                }
              >
                Loading report workspace...
              </h1>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (
    errorMessage ||
    !report ||
    !project
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.errorPanel
          }
        >
          <p
            className={
              styles.errorEyebrow
            }
          >
            DAILY REPORT
          </p>

          <h1
            className={
              styles.errorTitle
            }
          >
            Report unavailable
          </h1>

          <p
            className={
              styles.errorDescription
            }
          >
            {errorMessage ||
              'The requested Daily Report could not be loaded.'}
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
            ← Back to Daily Reports
          </button>
        </section>
      </main>
    );
  }

  const reportNumber =
    `DR-${String(
      report.report_number
    ).padStart(
      4,
      '0'
    )}`;

  return (
    <main
      className={
        styles.page
      }
    >
      {/* =====================================================
          TOP NAVIGATION
          ===================================================== */}

      <div
        className={
          styles.topNavigation
        }
      >
        <Link
          href={`/dashboard/projects/daily-reports?projectId=${project.id}`}
          className={
            styles.backLink
          }
        >
          ← Daily Report Center
        </Link>
      </div>

      {/* =====================================================
          PROJECT / DAILY REPORT HERO
          ===================================================== */}

      <section
        className={
          styles.hero
        }
      >
        {coverUrl && (
          <img
            src={
              coverUrl
            }
            alt={`${project.name} project`}
            className={
              styles.heroImage
            }
          />
        )}

        <div
          className={
            styles.heroOverlay
          }
        />

        <div
          className={
            styles.heroContent
          }
        >
          <div
            className={
              styles.heroTop
            }
          >
            <div>
              <p
                className={
                  styles.heroEyebrow
                }
              >
                DAILY REPORT WORKSPACE
              </p>

              <h1
                className={
                  styles.heroTitle
                }
              >
                {reportNumber}
              </h1>

              <p
                className={
                  styles.heroProject
                }
              >
                {project.code ||
                  'Unassigned'}
                {' · '}
                {project.name}
                {' · '}
                {formatDate(
                  report.report_date
                )}
              </p>
            </div>

            <span
              className={`${styles.statusBadge} ${getStatusClass(
                report.status
              )}`}
            >
              {formatStatus(
                report.status
              )}
            </span>
          </div>

          <div
            className={
              styles.heroMetrics
            }
          >
            <HeroMetric
              label="Report"
              value={
                reportNumber
              }
            />

            <HeroMetric
              label="Date"
              value={
                formatDate(
                  report.report_date
                )
              }
            />

            <HeroMetric
              label="Work Start"
              value={
                formatTime(
                  report.work_start_time
                )
              }
            />

            <HeroMetric
              label="Work End"
              value={
                formatTime(
                  report.work_end_time
                )
              }
            />

            <HeroMetric
              label="Sections"
              value={`${completedSections}/${sections.length}`}
            />

            <HeroMetric
              label="Progress"
              value={`${completionPercentage}%`}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          HYBRID WORKSPACE
          ===================================================== */}

      <section
        className={
          styles.workspace
        }
      >
        {/* ===================================================
            INTERNAL SIDEBAR
            =================================================== */}

        <aside
          className={
            styles.workspaceSidebar
          }
        >
          <div
            className={
              styles.sidebarHeader
            }
          >
            <p
              className={
                styles.sidebarEyebrow
              }
            >
              REPORT CONTENT
            </p>

            <h2
              className={
                styles.sidebarTitle
              }
            >
              Daily Report
            </h2>
          </div>

          <nav
            className={
              styles.sectionNavigation
            }
            aria-label="Daily Report sections"
          >
            {sections.map(
              (section) => (
                <Link
                  key={
                    section.key
                  }
                  href={`/dashboard/projects/daily-reports/${report.id}/${section.key}`}
                  className={`${styles.sectionLink} ${
                    section.key ===
                    'general'
                      ? styles.sectionLinkActive
                      : ''
                  }`}
                >
                  <span
                    className={
                      styles.sectionNumber
                    }
                  >
                    {
                      section.number
                    }
                  </span>

                  <span
                    className={
                      styles.sectionName
                    }
                  >
                    {
                      section.shortTitle
                    }
                  </span>

                  <span
                    className={
                      styles.sectionIndicator
                    }
                  >
                    {section.count >
                    0
                      ? '✓'
                      : '·'}
                  </span>
                </Link>
              )
            )}
          </nav>

          {/* =================================================
              QUICK ACTIONS
              ================================================= */}

          <div
            className={
              styles.quickActions
            }
          >
            <p
              className={
                styles.quickActionsTitle
              }
            >
              Quick Actions
            </p>

            <div
              className={
                styles.quickActionGrid
              }
            >
              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/workforce`}
                className={
                  styles.quickAction
                }
              >
                + Crew
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/production`}
                className={
                  styles.quickAction
                }
              >
                + Production
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/issues`}
                className={
                  styles.quickAction
                }
              >
                + Issue
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/attachments`}
                className={
                  styles.quickAction
                }
              >
                + Photo
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/equipment`}
                className={
                  styles.quickAction
                }
              >
                + Equipment
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/materials`}
                className={
                  styles.quickAction
                }
              >
                + Material
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/notes`}
                className={
                  styles.quickAction
                }
              >
                + Note
              </Link>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/safety`}
                className={
                  styles.quickAction
                }
              >
                + Safety
              </Link>
            </div>
          </div>
        </aside>

        {/* ===================================================
            MAIN WORKSPACE PANEL
            =================================================== */}

        <div
          className={
            styles.workspaceMain
          }
        >
          <article
            className={
              styles.contentPanel
            }
          >
            <header
              className={
                styles.contentHeader
              }
            >
              <div>
                <p
                  className={
                    styles.contentEyebrow
                  }
                >
                  01 · GENERAL INFORMATION
                </p>

                <h2
                  className={
                    styles.contentTitle
                  }
                >
                  Report overview
                </h2>

                <p
                  className={
                    styles.contentDescription
                  }
                >
                  Core project and
                  reporting information.
                  Use the internal
                  navigation to access
                  each field reporting
                  section.
                </p>
              </div>

              <Link
                href={`/dashboard/projects/daily-reports/${report.id}/general`}
                className={
                  styles.openSectionButton
                }
              >
                Open General Information
              </Link>
            </header>

            {/* ===============================================
                GENERAL INFORMATION SNAPSHOT
                =============================================== */}

            <div
              className={
                styles.generalGrid
              }
            >
              <GeneralItem
                label="Project"
                value={
                  project.name
                }
              />

              <GeneralItem
                label="Project Code"
                value={
                  project.code ||
                  'Unassigned'
                }
              />

              <GeneralItem
                label="Client"
                value={
                  project.client_name ||
                  'Not specified'
                }
              />

              <GeneralItem
                label="Report Number"
                value={
                  reportNumber
                }
              />

              <GeneralItem
                label="Report Date"
                value={
                  formatDate(
                    report.report_date
                  )
                }
              />

              <GeneralItem
                label="Status"
                value={
                  formatStatus(
                    report.status
                  )
                }
              />

              <GeneralItem
                label="Work Start"
                value={
                  formatTime(
                    report.work_start_time
                  )
                }
              />

              <GeneralItem
                label="Work End"
                value={
                  formatTime(
                    report.work_end_time
                  )
                }
              />

              <GeneralItem
                label="Report Notes"
                value={
                  report.general_notes ||
                  'No general notes recorded.'
                }
              />
            </div>

            {/* ===============================================
                COMPLETION
                =============================================== */}

            <div
              className={
                styles.completionSection
              }
            >
              <div
                className={
                  styles.completionHeader
                }
              >
                <span
                  className={
                    styles.completionLabel
                  }
                >
                  Report completion
                </span>

                <strong
                  className={
                    styles.completionValue
                  }
                >
                  {completedSections}
                  /
                  {sections.length}
                  {' · '}
                  {completionPercentage}
                  %
                </strong>
              </div>

              <div
                className={
                  styles.progressTrack
                }
              >
                <div
                  className={
                    styles.progressFill
                  }
                  style={{
                    width:
                      `${completionPercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* ===============================================
                OPERATIONAL OVERVIEW
                =============================================== */}

            <div
              className={
                styles.sectionOverview
              }
            >
              <OverviewCard
                icon="WE"
                label="Weather"
                value={
                  weatherCount >
                  0
                    ? 'Recorded'
                    : 'Not recorded'
                }
              />

              <OverviewCard
                icon="WF"
                label="Workforce"
                value={`${workforceCount} ${
                  workforceCount ===
                  1
                    ? 'record'
                    : 'records'
                }`}
              />

              <OverviewCard
                icon="PR"
                label="Production"
                value={`${productionCount} ${
                  productionCount ===
                  1
                    ? 'record'
                    : 'records'
                }`}
              />

              <OverviewCard
                icon="EQ"
                label="Equipment"
                value={`${equipmentCount} ${
                  equipmentCount ===
                  1
                    ? 'record'
                    : 'records'
                }`}
              />

              <OverviewCard
                icon="MT"
                label="Materials"
                value={`${materialsCount} ${
                  materialsCount ===
                  1
                    ? 'record'
                    : 'records'
                }`}
              />

              <OverviewCard
                icon="IS"
                label="Issues"
                value={`${issuesCount} ${
                  issuesCount ===
                  1
                    ? 'issue'
                    : 'issues'
                }`}
              />

              <OverviewCard
                icon="NO"
                label="Notes"
                value={`${notesCount} ${
                  notesCount ===
                  1
                    ? 'note'
                    : 'notes'
                }`}
              />

              <OverviewCard
                icon="PH"
                label="Attachments"
                value={`${attachmentsCount} ${
                  attachmentsCount ===
                  1
                    ? 'file'
                    : 'files'
                }`}
              />

              <OverviewCard
                icon="SA"
                label="Safety"
                value={
                  safetyCount >
                  0
                    ? 'Recorded'
                    : 'Not recorded'
                }
              />

              <OverviewCard
                icon="AP"
                label="Workflow"
                value={
                  formatStatus(
                    report.status
                  )
                }
              />
            </div>

            {/* ===============================================
                FOOTER
                =============================================== */}

            <footer
              className={
                styles.workspaceFooter
              }
            >
              <p
                className={
                  styles.footerMessage
                }
              >
                Select a section
                from the left to
                continue updating
                this Daily Report.
              </p>

              <div
                className={
                  styles.footerActions
                }
              >
                <Link
                  href={`/dashboard/projects/daily-reports/${report.id}/general`}
                  className={
                    styles.secondaryButton
                  }
                >
                  General Information
                </Link>

                <Link
                  href={`/dashboard/projects/daily-reports/${report.id}/weather`}
                  className={
                    styles.primaryButton
                  }
                >
                  Next: Weather →
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}
