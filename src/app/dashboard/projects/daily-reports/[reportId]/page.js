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

const PERIODS = [
  {
    key: 'morning',
    label: 'Morning',
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
  },
  {
    key: 'evening',
    label: 'Evening',
  },
];

const WEATHER_OPTIONS = [
  'clear',
  'partly_cloudy',
  'cloudy',
  'light_rain',
  'rain',
  'heavy_rain',
  'storm',
  'snow',
  'fog',
  'other',
];

const WIND_OPTIONS = [
  'calm',
  'light',
  'moderate',
  'strong',
  'severe',
];

const SITE_OPTIONS = [
  'dry',
  'damp',
  'wet',
  'muddy',
  'frozen',
  'restricted',
];

const IMPACT_OPTIONS = [
  'none',
  'minor',
  'moderate',
  'severe',
];

function createEmptyPeriod() {
  return {
    id: null,
    condition: '',
    temperatureMin: '',
    temperatureMax: '',
    temperatureUnit: 'F',
    rainfall: '',
    windCondition: '',
    siteCondition: '',
    productionImpact: 'none',
    impactHours: '',
    notes: '',
  };
}

function createInitialWeatherState() {
  return {
    morning: createEmptyPeriod(),
    afternoon: createEmptyPeriod(),
    evening: createEmptyPeriod(),
  };
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] =
    value.split('-').map(Number);

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

