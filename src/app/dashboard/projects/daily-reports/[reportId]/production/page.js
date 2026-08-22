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

const dangerButtonStyle = {
  minHeight: '36px',
  padding: '0 12px',
  color: '#9f2929',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  background: '#fff5f5',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.72rem',
  fontWeight: 800,
};

function createTemporaryId() {
  return `temp-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptyProductionEntry() {
  return {
    localId: createTemporaryId(),
    id: null,

    locationId: '',
    projectServiceId: '',
    locationServiceQuantityId: '',

    locationName: '',
    serviceCode: '',
    serviceName: '',
    unit: '',

    scopeQuantity: '',

    plannedQuantity: '',
    actualQuantity: '',

    previousCumulativeQuantity: 0,
    calculatedCumulativeQuantity: 0,

    varianceReason: '',
    varianceNotes: '',
    notes: '',
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

function numericValue(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalizedValue = Number(
    String(value).replace(',', '.')
  );

  if (!Number.isFinite(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

function formatQuantity(value, unit = '') {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return '—';
  }

  const formatted = new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 2,
    }
  ).format(numeric);

  return unit
    ? `${formatted} ${unit}`
    : formatted;
}

export default function DailyReportProductionPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [userId, setUserId] = useState(null);

  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [locations, setLocations] = useState([]);
  const [projectServices, setProjectServices] = useState([]);
  const [serviceQuantities, setServiceQuantities] = useState([]);

  const [entries, setEntries] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadProduction() {
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

      setUserId(userData.user.id);

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

      const [
        locationsResult,
        servicesResult,
        quantitiesResult,
        productionResult,
      ] = await Promise.all([
        supabase
          .from('locations')
          .select(`
            id,
            project_id,
            parent_id,
            name,
            location_type,
            environment_type,
            sequence_number
          `)
          .eq(
            'project_id',
            reportData.project_id
          )
          .order('sequence_number', {
            ascending: true,
          })
          .order('name', {
            ascending: true,
          }),

        supabase
          .from('project_services')
          .select(`
            id,
            project_id,
            service_code,
            service_name,
            unit,
            sequence_number,
            is_active
          `)
          .eq(
            'project_id',
            reportData.project_id
          )
          .eq('is_active', true)
          .order('sequence_number', {
            ascending: true,
          })
          .order('service_name', {
            ascending: true,
          }),

        supabase
          .from('location_service_quantities')
          .select(`
            id,
            project_id,
            location_id,
            service_id,
            quantity
          `)
          .eq(
            'project_id',
            reportData.project_id
          ),

        supabase
          .from('daily_report_production')
          .select(`
            id,
            daily_report_id,
            location_id,
            project_service_id,
            location_service_quantity_id,
            location_name,
            service_code,
            service_name,
            unit,
            planned_quantity,
            actual_quantity,
            cumulative_quantity,
            production_status,
            variance_reason,
            variance_notes,
            notes,
            source,
            created_by,
            created_at,
            updated_at
          `)
          .eq(
            'daily_report_id',
            reportData.id
          )
          .order('created_at', {
            ascending: true,
          }),
      ]);

      const loadError =
        locationsResult.error ||
        servicesResult.error ||
        quantitiesResult.error ||
        productionResult.error;

      if (loadError) {
        setErrorMessage(
          loadError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedLocations =
        locationsResult.data || [];

      const loadedServices =
        servicesResult.data || [];

      const loadedQuantities =
        quantitiesResult.data || [];

      const loadedProduction =
        productionResult.data || [];

      setReport(reportData);
      setProject(projectData);

      setLocations(loadedLocations);
      setProjectServices(loadedServices);
      setServiceQuantities(loadedQuantities);

      const nextEntries = [];

      for (const item of loadedProduction) {
        const scopeQuantity =
          loadedQuantities.find(
            (quantity) =>
              quantity.id ===
              item.location_service_quantity_id
          );

        const {
          data: previousProduction,
          error: previousProductionError,
        } = await supabase
          .from('daily_report_production')
          .select(`
            actual_quantity,
            daily_reports!inner(
              report_date
            )
          `)
          .eq(
            'location_id',
            item.location_id
          )
          .eq(
            'project_service_id',
            item.project_service_id
          )
          .lt(
            'daily_reports.report_date',
            reportData.report_date
          );

        if (previousProductionError) {
          setErrorMessage(
            previousProductionError.message
          );

          setIsLoading(false);
          return;
        }

        const previousCumulative =
          (previousProduction || []).reduce(
            (total, previousItem) =>
              total +
              (Number(
                previousItem.actual_quantity
              ) || 0),
            0
          );

        const actualToday =
          Number(
            item.actual_quantity || 0
          );

        nextEntries.push({
          localId: item.id,
          id: item.id,

          locationId:
            item.location_id || '',

          projectServiceId:
            item.project_service_id || '',

          locationServiceQuantityId:
            item.location_service_quantity_id || '',

          locationName:
            item.location_name || '',

          serviceCode:
            item.service_code || '',

          serviceName:
            item.service_name || '',

          unit:
            item.unit || '',

          scopeQuantity:
            scopeQuantity?.quantity !== null &&
            scopeQuantity?.quantity !== undefined
              ? String(
                  scopeQuantity.quantity
                )
              : '',

          plannedQuantity:
            item.planned_quantity !== null &&
            item.planned_quantity !== undefined
              ? String(
                  item.planned_quantity
                )
              : '',

          actualQuantity:
            item.actual_quantity !== null &&
            item.actual_quantity !== undefined
              ? String(
                  item.actual_quantity
                )
              : '',

          previousCumulativeQuantity:
            previousCumulative,

          calculatedCumulativeQuantity:
            previousCumulative +
            actualToday,

          varianceReason:
            item.variance_reason || '',

          varianceNotes:
            item.variance_notes || '',

          notes:
            item.notes || '',
        });
      }

      setEntries(nextEntries);

      setIsLoading(false);
    }

    loadProduction();
  }, [
    reportId,
    supabase,
  ]);

  const locationMap = useMemo(() => {
    return new Map(
      locations.map(
        (location) => [
          location.id,
          location,
        ]
      )
    );
  }, [locations]);

  const locationPathMap = useMemo(() => {
    const result = new Map();

    function buildPath(location) {
      if (!location) {
        return '';
      }

      if (
        result.has(location.id)
      ) {
        return result.get(
          location.id
        );
      }

      const names = [];
      const visited = new Set();

      let current = location;

      while (
        current &&
        !visited.has(current.id)
      ) {
        visited.add(current.id);

        names.unshift(
          current.name
        );

        current = current.parent_id
          ? locationMap.get(
              current.parent_id
            )
          : null;
      }

      const path =
        names.join(' / ');

      result.set(
        location.id,
        path
      );

      return path;
    }

    locations.forEach(
      (location) => {
        buildPath(location);
      }
    );

    return result;
  }, [
    locations,
    locationMap,
  ]);

  const productionLocations = useMemo(() => {
    const validLocationIds =
      new Set(
        serviceQuantities.map(
          (item) => item.location_id
        )
      );

    return locations.filter(
      (location) =>
        validLocationIds.has(
          location.id
        )
    );
  }, [
    locations,
    serviceQuantities,
  ]);

  function getAvailableServices(
    locationId
  ) {
    if (!locationId) {
      return [];
    }

    const quantityRows =
      serviceQuantities.filter(
        (quantity) =>
          quantity.location_id ===
          locationId
      );

    return quantityRows
      .map((quantity) => {
        const service =
          projectServices.find(
            (item) =>
              item.id ===
              quantity.service_id
          );

        if (!service) {
          return null;
        }

        return {
          ...service,
          locationServiceQuantityId:
            quantity.id,
          scopeQuantity:
            quantity.quantity,
        };
      })
      .filter(Boolean);
  }

  async function calculatePreviousCumulative(
    locationId,
    projectServiceId
  ) {
    if (
      !locationId ||
      !projectServiceId ||
      !report
    ) {
      return 0;
    }

    const {
      data,
      error,
    } = await supabase
      .from('daily_report_production')
      .select(`
        actual_quantity,
        daily_reports!inner(
          report_date
        )
      `)
      .eq(
        'location_id',
        locationId
      )
      .eq(
        'project_service_id',
        projectServiceId
      )
      .lt(
        'daily_reports.report_date',
        report.report_date
      );

    if (error) {
      throw error;
    }

    return (data || []).reduce(
      (total, item) =>
        total +
        (Number(
          item.actual_quantity
        ) || 0),
      0
    );
  }

  function addProductionEntry() {
    setEntries(
      (currentEntries) => [
        ...currentEntries,
        createEmptyProductionEntry(),
      ]
    );

    setSuccessMessage('');
  }

  function updateEntry(
    localId,
    field,
    value
  ) {
    setEntries(
      (currentEntries) =>
        currentEntries.map(
          (entry) => {
            if (
              entry.localId !==
              localId
            ) {
              return entry;
            }

            const updatedEntry = {
              ...entry,
              [field]: value,
            };

            if (
              field === 'actualQuantity'
            ) {
              updatedEntry.calculatedCumulativeQuantity =
                updatedEntry.previousCumulativeQuantity +
                (numericValue(value) || 0);
            }

            return updatedEntry;
          }
        )
    );

    setSuccessMessage('');
  }

  function selectLocation(
    entry,
    locationId
  ) {
    const location =
      locationMap.get(
        locationId
      );

    setEntries(
      (currentEntries) =>
        currentEntries.map(
          (currentEntry) =>
            currentEntry.localId ===
            entry.localId
              ? {
                  ...currentEntry,

                  locationId,

                  locationName:
                    location
                      ? locationPathMap.get(
                          location.id
                        ) ||
                        location.name
                      : '',

                  projectServiceId:
                    '',

                  locationServiceQuantityId:
                    '',

                  serviceCode:
                    '',

                  serviceName:
                    '',

                  unit:
                    '',

                  scopeQuantity:
                    '',

                  previousCumulativeQuantity:
                    0,

                  calculatedCumulativeQuantity:
                    0,
                }
              : currentEntry
        )
    );

    setSuccessMessage('');
  }

  async function selectService(
    entry,
    serviceId
  ) {
    const availableServices =
      getAvailableServices(
        entry.locationId
      );

    const selectedService =
      availableServices.find(
        (service) =>
          service.id === serviceId
      );

    if (!selectedService) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const previousCumulative =
        await calculatePreviousCumulative(
          entry.locationId,
          selectedService.id
        );

      const actualToday =
        numericValue(
          entry.actualQuantity
        ) || 0;

      setEntries(
        (currentEntries) =>
          currentEntries.map(
            (currentEntry) =>
              currentEntry.localId ===
              entry.localId
                ? {
                    ...currentEntry,

                    projectServiceId:
                      selectedService.id,

                    locationServiceQuantityId:
                      selectedService
                        .locationServiceQuantityId,

                    serviceCode:
                      selectedService
                        .service_code ||
                      '',

                    serviceName:
                      selectedService
                        .service_name ||
                      '',

                    unit:
                      selectedService
                        .unit ||
                      '',

                    scopeQuantity:
                      selectedService
                        .scopeQuantity !==
                        null &&
                      selectedService
                        .scopeQuantity !==
                        undefined
                        ? String(
                            selectedService.scopeQuantity
                          )
                        : '',

                    previousCumulativeQuantity:
                      previousCumulative,

                    calculatedCumulativeQuantity:
                      previousCumulative +
                      actualToday,
                  }
                : currentEntry
          )
      );
    } catch (error) {
      setErrorMessage(
        error.message
      );
    }
  }

  async function removeEntry(
    entry
  ) {
    if (
      isSaving ||
      report.status !== 'draft'
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (entry.id) {
      const confirmed =
        window.confirm(
          `Remove ${entry.serviceName || 'this production record'} from the Daily Report?`
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from(
          'daily_report_production'
        )
        .delete()
        .eq('id', entry.id);

      if (deleteError) {
        setErrorMessage(
          deleteError.message
        );

        return;
      }
    }

    setEntries(
      (currentEntries) =>
        currentEntries.filter(
          (currentEntry) =>
            currentEntry.localId !==
            entry.localId
        )
    );
  }

  async function saveProduction(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      !userId ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (const entry of entries) {
      if (!entry.locationId) {
        setErrorMessage(
          'Select a location for every production record.'
        );

        setIsSaving(false);
        return;
      }

      if (
        !entry.projectServiceId
      ) {
        setErrorMessage(
          `${entry.locationName || 'Location'}: select a service.`
        );

        setIsSaving(false);
        return;
      }

      const plannedQuantity =
        numericValue(
          entry.plannedQuantity
        );

      const actualQuantity =
        numericValue(
          entry.actualQuantity
        );

      if (
        plannedQuantity !== null &&
        plannedQuantity < 0
      ) {
        setErrorMessage(
          `${entry.serviceName}: planned quantity cannot be negative.`
        );

        setIsSaving(false);
        return;
      }

      if (
        actualQuantity !== null &&
        actualQuantity < 0
      ) {
        setErrorMessage(
          `${entry.serviceName}: actual quantity cannot be negative.`
        );

        setIsSaving(false);
        return;
      }

      const previousCumulative =
        await calculatePreviousCumulative(
          entry.locationId,
          entry.projectServiceId
        );

      const calculatedCumulative =
        previousCumulative +
        (actualQuantity || 0);

      const scopeQuantity =
        numericValue(
          entry.scopeQuantity
        );

      if (
        scopeQuantity !== null &&
        calculatedCumulative >
          scopeQuantity
      ) {
        setErrorMessage(
          `${entry.serviceName}: cumulative quantity cannot exceed the location scope quantity (${formatQuantity(
            scopeQuantity,
            entry.unit
          )}).`
        );

        setIsSaving(false);
        return;
      }

      const variance =
        plannedQuantity !== null &&
        actualQuantity !== null
          ? actualQuantity -
            plannedQuantity
          : null;

      let productionStatus = 'not_started';

      if (
        actualQuantity !== null &&
        actualQuantity > 0
      ) {
        productionStatus =
          'in_progress';
      }

      if (
        scopeQuantity !== null &&
        calculatedCumulative >=
          scopeQuantity
      ) {
        productionStatus =
          'completed';
      }

      if (
        variance !== null &&
        variance < 0 &&
        productionStatus !==
          'completed'
      ) {
        productionStatus =
          'behind_plan';
      }

      const payload = {
        daily_report_id:
          report.id,

        location_id:
          entry.locationId,

        project_service_id:
          entry.projectServiceId,

        location_service_quantity_id:
          entry.locationServiceQuantityId ||
          null,

        location_name:
          entry.locationName ||
          null,

        service_code:
          entry.serviceCode ||
          null,

        service_name:
          entry.serviceName ||
          null,

        unit:
          entry.unit ||
          null,

        planned_quantity:
          plannedQuantity,

        actual_quantity:
          actualQuantity,

        cumulative_quantity:
          calculatedCumulative,

        production_status:
          productionStatus,

        variance_reason:
          entry.varianceReason.trim() ||
          null,

        variance_notes:
          entry.varianceNotes.trim() ||
          null,

        notes:
          entry.notes.trim() ||
          null,
      };

      let result;

      if (entry.id) {
        result = await supabase
          .from(
            'daily_report_production'
          )
          .update(payload)
          .eq(
            'id',
            entry.id
          )
          .select('id')
          .single();
      } else {
        result = await supabase
          .from(
            'daily_report_production'
          )
          .insert({
            ...payload,
            created_by:
              userId,
          })
          .select('id')
          .single();
      }

      if (result.error) {
        setErrorMessage(
          result.error.message
        );

        setIsSaving(false);
        return;
      }

      setEntries(
        (currentEntries) =>
          currentEntries.map(
            (currentEntry) =>
              currentEntry.localId ===
              entry.localId
                ? {
                    ...currentEntry,

                    id:
                      result.data.id,

                    localId:
                      result.data.id,

                    previousCumulativeQuantity:
                      previousCumulative,

                    calculatedCumulativeQuantity:
                      calculatedCumulative,
                  }
                : currentEntry
          )
      );
    }

    setSuccessMessage(
      'Production information saved successfully.'
    );

    setIsSaving(false);
  }

  const totalPlanned =
    entries.reduce(
      (total, entry) =>
        total +
        (numericValue(
          entry.plannedQuantity
        ) || 0),
      0
    );

  const totalActual =
    entries.reduce(
      (total, entry) =>
        total +
        (numericValue(
          entry.actualQuantity
        ) || 0),
      0
    );

  const entriesWithVariance =
    entries.filter(
      (entry) => {
        const planned =
          numericValue(
            entry.plannedQuantity
          );

        const actual =
          numericValue(
            entry.actualQuantity
          );

        return (
          planned !== null &&
          actual !== null &&
          planned !== actual
        );
      }
    ).length;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            Loading Production...
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
      <main className={styles.page}>
        <section className={styles.infoCard}>
          <p className={styles.sectionEyebrow}>
            DAILY REPORT
          </p>

          <h1 className={styles.sectionTitle}>
            Production information unavailable
          </h1>

          <p className={styles.integrationText}>
            {errorMessage}
          </p>
        </section>
      </main>
    );
  }

  const isReadOnly =
    report.status !== 'draft';

  return (
    <main className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            DAILY REPORT · PRODUCTION
          </p>

          <h1 className={styles.title}>
            DR-
            {String(
              report.report_number
            ).padStart(4, '0')}
          </h1>

          <p className={styles.description}>
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
            border:
              '1px solid #fecaca',
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
            border:
              '1px solid #b7eee6',
            borderRadius: '9px',
            background: '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {successMessage}
        </div>
      )}

      <section className={styles.infoCard}>
        <div className={styles.infoCardHeader}>
          <div>
            <p className={styles.sectionEyebrow}>
              04 · PRODUCTION
            </p>

            <h2 className={styles.sectionTitle}>
              Daily production summary
            </h2>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={
                addProductionEntry
              }
            >
              + Add Production
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <div style={{
            padding: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '9px',
            background: '#f8fafc',
          }}>
            <div style={labelStyle}>
              RECORDS
            </div>

            <div style={{
              marginTop: '5px',
              color: '#061b2f',
              fontSize: '1.35rem',
              fontWeight: 800,
            }}>
              {entries.length}
            </div>
          </div>

          <div style={{
            padding: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '9px',
            background: '#f8fafc',
          }}>
            <div style={labelStyle}>
              PLANNED TODAY
            </div>

            <div style={{
              marginTop: '5px',
              color: '#061b2f',
              fontSize: '1.35rem',
              fontWeight: 800,
            }}>
              {formatQuantity(
                totalPlanned
              )}
            </div>
          </div>

          <div style={{
            padding: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '9px',
            background: '#f8fafc',
          }}>
            <div style={labelStyle}>
              ACTUAL TODAY
            </div>

            <div style={{
              marginTop: '5px',
              color: '#061b2f',
              fontSize: '1.35rem',
              fontWeight: 800,
            }}>
              {formatQuantity(
                totalActual
              )}
            </div>
          </div>

          <div style={{
            padding: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '9px',
            background:
              entriesWithVariance > 0
                ? '#fffaf0'
                : '#f2fbf9',
          }}>
            <div style={labelStyle}>
              VARIANCES
            </div>

            <div style={{
              marginTop: '5px',
              color:
                entriesWithVariance > 0
                  ? '#9a6700'
                  : '#087f73',
              fontSize: '1.35rem',
              fontWeight: 800,
            }}>
              {entriesWithVariance}
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={saveProduction}
      >
        {entries.map(
          (entry, index) => {
            const availableServices =
              getAvailableServices(
                entry.locationId
              );

            const planned =
              numericValue(
                entry.plannedQuantity
              );

            const actual =
              numericValue(
                entry.actualQuantity
              );

            const variance =
              planned !== null &&
              actual !== null
                ? actual - planned
                : null;

            const scopeQuantity =
              numericValue(
                entry.scopeQuantity
              );

            const cumulative =
              entry.calculatedCumulativeQuantity;

            const progress =
              scopeQuantity &&
              cumulative !== null
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (cumulative /
                        scopeQuantity) *
                        100
                    )
                  )
                : null;

            return (
              <section
                key={
                  entry.localId
                }
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
                      PRODUCTION{' '}
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        '0'
                      )}
                    </p>

                    <h2
                      className={
                        styles.sectionTitle
                      }
                    >
                      {entry.serviceName ||
                        'New Production Record'}
                    </h2>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      style={
                        dangerButtonStyle
                      }
                      onClick={() =>
                        removeEntry(
                          entry
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Location
                    </span>

                    <select
                      value={
                        entry.locationId
                      }
                      onChange={(event) =>
                        selectLocation(
                          entry,
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
                        Select location
                      </option>

                      {productionLocations.map(
                        (location) => (
                          <option
                            key={
                              location.id
                            }
                            value={
                              location.id
                            }
                          >
                            {locationPathMap.get(
                              location.id
                            ) ||
                              location.name}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Service
                    </span>

                    <select
                      value={
                        entry.projectServiceId
                      }
                      onChange={(event) =>
                        selectService(
                          entry,
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly ||
                        !entry.locationId
                      }
                      style={
                        inputStyle
                      }
                    >
                      <option value="">
                        Select service
                      </option>

                      {availableServices.map(
                        (service) => (
                          <option
                            key={
                              service.id
                            }
                            value={
                              service.id
                            }
                          >
                            {
                              service.service_name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                {entry.projectServiceId && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(4, minmax(0, 1fr))',
                      gap: '12px',
                      marginTop: '16px',
                    }}
                  >
                    <div style={{
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}>
                      <div style={labelStyle}>
                        SCOPE QUANTITY
                      </div>

                      <strong>
                        {formatQuantity(
                          entry.scopeQuantity,
                          entry.unit
                        )}
                      </strong>
                    </div>

                    <div style={{
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}>
                      <div style={labelStyle}>
                        PREVIOUS CUMULATIVE
                      </div>

                      <strong>
                        {formatQuantity(
                          entry.previousCumulativeQuantity,
                          entry.unit
                        )}
                      </strong>
                    </div>

                    <div style={{
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}>
                      <div style={labelStyle}>
                        DAILY VARIANCE
                      </div>

                      <strong
                        style={{
                          color:
                            variance === null
                              ? '#64748b'
                              : variance < 0
                                ? '#9f2929'
                                : variance > 0
                                  ? '#087f73'
                                  : '#061b2f',
                        }}
                      >
                        {variance === null
                          ? '—'
                          : formatQuantity(
                              variance,
                              entry.unit
                            )}
                      </strong>
                    </div>

                    <div style={{
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}>
                      <div style={labelStyle}>
                        PROGRESS
                      </div>

                      <strong>
                        {progress === null
                          ? '—'
                          : `${progress.toFixed(
                              1
                            )}%`}
                      </strong>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: '16px',
                    marginTop: '18px',
                  }}
                >
                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Planned today
                      {entry.unit
                        ? ` (${entry.unit})`
                        : ''}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={
                        entry.plannedQuantity
                      }
                      onChange={(event) =>
                        updateEntry(
                          entry.localId,
                          'plannedQuantity',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="0"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Actual today
                      {entry.unit
                        ? ` (${entry.unit})`
                        : ''}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={
                        entry.actualQuantity
                      }
                      onChange={(event) =>
                        updateEntry(
                          entry.localId,
                          'actualQuantity',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="0"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Cumulative quantity
                      {entry.unit
                        ? ` (${entry.unit})`
                        : ''}
                    </span>

                    <input
                      type="text"
                      value={formatQuantity(
                        entry.calculatedCumulativeQuantity
                      )}
                      disabled
                      style={{
                        ...inputStyle,
                        color: '#087f73',
                        background: '#f2fbf9',
                        fontWeight: 800,
                      }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 2fr',
                    gap: '16px',
                    marginTop: '18px',
                  }}
                >
                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Variance reason
                    </span>

                    <input
                      type="text"
                      value={
                        entry.varianceReason
                      }
                      onChange={(event) =>
                        updateEntry(
                          entry.localId,
                          'varianceReason',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Example: Material delay"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Variance details
                    </span>

                    <input
                      type="text"
                      value={
                        entry.varianceNotes
                      }
                      onChange={(event) =>
                        updateEntry(
                          entry.localId,
                          'varianceNotes',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Describe why actual production differed from plan..."
                      style={
                        inputStyle
                      }
                    />
                  </label>
                </div>

                <label
                  style={{
                    ...fieldStyle,
                    marginTop: '18px',
                  }}
                >
                  <span style={labelStyle}>
                    Production notes
                  </span>

                  <textarea
                    rows={3}
                    value={
                      entry.notes
                    }
                    onChange={(event) =>
                      updateEntry(
                        entry.localId,
                        'notes',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Additional field production observations..."
                    style={{
                      ...inputStyle,
                      minHeight: '84px',
                      padding: '10px 12px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </label>
              </section>
            );
          }
        )}

        {entries.length === 0 && (
          <section
            className={styles.infoCard}
            style={{
              marginTop: '14px',
              textAlign: 'center',
              padding: '38px 24px',
            }}
          >
            <p className={styles.sectionEyebrow}>
              NO PRODUCTION RECORDED
            </p>

            <h2 className={styles.sectionTitle}>
              Add the first production record
            </h2>

            {!isReadOnly && (
              <div style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={
                    addProductionEntry
                  }
                >
                  + Add Production
                </button>
              </div>
            )}
          </section>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
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
                `/dashboard/projects/daily-reports/${report.id}/workforce`
              )
            }
          >
            ← Workforce
          </button>

          {entries.length > 0 && (
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
                : 'Save Production'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
