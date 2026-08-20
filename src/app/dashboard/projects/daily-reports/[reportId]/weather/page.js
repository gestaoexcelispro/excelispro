'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../../lib/supabase/client';
import styles from '../../daily-reports.module.css';

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

function formatDate(value) {
  if (!value) return '—';

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

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

function getStatusClass(status, styles) {
  if (status === 'approved') {
    return styles.statusApproved;
  }

  if (status === 'submitted' || status === 'reviewed') {
    return styles.statusSubmitted;
  }

  return styles.statusDraft;
}

export default function DailyReportWeatherPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);
  const [weatherRecord, setWeatherRecord] = useState(null);

  const [condition, setCondition] = useState('');
  const [temperatureMin, setTemperatureMin] = useState('');
  const [temperatureMax, setTemperatureMax] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [windCondition, setWindCondition] = useState('');
  const [siteCondition, setSiteCondition] = useState('');
  const [productionImpact, setProductionImpact] = useState('none');
  const [impactHours, setImpactHours] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadWeather() {
      if (!reportId) return;

      setIsLoading(true);
      setErrorMessage('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
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

      if (reportError || !reportData) {
        setErrorMessage(
          reportError?.message || 'Daily Report not found.'
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
        .eq('id', reportData.project_id)
        .single();

      if (projectError || !projectData) {
        setErrorMessage(
          projectError?.message || 'Project not found.'
        );
        setIsLoading(false);
        return;
      }

      setReport(reportData);
      setProject(projectData);

      const {
        data: weatherData,
        error: weatherError,
      } = await supabase
        .from('daily_report_weather')
        .select('*')
        .eq('daily_report_id', reportId)
        .maybeSingle();

      if (weatherError) {
        setErrorMessage(weatherError.message);
        setIsLoading(false);
        return;
      }

      if (weatherData) {
        setWeatherRecord(weatherData);
        setCondition(weatherData.condition || '');
        setTemperatureMin(
          weatherData.temperature_min ?? ''
        );
        setTemperatureMax(
          weatherData.temperature_max ?? ''
        );
        setRainfall(weatherData.rainfall ?? '');
        setWindCondition(weatherData.wind_condition || '');
        setSiteCondition(weatherData.site_condition || '');
        setProductionImpact(
          weatherData.production_impact || 'none'
        );
        setImpactHours(weatherData.impact_hours ?? '');
        setNotes(weatherData.notes || '');
      }

      setIsLoading(false);
    }

    loadWeather();
  }, [reportId, supabase]);

  async function saveWeather(event) {
    event.preventDefault();

    if (!report || isSaving) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      organization_id: report.organization_id,
      project_id: report.project_id,
      daily_report_id: report.id,
      condition: condition || null,
      temperature_min:
        temperatureMin === '' ? null : Number(temperatureMin),
      temperature_max:
        temperatureMax === '' ? null : Number(temperatureMax),
      rainfall:
        rainfall === '' ? null : Number(rainfall),
      wind_condition: windCondition || null,
      site_condition: siteCondition || null,
      production_impact: productionImpact || 'none',
      impact_hours:
        impactHours === '' ? null : Number(impactHours),
      notes: notes.trim() || null,
    };

    let result;

    if (weatherRecord?.id) {
      result = await supabase
        .from('daily_report_weather')
        .update(payload)
        .eq('id', weatherRecord.id)
        .select('*')
        .single();
    } else {
      result = await supabase
        .from('daily_report_weather')
        .insert(payload)
        .select('*')
        .single();
    }

    if (result.error) {
      setErrorMessage(result.error.message);
      setIsSaving(false);
      return;
    }

    setWeatherRecord(result.data);
    setSuccessMessage(
      'Weather and site conditions saved successfully.'
    );
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            Loading Weather & Site Conditions...
          </h1>
        </section>
      </main>
    );
  }

  if (errorMessage && (!report || !project)) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            Weather information unavailable
          </h1>

          <p className={styles.integrationText}>
            {errorMessage}
          </p>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              router.push('/dashboard/projects/daily-reports')
            }
          >
            ← Daily Report Center
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            DAILY REPORT · WEATHER & SITE CONDITIONS
          </p>

          <h1 className={styles.title}>
            DR-{String(report.report_number).padStart(4, '0')}
          </h1>

          <p className={styles.description}>
            {project.code || 'Unassigned'} · {project.name} ·{' '}
            {formatDate(report.report_date)}
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
            {formatStatus(report.status)}
          </span>

          <button
            type="button"
            className={styles.secondaryButton}
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
            padding: '12px 14px',
            color: '#9f2929',
            border: '1px solid #fecaca',
            borderRadius: '9px',
            background: '#fff5f5',
            fontSize: '0.76rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px 14px',
            color: '#087f73',
            border: '1px solid #b7eee6',
            borderRadius: '9px',
            background: '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={saveWeather}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                02 · WEATHER
              </p>

              <h2 className={styles.sectionTitle}>
                Weather conditions
              </h2>
            </div>

            <span
              className={`${styles.statusBadge} ${styles.statusDraft}`}
            >
              Field record
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <label style={fieldStyle}>
              <span style={labelStyle}>
                General condition
              </span>

              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              >
                <option value="">
                  Select condition
                </option>
                <option value="clear">Clear</option>
                <option value="partly_cloudy">
                  Partly cloudy
                </option>
                <option value="cloudy">Cloudy</option>
                <option value="light_rain">
                  Light rain
                </option>
                <option value="rain">Rain</option>
                <option value="heavy_rain">
                  Heavy rain
                </option>
                <option value="storm">Storm</option>
                <option value="snow">Snow</option>
                <option value="fog">Fog</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Minimum temperature
              </span>

              <input
                type="number"
                step="0.1"
                value={temperatureMin}
                onChange={(event) =>
                  setTemperatureMin(event.target.value)
                }
                disabled={report.status !== 'draft'}
                placeholder="°F / °C"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Maximum temperature
              </span>

              <input
                type="number"
                step="0.1"
                value={temperatureMax}
                onChange={(event) =>
                  setTemperatureMax(event.target.value)
                }
                disabled={report.status !== 'draft'}
                placeholder="°F / °C"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Rainfall
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={rainfall}
                onChange={(event) =>
                  setRainfall(event.target.value)
                }
                disabled={report.status !== 'draft'}
                placeholder="0.00"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Wind condition
              </span>

              <select
                value={windCondition}
                onChange={(event) =>
                  setWindCondition(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              >
                <option value="">
                  Select wind condition
                </option>
                <option value="calm">Calm</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="strong">Strong</option>
                <option value="severe">Severe</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Site condition
              </span>

              <select
                value={siteCondition}
                onChange={(event) =>
                  setSiteCondition(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              >
                <option value="">
                  Select site condition
                </option>
                <option value="dry">Dry</option>
                <option value="damp">Damp</option>
                <option value="wet">Wet</option>
                <option value="muddy">Muddy</option>
                <option value="frozen">Frozen</option>
                <option value="restricted">
                  Restricted
                </option>
              </select>
            </label>
          </div>
        </section>

        <section
          className={styles.infoCard}
          style={{ marginTop: '14px' }}
        >
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                PRODUCTION IMPACT
              </p>

              <h2 className={styles.sectionTitle}>
                Weather impact on field operations
              </h2>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '2fr 1fr',
              gap: '16px',
            }}
          >
            <label style={fieldStyle}>
              <span style={labelStyle}>
                Impact level
              </span>

              <select
                value={productionImpact}
                onChange={(event) =>
                  setProductionImpact(event.target.value)
                }
                disabled={report.status !== 'draft'}
                style={inputStyle}
              >
                <option value="none">
                  No impact
                </option>
                <option value="minor">
                  Minor impact
                </option>
                <option value="partial">
                  Partial disruption
                </option>
                <option value="major">
                  Major disruption
                </option>
                <option value="shutdown">
                  Work shutdown
                </option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Impact hours
              </span>

              <input
                type="number"
                min="0"
                step="0.25"
                value={impactHours}
                onChange={(event) =>
                  setImpactHours(event.target.value)
                }
                disabled={report.status !== 'draft'}
                placeholder="0.00"
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        <section
          className={styles.infoCard}
          style={{ marginTop: '14px' }}
        >
          <div className={styles.infoCardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                FIELD NOTES
              </p>

              <h2 className={styles.sectionTitle}>
                Weather observations
              </h2>
            </div>
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              Notes
            </span>

            <textarea
              rows={6}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              disabled={report.status !== 'draft'}
              placeholder="Describe weather changes, site conditions, interruptions or other relevant observations..."
              style={{
                ...inputStyle,
                minHeight: '140px',
                padding: '12px',
                lineHeight: 1.55,
                resize: 'vertical',
              }}
            />
          </label>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <button
            type="button"
            className={styles.secondaryButton}
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
            className={styles.primaryButton}
            disabled={
              report.status !== 'draft' ||
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