function formatOptionLabel(value) {
  if (!value) {
    return '';
  }

  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function hasPeriodContent(
  periodData
) {
  return Boolean(
    periodData.condition ||
      periodData.temperatureMin !== '' ||
      periodData.temperatureMax !== '' ||
      periodData.rainfall !== '' ||
      periodData.windCondition ||
      periodData.siteCondition ||
      periodData.productionImpact !==
        'none' ||
      periodData.impactHours !== '' ||
      periodData.notes.trim()
  );
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
    activeSection,
    setActiveSection,
  ] = useState('general');

  const [
    weather,
    setWeather,
  ] = useState(
    createInitialWeatherState
  );

  const [
    activeWeatherPeriod,
    setActiveWeatherPeriod,
  ] = useState('morning');

  const [
    isSavingWeather,
    setIsSavingWeather,
  ] = useState(false);

  const [
    weatherSuccess,
    setWeatherSuccess,
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
          key: 'general',
          number: '01',
          title:
            'General Information',
          shortTitle:
            'General',
          description:
            'Project, date, work period and report notes.',
          count:
            report ? 1 : 0,
          embedded:
            true,
        },

        {
          key: 'weather',
          number: '02',
          title:
            'Weather & Site Conditions',
          shortTitle:
            'Weather',
          description:
            'Weather, temperature and production impact.',
          count:
            weatherCount,
          embedded:
            true,
        },

        {
          key: 'workforce',
          number: '03',
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
          key: 'production',
          number: '04',
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
          key: 'equipment',
          number: '05',
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
          key: 'materials',
          number: '06',
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
          key: 'issues',
          number: '07',
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
          key: 'notes',
          number: '08',
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
          key: 'attachments',
          number: '09',
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
          key: 'safety',
          number: '10',
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
          key: 'approval',
          number: '11',
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
      setWeatherSuccess('');

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
       * WEATHER
       */

      const {
        data:
          weatherData,

        error:
          weatherError,
      } =
        await supabase
          .from(
            'daily_report_weather'
          )
          .select(`
            id,
            daily_report_id,
            period,
            weather_condition,
            temperature,
            temperature_unit,
            site_condition,
            production_impact,
            impact_notes,
            condition,
            organization_id,
            project_id,
            temperature_min,
            temperature_max,
            rainfall,
            wind_condition,
            impact_hours,
            notes
          `)
          .eq(
            'daily_report_id',
            reportId
          )
          .order(
            'period',
            {
              ascending: true,
            }
          );

      if (
        !weatherError
      ) {
        const nextWeather =
          createInitialWeatherState();

        (
          weatherData || []
        ).forEach(
          (item) => {
            if (
              !item.period ||
              !nextWeather[
                item.period
              ]
            ) {
              return;
            }

            nextWeather[
              item.period
            ] = {
              id:
                item.id,

              condition:
                item.condition ||
                item.weather_condition ||
                '',

              temperatureMin:
                item.temperature_min !==
                  null &&
                item.temperature_min !==
                  undefined
                  ? String(
                      item.temperature_min
                    )
                  : item.temperature !==
                        null &&
                      item.temperature !==
                        undefined
                    ? String(
                        item.temperature
                      )
                    : '',

              temperatureMax:
                item.temperature_max !==
                  null &&
                item.temperature_max !==
                  undefined
                  ? String(
                      item.temperature_max
                    )
                  : '',

              temperatureUnit:
                item.temperature_unit ||
                'F',

              rainfall:
                item.rainfall !==
                  null &&
                item.rainfall !==
                  undefined
                  ? String(
                      item.rainfall
                    )
                  : '',

              windCondition:
                item.wind_condition ||
                '',

              siteCondition:
                item.site_condition ||
                '',

              productionImpact:
                item.production_impact ||
                'none',

              impactHours:
                item.impact_hours !==
                  null &&
                item.impact_hours !==
                  undefined
                  ? String(
                      item.impact_hours
                    )
                  : '',

              notes:
                item.notes ||
                item.impact_notes ||
                '',
            };
          }
        );

        setWeather(
          nextWeather
        );

        setWeatherCount(
          (
            weatherData || []
          ).length
        );
      }

      /*
       * SECTION COUNTS
       */

      const [
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

  function updateWeatherField(
    period,
    field,
    value
  ) {
    setWeather(
      (current) => ({
        ...current,

        [period]: {
          ...current[
            period
          ],
          [field]:
            value,
        },
      })
    );

    setWeatherSuccess('');
  }

  async function saveWeather(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      isSavingWeather ||
      report.status !==
        'draft'
    ) {
      return;
    }

    setIsSavingWeather(
      true
    );

    setErrorMessage('');
    setWeatherSuccess('');

    for (
      const periodDefinition
      of PERIODS
    ) {
      const period =
        periodDefinition.key;

      const periodData =
        weather[
          period
        ];

      const hasContent =
        hasPeriodContent(
          periodData
        );

      if (
        !hasContent &&
        !periodData.id
      ) {
        continue;
      }

      if (
        !hasContent &&
        periodData.id
      ) {
        const {
          error:
            deleteError,
        } =
          await supabase
            .from(
              'daily_report_weather'
            )
            .delete()
            .eq(
              'id',
              periodData.id
            );

        if (
          deleteError
        ) {
          setErrorMessage(
            deleteError.message
          );

          setIsSavingWeather(
            false
          );

          return;
        }

        continue;
      }

      const temperatureMin =
        periodData.temperatureMin ===
        ''
          ? null
          : Number(
              periodData.temperatureMin
            );

      const temperatureMax =
        periodData.temperatureMax ===
        ''
          ? null
          : Number(
              periodData.temperatureMax
            );

      const rainfall =
        periodData.rainfall ===
        ''
          ? null
          : Number(
              periodData.rainfall
            );

      const impactHours =
        periodData.impactHours ===
        ''
          ? null
          : Number(
              periodData.impactHours
            );

      if (
        temperatureMin !==
          null &&
        temperatureMax !==
          null &&
        temperatureMax <
          temperatureMin
      ) {
        setErrorMessage(
          `${periodDefinition.label}: maximum temperature cannot be lower than minimum temperature.`
        );

        setActiveWeatherPeriod(
          period
        );

        setIsSavingWeather(
          false
        );

        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        period,

        organization_id:
          report.organization_id,

        project_id:
          report.project_id,

        condition:
          periodData.condition ||
          null,

        weather_condition:
          periodData.condition ||
          null,

        temperature:
          temperatureMin,

        temperature_unit:
          periodData.temperatureUnit ||
          'F',

        temperature_min:
          temperatureMin,

        temperature_max:
          temperatureMax,

        rainfall,

        wind_condition:
          periodData.windCondition ||
          null,

        site_condition:
          periodData.siteCondition ||
          null,

        production_impact:
          periodData.productionImpact ||
          'none',

        impact_hours:
          impactHours,

        notes:
          periodData.notes.trim() ||
          null,

        impact_notes:
          periodData.notes.trim() ||
          null,
      };

      const {
        data:
          savedRecord,

        error:
          saveError,
      } =
        await supabase
          .from(
            'daily_report_weather'
          )
          .upsert(
            payload,
            {
              onConflict:
                'daily_report_id,period',
            }
          )
          .select(
            'id'
          )
          .single();

      if (
        saveError
      ) {
        setErrorMessage(
          saveError.message
        );

        setActiveWeatherPeriod(
          period
        );

        setIsSavingWeather(
          false
        );

        return;
      }

      setWeather(
        (current) => ({
          ...current,

          [period]: {
            ...current[
              period
            ],
            id:
              savedRecord.id,
          },
        })
      );
    }

    const count =
      Object.values(
        weather
      ).filter(
        hasPeriodContent
      ).length;

    setWeatherCount(
      count
    );

    setWeatherSuccess(
      'Weather and site conditions saved successfully.'
    );

    setIsSavingWeather(
      false
    );
  }

  function handleSectionClick(
    section
  ) {
    if (
      section.embedded
    ) {
      setActiveSection(
        section.key
      );

      return;
    }

    router.push(
      `/dashboard/projects/daily-reports/${report.id}/${section.key}`
    );
  }

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
    errorMessage &&
    (!report ||
      !project)
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

  const currentWeather =
    weather[
      activeWeatherPeriod
    ];

  const isReadOnly =
    report.status !==
    'draft';

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
      </div>

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
            {sections.map(
              (section) => (
                <button
                  type="button"
                  key={
                    section.key
                  }
                  onClick={() =>
                    handleSectionClick(
                      section
                    )
                  }
                  className={`${styles.sectionLink} ${
                    activeSection ===
                    section.key
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
                </button>
              )
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
            </div>
          </div>
        </aside>

        <div
          className={
            styles.workspaceMain
          }
        >
          {errorMessage && (
            <div
              className={
                styles.workspaceError
              }
            >
              {errorMessage}
            </div>
          )}

          {weatherSuccess && (
            <div
              className={
                styles.workspaceSuccess
              }
            >
              {weatherSuccess}
            </div>
          )}

          {activeSection ===
            'general' && (
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
                  </p>
                </div>

                <Link
                  href={`/dashboard/projects/daily-reports/${report.id}/general`}
                  className={
                    styles.openSectionButton
                  }
                >
                  Edit General Information
                </Link>
              </header>

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
                      ? `${weatherCount} periods recorded`
                      : 'Not recorded'
                  }
                />

                <OverviewCard
                  icon="WF"
                  label="Workforce"
                  value={`${workforceCount} records`}
                />

                <OverviewCard
                  icon="PR"
                  label="Production"
                  value={`${productionCount} records`}
                />

                <OverviewCard
                  icon="EQ"
                  label="Equipment"
                  value={`${equipmentCount} records`}
                />

                <OverviewCard
                  icon="MT"
                  label="Materials"
                  value={`${materialsCount} records`}
                />

                <OverviewCard
                  icon="IS"
                  label="Issues"
                  value={`${issuesCount} issues`}
                />
              </div>
            </article>
          )}

          {activeSection ===
            'weather' && (
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
                    02 · WEATHER & SITE CONDITIONS
                  </p>

                  <h2
                    className={
                      styles.contentTitle
                    }
                  >
                    Weather
                  </h2>

                  <p
                    className={
                      styles.contentDescription
                    }
                  >
                    Record weather,
                    temperature, rainfall,
                    site conditions and
                    production impacts
                    without leaving the
                    Daily Report workspace.
                  </p>
                </div>

                <span
                  className={
                    styles.embeddedBadge
                  }
                >
                  Embedded Workspace
                </span>
              </header>

              <form
                onSubmit={
                  saveWeather
                }
              >
                <div
                  className={
                    styles.weatherPeriodTabs
                  }
                >
                  {PERIODS.map(
                    (period) => {
                      const hasData =
                        hasPeriodContent(
                          weather[
                            period.key
                          ]
                        );

                      const active =
                        activeWeatherPeriod ===
                        period.key;

                      return (
                        <button
                          key={
                            period.key
                          }
                          type="button"
                          onClick={() =>
                            setActiveWeatherPeriod(
                              period.key
                            )
                          }
                          className={`${styles.weatherPeriodButton} ${
                            active
                              ? styles.weatherPeriodButtonActive
                              : ''
                          }`}
                        >
                          <span>
                            {
                              period.label
                            }
                          </span>

                          <small>
                            {hasData
                              ? 'Recorded'
                              : 'No data'}
                          </small>
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  className={
                    styles.weatherForm
                  }
                >
                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      General condition
                    </span>

                    <select
                      value={
                        currentWeather.condition
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'condition',
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Select condition
                      </option>

                      {WEATHER_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {formatOptionLabel(
                              option
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Minimum temperature
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={
                        currentWeather.temperatureMin
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'temperatureMin',
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Maximum temperature
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={
                        currentWeather.temperatureMax
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'temperatureMax',
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Temperature unit
                    </span>

                    <select
                      value={
                        currentWeather.temperatureUnit
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'temperatureUnit',
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="F">
                        Fahrenheit (°F)
                      </option>

                      <option value="C">
                        Celsius (°C)
                      </option>
                    </select>
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Rainfall
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        currentWeather.rainfall
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'rainfall',
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Wind
                    </span>

                    <select
                      value={
                        currentWeather.windCondition
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'windCondition',
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Select wind
                      </option>

                      {WIND_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {formatOptionLabel(
                              option
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Site condition
                    </span>

                    <select
                      value={
                        currentWeather.siteCondition
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'siteCondition',
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Select site condition
                      </option>

                      {SITE_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {formatOptionLabel(
                              option
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Production impact
                    </span>

                    <select
                      value={
                        currentWeather.productionImpact
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'productionImpact',
                          event.target
                            .value
                        )
                      }
                    >
                      {IMPACT_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {formatOptionLabel(
                              option
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      styles.weatherField
                    }
                  >
                    <span>
                      Impact hours
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        currentWeather.impactHours
                      }
                      disabled={
                        isReadOnly
                      }
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'impactHours',
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label
                    className={`${styles.weatherField} ${styles.weatherFieldFull}`}
                  >
                    <span>
                      Notes
                    </span>

                    <textarea
                      rows="4"
                      value={
                        currentWeather.notes
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Weather observations, site restrictions or production impacts..."
                      onChange={(
                        event
                      ) =>
                        updateWeatherField(
                          activeWeatherPeriod,
                          'notes',
                          event.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>

                <footer
                  className={
                    styles.weatherFooter
                  }
                >
                  <div>
                    {isReadOnly ? (
                      <span
                        className={
                          styles.readOnlyNotice
                        }
                      >
                        This Daily Report is {formatStatus(
                          report.status
                        )} and is read-only.
                      </span>
                    ) : (
                      <span
                        className={
                          styles.weatherHelper
                        }
                      >
                        Changes are stored
                        by weather period.
                      </span>
                    )}
                  </div>

                  {!isReadOnly && (
                    <button
                      type="submit"
                      className={
                        styles.primaryButton
                      }
                      disabled={
                        isSavingWeather
                      }
                    >
                      {isSavingWeather
                        ? 'Saving...'
                        : 'Save Weather'}
                    </button>
                  )}
                </footer>
              </form>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
