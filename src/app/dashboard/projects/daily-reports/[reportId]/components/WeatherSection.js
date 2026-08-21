'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

function SummaryCard({
  label,
  value,
  helper,
  emphasis,
}) {
  let background = '#f8fafc';
  let color = '#061b2f';

  if (emphasis === 'success') {
    background = '#f2fbf9';
    color = '#087f73';
  }

  if (emphasis === 'warning') {
    background = '#fffbeb';
    color = '#9a6700';
  }

  return (
    <div
      style={{
        padding: '14px',
        border: '1px solid #e2e8f0',
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

export default function WeatherSection({
  report,
  project,
  onCountChange,
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
    weather,
    setWeather,
  ] = useState(
    createInitialWeatherState
  );

  const [
    activePeriod,
    setActivePeriod,
  ] = useState('morning');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    async function loadWeather() {
      if (!reportId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data,
        error,
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

      if (error) {
        setErrorMessage(
          error.message
        );

        setIsLoading(false);
        return;
      }

      const nextWeather =
        createInitialWeatherState();

      (data || []).forEach(
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
                ? String(item.temperature_min)
                : item.temperature !== null &&
                    item.temperature !== undefined
                  ? String(item.temperature)
                  : '',

            temperatureMax:
              item.temperature_max !== null &&
              item.temperature_max !== undefined
                ? String(item.temperature_max)
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
                ? String(item.impact_hours)
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

      onCountChange?.(
        (data || []).length
      );

      setIsLoading(false);
    }

    loadWeather();
  }, [
    reportId,
    supabase,
    onCountChange,
  ]);

  function updateField(
    period,
    field,
    value
  ) {
    setWeather(
      (current) => ({
        ...current,

        [period]: {
          ...current[period],
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
      isSaving ||
      report.status !== 'draft'
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (const periodDefinition of PERIODS) {
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
        periodData.temperatureMin === ''
          ? null
          : Number(
              periodData.temperatureMin
            );

      const temperatureMax =
        periodData.temperatureMax === ''
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
        periodData.impactHours === ''
          ? null
          : Number(
              periodData.impactHours
            );

      if (
        temperatureMin !== null &&
        !Number.isFinite(
          temperatureMin
        )
      ) {
        setErrorMessage(
          `${periodDefinition.label}: invalid minimum temperature.`
        );

        setActivePeriod(period);
        setIsSaving(false);
        return;
      }

      if (
        temperatureMax !== null &&
        !Number.isFinite(
          temperatureMax
        )
      ) {
        setErrorMessage(
          `${periodDefinition.label}: invalid maximum temperature.`
        );

        setActivePeriod(period);
        setIsSaving(false);
        return;
      }

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

      if (
        rainfall !== null &&
        (
          !Number.isFinite(
            rainfall
          ) ||
          rainfall < 0
        )
      ) {
        setErrorMessage(
          `${periodDefinition.label}: rainfall must be zero or greater.`
        );

        setActivePeriod(period);
        setIsSaving(false);
        return;
      }

      if (
        impactHours !== null &&
        (
          !Number.isFinite(
            impactHours
          ) ||
          impactHours < 0
        )
      ) {
        setErrorMessage(
          `${periodDefinition.label}: impact hours must be zero or greater.`
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

      if (saveError) {
        setErrorMessage(
          saveError.message
        );

        setActivePeriod(period);
        setIsSaving(false);
        return;
      }

      setWeather(
        (current) => ({
          ...current,

          [period]: {
            ...current[period],
            id: savedRecord.id,
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

    onCountChange?.(
      count
    );

    setSuccessMessage(
      'Weather and site conditions saved successfully.'
    );

    setIsSaving(false);
  }

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
          02 · WEATHER & SITE CONDITIONS
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Weather...
        </h2>
      </section>
    );
  }

  const isReadOnly =
    report?.status !== 'draft';

  const currentWeather =
    weather[activePeriod];

  const recordedPeriods =
    Object.values(
      weather
    ).filter(
      hasPeriodContent
    ).length;

  const impactedPeriods =
    Object.values(
      weather
    ).filter(
      (item) =>
        item.productionImpact !==
        'none'
    ).length;

  const totalImpactHours =
    Object.values(
      weather
    ).reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.impactHours
          ) ||
          0
        ),
      0
    );

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
                02 · WEATHER & SITE CONDITIONS
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Daily weather summary
              </h2>

              <p
                className={
                  styles.integrationText
                }
              >
                Weather, site
                conditions and
                production impacts
                for{' '}
                {project?.name ||
                  'the project'}.
              </p>
            </div>

            <span
              className={`${styles.statusBadge} ${
                recordedPeriods > 0
                  ? styles.statusApproved
                  : styles.statusDraft
              }`}
            >
              {recordedPeriods}/3 periods
            </span>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
              gap:
                '12px',
              marginTop:
                '16px',
            }}
          >
            <SummaryCard
              label="PERIODS RECORDED"
              value={
                recordedPeriods
              }
              emphasis={
                recordedPeriods > 0
                  ? 'success'
                  : undefined
              }
            />

            <SummaryCard
              label="PRODUCTION IMPACT"
              value={
                impactedPeriods
              }
              emphasis={
                impactedPeriods > 0
                  ? 'warning'
                  : undefined
              }
            />

            <SummaryCard
              label="IMPACT HOURS"
              value={
                totalImpactHours.toFixed(
                  1
                )
              }
              emphasis={
                totalImpactHours > 0
                  ? 'warning'
                  : undefined
              }
            />

            <SummaryCard
              label="SITE STATUS"
              value={
                recordedPeriods > 0
                  ? 'Recorded'
                  : 'Pending'
              }
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
                WEATHER PERIODS
              </p>

              <h2
                className={
                  styles.sectionTitle
                }
              >
                Select reporting period
              </h2>
            </div>
          </div>

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap:
                '10px',
            }}
          >
            {PERIODS.map(
              (period) => {
                const active =
                  activePeriod ===
                  period.key;

                const recorded =
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
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      alignItems:
                        'flex-start',
                      justifyContent:
                        'center',
                      minHeight:
                        '60px',
                      padding:
                        '10px 13px',
                      border:
                        active
                          ? '1px solid #087f73'
                          : '1px solid #e2e8f0',
                      borderRadius:
                        '9px',
                      background:
                        active
                          ? '#087f73'
                          : '#ffffff',
                      color:
                        active
                          ? '#ffffff'
                          : '#334155',
                      cursor:
                        'pointer',
                      fontFamily:
                        'inherit',
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          '0.74rem',
                      }}
                    >
                      {period.label}
                    </strong>

                    <span
                      style={{
                        marginTop:
                          '4px',
                        color:
                          active
                            ? 'rgba(255,255,255,.72)'
                            : '#94a3b8',
                        fontSize:
                          '0.62rem',
                      }}
                    >
                      {recorded
                        ? 'Recorded'
                        : 'No data'}
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
              display:
                'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap:
                '16px',
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
                  currentWeather.condition
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'condition',
                    event.target.value
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
                  currentWeather.temperatureMin
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'temperatureMin',
                    event.target.value
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
                  currentWeather.temperatureMax
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'temperatureMax',
                    event.target.value
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
                  currentWeather.temperatureUnit
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'temperatureUnit',
                    event.target.value
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
                  currentWeather.rainfall
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'rainfall',
                    event.target.value
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
                Wind
              </span>

              <select
                value={
                  currentWeather.windCondition
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'windCondition',
                    event.target.value
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
                  currentWeather.siteCondition
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'siteCondition',
                    event.target.value
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
                  Select site condition
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
                  currentWeather.productionImpact
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'productionImpact',
                    event.target.value
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
                Impact hours
              </span>

              <input
                type="number"
                min="0"
                step="0.25"
                value={
                  currentWeather.impactHours
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    activePeriod,
                    'impactHours',
                    event.target.value
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

          <label
            style={{
              ...fieldStyle,
              marginTop:
                '18px',
            }}
          >
            <span
              style={
                labelStyle
              }
            >
              Weather notes
            </span>

            <textarea
              rows={5}
              value={
                currentWeather.notes
              }
              onChange={(
                event
              ) =>
                updateField(
                  activePeriod,
                  'notes',
                  event.target.value
                )
              }
              disabled={
                isReadOnly
              }
              placeholder="Weather observations, site restrictions or production impacts..."
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

        {!isReadOnly && (
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'flex-end',
              marginTop:
                '18px',
            }}
          >
            <button
              type="submit"
              className={
                styles.primaryButton
              }
              disabled={
                isSaving
              }
            >
              {isSaving
                ? 'Saving...'
                : 'Save Weather'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
