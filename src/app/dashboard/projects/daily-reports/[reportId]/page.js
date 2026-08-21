'use client';

import {
  useCallback,
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

import GeneralSection from './components/GeneralSection';
import WeatherSection from './components/WeatherSection';
import WorkforceSection from './components/WorkforceSection';
import ProductionSection from './components/ProductionSection';
import EquipmentSection from './components/EquipmentSection';
import MaterialsSection from './components/MaterialsSection';
import IssuesSection from './components/IssuesSection';
import NotesSection from './components/NotesSection';
import AttachmentsSection from './components/AttachmentsSection';
import SafetySection from './components/SafetySection';
import ApprovalSection from './components/ApprovalSection';

import styles from './report-workspace.module.css';

const PROJECT_COVER_BUCKET =
  'project-covers';

const SIGNED_URL_DURATION =
  60 * 60;

const SECTION_DEFINITIONS = [
  {
    key: 'general',
    number: '01',
    title: 'General',
    fullTitle:
      'General Information',
    description:
      'Project, date, work period and general notes.',
  },
  {
    key: 'weather',
    number: '02',
    title: 'Weather',
    fullTitle:
      'Weather & Site Conditions',
    description:
      'Weather, temperature and production impact.',
  },
  {
    key: 'workforce',
    number: '03',
    title: 'Workforce',
    fullTitle:
      'Workforce',
    description:
      'Companies, crews, roles and labor resources.',
  },
  {
    key: 'production',
    number: '04',
    title: 'Production',
    fullTitle:
      'Production',
    description:
      'Planned versus actual field production.',
  },
  {
    key: 'equipment',
    number: '05',
    title: 'Equipment',
    fullTitle:
      'Equipment',
    description:
      'Equipment usage, idle time and operating status.',
  },
  {
    key: 'materials',
    number: '06',
    title: 'Materials',
    fullTitle:
      'Materials',
    description:
      'Materials received and used during the workday.',
  },
  {
    key: 'issues',
    number: '07',
    title: 'Issues',
    fullTitle:
      'Issues & Constraints',
    description:
      'Field issues, impacts and corrective actions.',
  },
  {
    key: 'notes',
    number: '08',
    title: 'Notes',
    fullTitle:
      'Notes & Observations',
    description:
      'General, safety, quality and coordination notes.',
  },
  {
    key: 'attachments',
    number: '09',
    title: 'Attachments',
    fullTitle:
      'Photos & Attachments',
    description:
      'Photos, videos, documents and field evidence.',
  },
  {
    key: 'safety',
    number: '10',
    title: 'Safety',
    fullTitle:
      'Safety',
    description:
      'Daily safety conditions and observations.',
  },
  {
    key: 'approval',
    number: '11',
    title: 'Approval',
    fullTitle:
      'Review & Approval',
    description:
      'Submission, review and approval workflow.',
  },
];

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [
    year,
    month,
    day,
  ] = value
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

function formatTime(value) {
  if (!value) {
    return '—';
  }

  return String(value).slice(
    0,
    5
  );
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
    activeSection,
    setActiveSection,
  ] = useState(
    'general'
  );

  const [
    sectionCounts,
    setSectionCounts,
  ] = useState({
    general: 0,
    weather: 0,
    workforce: 0,
    production: 0,
    equipment: 0,
    materials: 0,
    issues: 0,
    notes: 0,
    attachments: 0,
    safety: 0,
    approval: 0,
  });

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isExportingPdf,
    setIsExportingPdf,
  ] = useState(false);

  const [
    pdfErrorMessage,
    setPdfErrorMessage,
  ] = useState('');

  const updateGeneralCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            general:
              count,
          })
        );
      },
      []
    );

  const updateWeatherCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            weather:
              count,
          })
        );
      },
      []
    );

  const updateWorkforceCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            workforce:
              count,
          })
        );
      },
      []
    );

  const updateProductionCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            production:
              count,
          })
        );
      },
      []
    );

  const updateEquipmentCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            equipment:
              count,
          })
        );
      },
      []
    );

  const updateMaterialsCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            materials:
              count,
          })
        );
      },
      []
    );

  const updateIssuesCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            issues:
              count,
          })
        );
      },
      []
    );

  const updateNotesCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            notes:
              count,
          })
        );
      },
      []
    );

  const updateAttachmentsCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            attachments:
              count,
          })
        );
      },
      []
    );

  const updateSafetyCount =
    useCallback(
      (count) => {
        setSectionCounts(
          (current) => ({
            ...current,
            safety:
              count,
          })
        );
      },
      []
    );

  const handleReportChange =
    useCallback(
      (
        updatedReport
      ) => {
        if (
          updatedReport
        ) {
          setReport(
            updatedReport
          );
        }
      },
      []
    );

  const handleSectionSelect =
    useCallback(
      (sectionKey) => {
        const exists =
          SECTION_DEFINITIONS.some(
            (section) =>
              section.key ===
              sectionKey
          );

        if (!exists) {
          return;
        }

        setActiveSection(
          sectionKey
        );

        if (
          typeof window !==
          'undefined'
        ) {
          window.scrollTo({
            top: 0,
            behavior:
              'smooth',
          });
        }
      },
      []
    );

  const handleExportPdf =
    useCallback(
      async () => {
        if (
          !reportId ||
          isExportingPdf
        ) {
          return;
        }

        setIsExportingPdf(
          true
        );

        setPdfErrorMessage(
          ''
        );

        try {
          const response =
            await fetch(
              `/api/daily-reports/${reportId}/pdf`,
              {
                method:
                  'GET',
                credentials:
                  'include',
                cache:
                  'no-store',
              }
            );

          if (
            !response.ok
          ) {
            let message =
              'The Daily Report PDF could not be generated.';

            try {
              const errorData =
                await response.json();

              if (
                errorData?.error
              ) {
                message =
                  errorData.error;
              }
            } catch {
              // Keep default message.
            }

            throw new Error(
              message
            );
          }

          const blob =
            await response.blob();

          if (
            !blob ||
            blob.size === 0
          ) {
            throw new Error(
              'The generated PDF is empty.'
            );
          }

          const contentDisposition =
            response.headers.get(
              'content-disposition'
            );

          let fileName =
            `Daily-Report-${reportId}.pdf`;

          if (
            contentDisposition
          ) {
            const utf8Match =
              contentDisposition.match(
                /filename\*=UTF-8''([^;]+)/i
              );

            const regularMatch =
              contentDisposition.match(
                /filename="?([^"]+)"?/i
              );

            if (
              utf8Match?.[1]
            ) {
              fileName =
                decodeURIComponent(
                  utf8Match[1]
                );
            } else if (
              regularMatch?.[1]
            ) {
              fileName =
                regularMatch[1]
                  .trim()
                  .replace(
                    /^["']|["']$/g,
                    ''
                  );
            }
          }

          const objectUrl =
            window.URL.createObjectURL(
              blob
            );

          const anchor =
            document.createElement(
              'a'
            );

          anchor.href =
            objectUrl;

          anchor.download =
            fileName;

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();

          window.setTimeout(
            () => {
              window.URL.revokeObjectURL(
                objectUrl
              );
            },
            1000
          );
        } catch (
          error
        ) {
          console.error(
            'Daily Report PDF export error:',
            error
          );

          setPdfErrorMessage(
            error?.message ||
              'The Daily Report PDF could not be generated.'
          );
        } finally {
          setIsExportingPdf(
            false
          );
        }
      },
      [
        reportId,
        isExportingPdf,
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

        approval:
          reportData.status ===
          'draft'
            ? 0
            : 1,
      });

      setIsLoading(false);
    }

    loadWorkspace();
  }, [
    reportId,
    supabase,
  ]);

  useEffect(() => {
    if (!report) {
      return;
    }

    setSectionCounts(
      (current) => ({
        ...current,

        approval:
          report.status ===
          'draft'
            ? 0
            : 1,
      })
    );
  }, [
    report?.status,
  ]);

  const completedContentSections =
    useMemo(
      () =>
        [
          'general',
          'weather',
          'workforce',
          'production',
          'equipment',
          'materials',
          'issues',
          'notes',
          'attachments',
          'safety',
        ].filter(
          (key) =>
            (
              sectionCounts[
                key
              ] || 0
            ) > 0
        ).length,
      [
        sectionCounts,
      ]
    );

  const completionPercentage =
    Math.round(
      (
        completedContentSections /
        10
      ) *
        100
    );

  const reportNumber =
    report
      ? `DR-${String(
          report.report_number
        ).padStart(
          4,
          '0'
        )}`
      : '—';

  function renderActiveSection() {
    if (
      !report ||
      !project
    ) {
      return null;
    }

    switch (
      activeSection
    ) {
      case 'general':
        return (
          <GeneralSection
            report={
              report
            }
            project={
              project
            }
            onReportChange={
              handleReportChange
            }
            onCountChange={
              updateGeneralCount
            }
          />
        );

      case 'weather':
        return (
          <WeatherSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateWeatherCount
            }
          />
        );

      case 'workforce':
        return (
          <WorkforceSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateWorkforceCount
            }
          />
        );

      case 'production':
        return (
          <ProductionSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateProductionCount
            }
          />
        );

      case 'equipment':
        return (
          <EquipmentSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateEquipmentCount
            }
          />
        );

      case 'materials':
        return (
          <MaterialsSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateMaterialsCount
            }
          />
        );

      case 'issues':
        return (
          <IssuesSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateIssuesCount
            }
          />
        );

      case 'notes':
        return (
          <NotesSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateNotesCount
            }
          />
        );

      case 'attachments':
        return (
          <AttachmentsSection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateAttachmentsCount
            }
          />
        );

      case 'safety':
        return (
          <SafetySection
            report={
              report
            }
            project={
              project
            }
            onCountChange={
              updateSafetyCount
            }
          />
        );

      case 'approval':
        return (
          <ApprovalSection
            report={
              report
            }
            project={
              project
            }
            onReportChange={
              handleReportChange
            }
            onSectionSelect={
              handleSectionSelect
            }
          />
        );

      default:
        return (
          <GeneralSection
            report={
              report
            }
            project={
              project
            }
            onReportChange={
              handleReportChange
            }
            onCountChange={
              updateGeneralCount
            }
          />
        );
    }
  }

  if (isLoading) {
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
            Loading Daily Report Workspace...
          </h1>
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
            ← Daily Reports
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
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

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          onClick={
            handleExportPdf
          }
          disabled={
            isExportingPdf
          }
          style={{
            minWidth:
              '132px',
          }}
        >
          {isExportingPdf
            ? 'Generating PDF...'
            : 'Export PDF'}
        </button>
      </div>

      {pdfErrorMessage && (
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
          {pdfErrorMessage}
        </div>
      )}

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
              value={`${completedContentSections}/10`}
            />

            <HeroMetric
              label="Progress"
              value={`${completionPercentage}%`}
            />
          </div>
        </div>
      </section>

      <section
        className={
          styles.workspace
        }
      >
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
          >
            {SECTION_DEFINITIONS.map(
              (section) => {
                const count =
                  sectionCounts[
                    section.key
                  ] || 0;

                const complete =
                  count > 0;

                const active =
                  activeSection ===
                  section.key;

                return (
                  <button
                    key={
                      section.key
                    }
                    type="button"
                    onClick={() =>
                      handleSectionSelect(
                        section.key
                      )
                    }
                    title={
                      section.description
                    }
                    className={`${styles.sectionLink} ${
                      active
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
                        section.title
                      }
                    </span>

                    <span
                      className={
                        styles.sectionIndicator
                      }
                    >
                      {complete
                        ? '✓'
                        : '·'}
                    </span>
                  </button>
                );
              }
            )}
          </nav>

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
              QUICK ACTIONS
            </p>

            <div
              className={
                styles.quickActionGrid
              }
            >
              <button
                type="button"
                className={
                  styles.quickAction
                }
                onClick={() =>
                  handleSectionSelect(
                    'workforce'
                  )
                }
              >
                + Crew
              </button>

              <button
                type="button"
                className={
                  styles.quickAction
                }
                onClick={() =>
                  handleSectionSelect(
                    'production'
                  )
                }
              >
                + Production
              </button>

              <button
                type="button"
                className={
                  styles.quickAction
                }
                onClick={() =>
                  handleSectionSelect(
                    'issues'
                  )
                }
              >
                + Issue
              </button>

              <button
                type="button"
                className={
                  styles.quickAction
                }
                onClick={() =>
                  handleSectionSelect(
                    'attachments'
                  )
                }
              >
                + Photo
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop:
                '16px',
              padding:
                '14px',
              border:
                '1px solid #dce7eb',
              borderRadius:
                '10px',
              background:
                '#f8fbfb',
            }}
          >
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'space-between',
                gap:
                  '10px',
              }}
            >
              <span
                style={{
                  color:
                    '#617485',
                  fontSize:
                    '0.62rem',
                  fontWeight:
                    800,
                }}
              >
                REPORT COMPLETION
              </span>

              <strong
                style={{
                  color:
                    '#087f73',
                  fontSize:
                    '0.68rem',
                }}
              >
                {completionPercentage}%
              </strong>
            </div>

            <div
              style={{
                height:
                  '6px',
                marginTop:
                  '9px',
                overflow:
                  'hidden',
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
                  height:
                    '100%',
                  borderRadius:
                    '999px',
                  background:
                    '#08aa96',
                  transition:
                    'width 180ms ease',
                }}
              />
            </div>

            <div
              style={{
                marginTop:
                  '8px',
                color:
                  '#94a3b8',
                fontSize:
                  '0.6rem',
                lineHeight:
                  1.45,
              }}
            >
              {completedContentSections}{' '}
              of 10 content sections
              currently contain data.
            </div>
          </div>
        </aside>

        <div
          className={
            styles.workspaceMain
          }
        >
          {renderActiveSection()}
        </div>
      </section>
    </main>
  );
}
