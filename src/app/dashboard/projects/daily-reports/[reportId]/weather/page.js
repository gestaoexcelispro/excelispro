'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../../lib/supabase/client';
import styles from '../../daily-reports.module.css';

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

function formatOptionLabel(value) {
  if (!value) {
    return '';
  }

  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase()
    );
}

function hasPeriodContent(periodData) {
  return Boolean(
    periodData.condition ||
      periodData.temperatureMin !== '' ||
      periodData.temperatureMax !== '' ||
      periodData.rainfall !== '' ||
      periodData.windCondition ||
      periodData.siteCondition ||
      periodData.productionImpact !== 'none' ||
      periodData.impactHours !== '' ||
      periodData.notes.trim()
  );
}

export default function DailyReportWeatherPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [weather, setWeather] = useState(
    createInitialWeatherState
  );

  const [activePeriod, setActivePeriod] =
    useState('morning');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  useEffect(() => {
    async function loadWeather() {
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
        data: weatherData,
        error: weatherError,
      } = await supabase
        .from('daily_report_weather')
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
          notes,
          created_at,
          updated_at
        `)
        .eq(
          'daily_report_id',
          reportId
        )
        .order('period', {
          ascending: true,
        });

      if (weatherError) {
        setErrorMessage(
          weatherError.message
        );

        setIsLoading(false);
        return;
      }

      const nextWeather =
        createInitialWeatherState();

      (weatherData || []).forEach(
        (item) => {
          if (
            !item.period ||
            !nextWeather[item.period]
          ) {
            return;
          }

          nextWeather[item.period] = {
            id: item.id,

            condition:
              item.condition ||
              item.weather_condition ||
              '',

            temperatureMin:
              item.temperature_min !== null &&
              item.temperature_min !== undefined
                ? String(
                    item.temperature_min
                  )
                : item.temperature !== null &&
                    item.temperature !== undefined
                  ? String(
                      item.temperature
                    )
                  : '',

            temperatureMax:
              item.temperature_max !== null &&
              item.temperature_max !== undefined
                ? String(
                    item.temperature_max
                  )
                : '',

            temperatureUnit:
              item.temperature_unit ||
              'F',

            rainfall:
              item.rainfall !== null &&
              item.rainfall !== undefined
                ? String(item.rainfall)
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
              item.impact_hours !== null &&
              item.impact_hours !== undefined
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

      setReport(reportData);
      setProject(projectData);
      setWeather(nextWeather);

      setIsLoading(false);
    }

    loadWeather();
  }, [
    reportId,
    supabase,
  ]);

  function updatePeriodField(
    period,
    field,
    value
  ) {
    setWeather(
      (currentWeather) => ({
        ...currentWeather,

        [period]: {
          ...currentWeather[period],
          [field]: value,
        },
      })
    );

    setSuccessMessage('');
  }

  async function saveWeather(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (
      const periodDefinition
      of PERIODS
    ) {
      const period =
        periodDefinition.key;

      const periodData =
        weather[period];

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
          error: deleteError,
        } = await supabase
          .from(
            'daily_report_weather'
          )
          .delete()
          .eq(
            'id',
            periodData.id
          );

        if (deleteError) {
          setErrorMessage(
            deleteError.message
          );

          setIsSaving(false);
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
        periodData.rainfall === ''
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
        temperatureMin !== null &&
        temperatureMax !== null &&
        temperatureMax <
          temperatureMin
      ) {
        setErrorMessage(
          `${periodDefinition.label}: maximum temperature cannot be lower than minimum temperature.`
        );

        setActivePeriod(period);

        setIsSaving(false);
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
        data: savedRecord,
        error: saveError,
      } = await supabase
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
        .single();

      if (saveError) {
        setErrorMessage(
          saveError.message
        );

        setActivePeriod(period);

        setIsSaving(false);
        return;
      }

      setWeather(
        (currentWeather) => ({
          ...currentWeather,

          [period]: {
            ...currentWeather[
              period
            ],

            id:
              savedRecord.id,
          },
        })
      );
    }

    setSuccessMessage(
      'Weather and site conditions saved successfully.'
    );

    setIsSaving(false);
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
            Loading Weather & Site
            Conditions...
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
      <main
        className={
          styles.page
        }
      >
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
            Weather information
            unavailable
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

  const currentPeriod =
    weather[activePeriod];

  const isReadOnly =
    report.status !== 'draft';

  return (
    <main
      className={styles.page}
    >
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
            DAILY REPORT · WEATHER &
            SITE CONDITIONS
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
            padding:
              '12px 14px',
            color: '#9f2929',
            border:
              '1px solid #fecaca',
            borderRadius: '9px',
            background:
              '#fff5f5',
            fontSize: '0.76rem',
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
            color: '#087f73',
            border:
              '1px solid #b7eee6',
            borderRadius: '9px',
            background:
              '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form
        onSubmit={
          saveWeather
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
                02 · WEATHER
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Weather period
              </h2>
            </div>

            <span
              className={`${styles.statusBadge} ${styles.statusDraft}`}
            >
              {
                PERIODS.find(
                  (item) =>
                    item.key ===
                    activePeriod
                )?.label
              }
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: '10px',
            }}
          >
            {PERIODS.map(
              (period) => {
                const isActive =
                  activePeriod ===
                  period.key;

                const hasData =
                  hasPeriodContent(
                    weather[
                      period.key
                    ]
                  );

                return (
                  <button
                    key={
                      period.key
                    }
                    type="button"
                    onClick={() =>
                      setActivePeriod(
                        period.key
                      )
                    }
                    style={{
                      minHeight:
                        '58px',
                      padding:
                        '10px 14px',
                      color:
                        isActive
                          ? '#ffffff'
                          : '#061b2f',
                      border:
                        isActive
                          ? '1px solid #082a4a'
                          : '1px solid #cbd5e1',
                      borderRadius:
                        '9px',
                      background:
                        isActive
                          ? '#082a4a'
                          : '#ffffff',
                      cursor:
                        'pointer',
                      fontFamily:
                        'inherit',
                      fontSize:
                        '0.78rem',
                      fontWeight:
                        800,
                      textAlign:
                        'left',
                    }}
                  >
                    <span
                      style={{
                        display:
                          'block',
                      }}
                    >
                      {
                        period.label
                      }
                    </span>

                    <span
                      style={{
                        display:
                          'block',
                        marginTop:
                          '3px',
                        color:
                          isActive
                            ? '#b7d7e9'
                            : '#94a3b8',
                        fontSize:
                          '0.64rem',
                        fontWeight:
                          600,
                      }}
                    >
                      {hasData
                        ? 'Data recorded'
                        : 'No data yet'}
                    </span>
                  </button>
                );
              }
            )}
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
                {activePeriod.toUpperCase()}
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Weather conditions
              </h2>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
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
                General condition
              </span>

              <select
                value={
                  currentPeriod.condition
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'condition',
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
                <option value="">
                  Select condition
                </option>

                {WEATHER_OPTIONS.map(
                  (option) => (
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
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Minimum temperature
              </span>

              <input
                type="number"
                step="0.1"
                value={
                  currentPeriod.temperatureMin
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'temperatureMin',
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
                Maximum temperature
              </span>

              <input
                type="number"
                step="0.1"
                value={
                  currentPeriod.temperatureMax
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'temperatureMax',
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
                Temperature unit
              </span>

              <select
                value={
                  currentPeriod.temperatureUnit
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'temperatureUnit',
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
                <option value="F">
                  Fahrenheit (°F)
                </option>

                <option value="C">
                  Celsius (°C)
                </option>
              </select>
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
                Rainfall
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  currentPeriod.rainfall
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'rainfall',
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly
                }
                placeholder="0.00"
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
                Wind condition
              </span>

              <select
                value={
                  currentPeriod.windCondition
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'windCondition',
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
                <option value="">
                  Select wind
                  condition
                </option>

                {WIND_OPTIONS.map(
                  (option) => (
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
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Site condition
              </span>

              <select
                value={
                  currentPeriod.siteCondition
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'siteCondition',
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
                <option value="">
                  Select site
                  condition
                </option>

                {SITE_OPTIONS.map(
                  (option) => (
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
              style={
                fieldStyle
              }
            >
              <span
                style={
                  labelStyle
                }
              >
                Production impact
              </span>

              <select
                value={
                  currentPeriod.productionImpact
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'productionImpact',
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
                {IMPACT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option
                      }
                      value={
                        option
                      }
                    >
                      {option ===
                      'none'
                        ? 'No impact'
                        : formatOptionLabel(
                            option
                          )}
                    </option>
                  )
                )}
              </select>
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
                Impact hours
              </span>

              <input
                type="number"
                min="0"
                step="0.25"
                value={
                  currentPeriod.impactHours
                }
                onChange={(
                  event
                ) =>
                  updatePeriodField(
                    activePeriod,
                    'impactHours',
                    event.target
                      .value
                  )
                }
                disabled={
                  isReadOnly
                }
                placeholder="0.00"
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
                FIELD NOTES
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Weather observations
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
              Notes
            </span>

            <textarea
              rows={6}
              value={
                currentPeriod.notes
              }
              onChange={(
                event
              ) =>
                updatePeriodField(
                  activePeriod,
                  'notes',
                  event.target
                    .value
                )
              }
              disabled={
                isReadOnly
              }
              placeholder="Describe weather changes, site conditions, interruptions or relevant observations for this period..."
              style={{
                ...inputStyle,
                minHeight:
                  '140px',
                padding: '12px',
                lineHeight: 1.55,
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
                `/dashboard/projects/daily-reports/${report.id}/general`
              )
            }
          >
            ← General Information
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
              : 'Save Weather & Site Conditions'}
          </button>
        </div>
      </form>
    </main>
  );
}
