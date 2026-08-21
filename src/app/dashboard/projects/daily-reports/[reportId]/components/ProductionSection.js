'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../../../../../../lib/supabase/client';

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

  if (
    !Number.isFinite(
      normalizedValue
    )
  ) {
    return null;
  }

  return normalizedValue;
}

function formatQuantity(
  value,
  unit = ''
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return '—';
  }

  const formatted =
    new Intl.NumberFormat(
      'en-US',
      {
        maximumFractionDigits: 2,
      }
    ).format(numeric);

  return unit
    ? `${formatted} ${unit}`
    : formatted;
}

function SummaryCard({
  label,
  value,
  helper,
  emphasis,
}) {
  return (
    <div
      style={{
        padding: '14px',
        border: '1px solid #e2e8f0',
        borderRadius: '9px',
        background:
          emphasis === 'warning'
            ? '#fffaf0'
            : emphasis === 'success'
              ? '#f2fbf9'
              : '#f8fafc',
      }}
    >
      <div
        style={
          labelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          marginTop: '5px',
          color:
            emphasis === 'warning'
              ? '#9a6700'
              : emphasis === 'success'
                ? '#087f73'
                : '#061b2f',
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

export default function ProductionSection({
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

  const projectId =
    project?.id;

  const [
    userId,
    setUserId,
  ] = useState(null);

  const [
    locations,
    setLocations,
  ] = useState([]);

  const [
    projectServices,
    setProjectServices,
  ] = useState([]);

  const [
    serviceQuantities,
    setServiceQuantities,
  ] = useState([]);

  const [
    entries,
    setEntries,
  ] = useState([]);

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
    async function loadProduction() {
      if (
        !reportId ||
        !projectId
      ) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

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

      setUserId(
        userData.user.id
      );

      const [
        locationsResult,
        servicesResult,
        quantitiesResult,
        productionResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'locations'
            )
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
              projectId
            )
            .order(
              'sequence_number',
              {
                ascending: true,
              }
            )
            .order(
              'name',
              {
                ascending: true,
              }
            ),

          supabase
            .from(
              'project_services'
            )
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
              projectId
            )
            .eq(
              'is_active',
              true
            )
            .order(
              'sequence_number',
              {
                ascending: true,
              }
            )
            .order(
              'service_name',
              {
                ascending: true,
              }
            ),

          supabase
            .from(
              'location_service_quantities'
            )
            .select(`
              id,
              project_id,
              location_id,
              service_id,
              quantity
            `)
            .eq(
              'project_id',
              projectId
            ),

          supabase
            .from(
              'daily_report_production'
            )
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
              reportId
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            ),
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
        locationsResult.data ||
        [];

      const loadedServices =
        servicesResult.data ||
        [];

      const loadedQuantities =
        quantitiesResult.data ||
        [];

      const loadedProduction =
        productionResult.data ||
        [];

      setLocations(
        loadedLocations
      );

      setProjectServices(
        loadedServices
      );

      setServiceQuantities(
        loadedQuantities
      );

      const nextEntries = [];

      for (
        const item
        of loadedProduction
      ) {
        const scopeQuantity =
          loadedQuantities.find(
            (quantity) =>
              quantity.id ===
              item.location_service_quantity_id
          );

        const {
          data:
            previousProduction,

          error:
            previousProductionError,
        } =
          await supabase
            .from(
              'daily_report_production'
            )
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
              report.report_date
            );

        if (
          previousProductionError
        ) {
          setErrorMessage(
            previousProductionError.message
          );

          setIsLoading(false);
          return;
        }

        const previousCumulative =
          (
            previousProduction ||
            []
          ).reduce(
            (
              total,
              previousItem
            ) =>
              total +
              (
                Number(
                  previousItem.actual_quantity
                ) ||
                0
              ),
            0
          );

        const actualToday =
          Number(
            item.actual_quantity ||
            0
          );

        nextEntries.push({
          localId:
            item.id,

          id:
            item.id,

          locationId:
            item.location_id ||
            '',

          projectServiceId:
            item.project_service_id ||
            '',

          locationServiceQuantityId:
            item.location_service_quantity_id ||
            '',

          locationName:
            item.location_name ||
            '',

          serviceCode:
            item.service_code ||
            '',

          serviceName:
            item.service_name ||
            '',

          unit:
            item.unit ||
            '',

          scopeQuantity:
            scopeQuantity?.quantity !==
              null &&
            scopeQuantity?.quantity !==
              undefined
              ? String(
                  scopeQuantity.quantity
                )
              : '',

          plannedQuantity:
            item.planned_quantity !==
              null &&
            item.planned_quantity !==
              undefined
              ? String(
                  item.planned_quantity
                )
              : '',

          actualQuantity:
            item.actual_quantity !==
              null &&
            item.actual_quantity !==
              undefined
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
            item.variance_reason ||
            '',

          varianceNotes:
            item.variance_notes ||
            '',

          notes:
            item.notes ||
            '',
        });
      }

      setEntries(
        nextEntries
      );

      onCountChange?.(
        nextEntries.length
      );

      setIsLoading(false);
    }

    loadProduction();
  }, [
    reportId,
    projectId,
    report?.report_date,
    supabase,
    onCountChange,
  ]);

  const locationMap =
    useMemo(
      () =>
        new Map(
          locations.map(
            (location) => [
              location.id,
              location,
            ]
          )
        ),
      [
        locations,
      ]
    );

  const locationPathMap =
    useMemo(() => {
      const result =
        new Map();

      function buildPath(
        location
      ) {
        if (!location) {
          return '';
        }

        if (
          result.has(
            location.id
          )
        ) {
          return result.get(
            location.id
          );
        }

        const names = [];
        const visited =
          new Set();

        let current =
          location;

        while (
          current &&
          !visited.has(
            current.id
          )
        ) {
          visited.add(
            current.id
          );

          names.unshift(
            current.name
          );

          current =
            current.parent_id
              ? locationMap.get(
                  current.parent_id
                )
              : null;
        }

        const path =
          names.join(
            ' / '
          );

        result.set(
          location.id,
          path
        );

        return path;
      }

      locations.forEach(
        (location) => {
          buildPath(
            location
          );
        }
      );

      return result;
    }, [
      locations,
      locationMap,
    ]);

  const productionLocations =
    useMemo(() => {
      const validLocationIds =
        new Set(
          serviceQuantities.map(
            (item) =>
              item.location_id
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
      .map(
        (quantity) => {
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
        }
      )
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
    } =
      await supabase
        .from(
          'daily_report_production'
        )
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

    return (
      data || []
    ).reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.actual_quantity
          ) ||
          0
        ),
      0
    );
  }

  function addProductionEntry() {
    setEntries(
      (
        currentEntries
      ) => [
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
      (
        currentEntries
      ) =>
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
              [field]:
                value,
            };

            if (
              field ===
              'actualQuantity'
            ) {
              updatedEntry.calculatedCumulativeQuantity =
                updatedEntry.previousCumulativeQuantity +
                (
                  numericValue(
                    value
                  ) ||
                  0
                );
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
      (
        currentEntries
      ) =>
        currentEntries.map(
          (
            currentEntry
          ) =>
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
          service.id ===
          serviceId
      );

    if (
      !selectedService
    ) {
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
        (
          currentEntries
        ) =>
          currentEntries.map(
            (
              currentEntry
            ) =>
              currentEntry.localId ===
              entry.localId
                ? {
                    ...currentEntry,

                    projectServiceId:
                      selectedService.id,

                    locationServiceQuantityId:
                      selectedService.locationServiceQuantityId,

                    serviceCode:
                      selectedService.service_code ||
                      '',

                    serviceName:
                      selectedService.service_name ||
                      '',

                    unit:
                      selectedService.unit ||
                      '',

                    scopeQuantity:
                      selectedService.scopeQuantity !==
                        null &&
                      selectedService.scopeQuantity !==
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
      report?.status !==
        'draft'
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (entry.id) {
      const confirmed =
        window.confirm(
          `Remove ${
            entry.serviceName ||
            'this production record'
          } from the Daily Report?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            'daily_report_production'
          )
          .delete()
          .eq(
            'id',
            entry.id
          );

      if (
        deleteError
      ) {
        setErrorMessage(
          deleteError.message
        );

        return;
      }
    }

    setEntries(
      (
        currentEntries
      ) => {
        const nextEntries =
          currentEntries.filter(
            (
              currentEntry
            ) =>
              currentEntry.localId !==
              entry.localId
          );

        onCountChange?.(
          nextEntries.length
        );

        return nextEntries;
      }
    );
  }

  async function saveProduction(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      !userId ||
      isSaving ||
      report.status !==
        'draft'
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (
      const entry
      of entries
    ) {
      if (
        !entry.locationId
      ) {
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
          `${
            entry.locationName ||
            'Location'
          }: select a service.`
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
        plannedQuantity !==
          null &&
        plannedQuantity < 0
      ) {
        setErrorMessage(
          `${entry.serviceName}: planned quantity cannot be negative.`
        );

        setIsSaving(false);
        return;
      }

      if (
        actualQuantity !==
          null &&
        actualQuantity < 0
      ) {
        setErrorMessage(
          `${entry.serviceName}: actual quantity cannot be negative.`
        );

        setIsSaving(false);
        return;
      }

      let previousCumulative;

      try {
        previousCumulative =
          await calculatePreviousCumulative(
            entry.locationId,
            entry.projectServiceId
          );
      } catch (error) {
        setErrorMessage(
          error.message
        );

        setIsSaving(false);
        return;
      }

      const calculatedCumulative =
        previousCumulative +
        (
          actualQuantity ||
          0
        );

      const scopeQuantity =
        numericValue(
          entry.scopeQuantity
        );

      if (
        scopeQuantity !==
          null &&
        calculatedCumulative >
          scopeQuantity
      ) {
        setErrorMessage(
          `${
            entry.serviceName
          }: cumulative quantity cannot exceed the location scope quantity (${formatQuantity(
            scopeQuantity,
            entry.unit
          )}).`
        );

        setIsSaving(false);
        return;
      }

      const variance =
        plannedQuantity !==
          null &&
        actualQuantity !==
          null
          ? actualQuantity -
            plannedQuantity
          : null;

      let productionStatus =
        'not_started';

      if (
        actualQuantity !==
          null &&
        actualQuantity > 0
      ) {
        productionStatus =
          'in_progress';
      }

      if (
        scopeQuantity !==
          null &&
        calculatedCumulative >=
          scopeQuantity
      ) {
        productionStatus =
          'completed';
      }

      if (
        variance !==
          null &&
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

      if (
        entry.id
      ) {
        result =
          await supabase
            .from(
              'daily_report_production'
            )
            .update(
              payload
            )
            .eq(
              'id',
              entry.id
            )
            .select(
              'id'
            )
            .single();
      } else {
        result =
          await supabase
            .from(
              'daily_report_production'
            )
            .insert({
              ...payload,

              created_by:
                userId,
            })
            .select(
              'id'
            )
            .single();
      }

      if (
        result.error
      ) {
        setErrorMessage(
          result.error.message
        );

        setIsSaving(false);
        return;
      }

      setEntries(
        (
          currentEntries
        ) =>
          currentEntries.map(
            (
              currentEntry
            ) =>
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

    onCountChange?.(
      entries.length
    );

    setSuccessMessage(
      'Production information saved successfully.'
    );

    setIsSaving(false);
  }

  const totalPlanned =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          numericValue(
            entry.plannedQuantity
          ) ||
          0
        ),
      0
    );

  const totalActual =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          numericValue(
            entry.actualQuantity
          ) ||
          0
        ),
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
          planned !==
            null &&
          actual !==
            null &&
          planned !==
            actual
        );
      }
    ).length;

  if (
    isLoading
  ) {
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
          04 · PRODUCTION
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Production...
        </h2>
      </section>
    );
  }

  const isReadOnly =
    report?.status !==
    'draft';

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
              04 · PRODUCTION
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily production summary
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record actual
              production by
              location and
              project service.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
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
          <SummaryCard
            label="RECORDS"
            value={
              entries.length
            }
          />

          <SummaryCard
            label="PLANNED TODAY"
            value={
              formatQuantity(
                totalPlanned
              )
            }
          />

          <SummaryCard
            label="ACTUAL TODAY"
            value={
              formatQuantity(
                totalActual
              )
            }
            emphasis="success"
          />

          <SummaryCard
            label="VARIANCES"
            value={
              entriesWithVariance
            }
            emphasis={
              entriesWithVariance >
              0
                ? 'warning'
                : undefined
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveProduction
        }
      >
        {entries.map(
          (
            entry,
            index
          ) => {
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
              planned !==
                null &&
              actual !==
                null
                ? actual -
                  planned
                : null;

            const scopeQuantity =
              numericValue(
                entry.scopeQuantity
              );

            const cumulative =
              entry.calculatedCumulativeQuantity;

            const progress =
              scopeQuantity &&
              cumulative !==
                null
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (
                        cumulative /
                        scopeQuantity
                      ) *
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
                        index +
                          1
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
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
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
                      Location
                    </span>

                    <select
                      value={
                        entry.locationId
                      }
                      onChange={(
                        event
                      ) =>
                        selectLocation(
                          entry,
                          event
                            .target
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
                        Select location
                      </option>

                      {productionLocations.map(
                        (
                          location
                        ) => (
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
                      Service
                    </span>

                    <select
                      value={
                        entry.projectServiceId
                      }
                      onChange={(
                        event
                      ) =>
                        selectService(
                          entry,
                          event
                            .target
                            .value
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
                        (
                          service
                        ) => (
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
                      label="SCOPE QUANTITY"
                      value={
                        formatQuantity(
                          entry.scopeQuantity,
                          entry.unit
                        )
                      }
                    />

                    <SummaryCard
                      label="PREVIOUS CUMULATIVE"
                      value={
                        formatQuantity(
                          entry.previousCumulativeQuantity,
                          entry.unit
                        )
                      }
                    />

                    <SummaryCard
                      label="DAILY VARIANCE"
                      value={
                        variance ===
                        null
                          ? '—'
                          : formatQuantity(
                              variance,
                              entry.unit
                            )
                      }
                      emphasis={
                        variance !==
                          null &&
                        variance <
                          0
                          ? 'warning'
                          : variance !==
                                null &&
                              variance >
                                0
                            ? 'success'
                            : undefined
                      }
                    />

                    <SummaryCard
                      label="PROGRESS"
                      value={
                        progress ===
                        null
                          ? '—'
                          : `${progress.toFixed(
                              1
                            )}%`
                      }
                    />
                  </div>
                )}

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap:
                      '16px',
                    marginTop:
                      '18px',
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
                      onChange={(
                        event
                      ) =>
                        updateEntry(
                          entry.localId,
                          'plannedQuantity',
                          event
                            .target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        updateEntry(
                          entry.localId,
                          'actualQuantity',
                          event
                            .target
                            .value
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
                      Cumulative quantity
                      {entry.unit
                        ? ` (${entry.unit})`
                        : ''}
                    </span>

                    <input
                      type="text"
                      value={
                        formatQuantity(
                          entry.calculatedCumulativeQuantity
                        )
                      }
                      disabled
                      style={{
                        ...inputStyle,
                        color:
                          '#087f73',
                        background:
                          '#f2fbf9',
                        fontWeight:
                          800,
                      }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 2fr',
                    gap:
                      '16px',
                    marginTop:
                      '18px',
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
                      Variance reason
                    </span>

                    <input
                      type="text"
                      value={
                        entry.varianceReason
                      }
                      onChange={(
                        event
                      ) =>
                        updateEntry(
                          entry.localId,
                          'varianceReason',
                          event
                            .target
                            .value
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
                      Variance details
                    </span>

                    <input
                      type="text"
                      value={
                        entry.varianceNotes
                      }
                      onChange={(
                        event
                      ) =>
                        updateEntry(
                          entry.localId,
                          'varianceNotes',
                          event
                            .target
                            .value
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
                    marginTop:
                      '18px',
                  }}
                >
                  <span
                    style={
                      labelStyle
                    }
                  >
                    Production notes
                  </span>

                  <textarea
                    rows={
                      3
                    }
                    value={
                      entry.notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateEntry(
                        entry.localId,
                        'notes',
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Additional field production observations..."
                    style={{
                      ...inputStyle,
                      minHeight:
                        '84px',
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
            );
          }
        )}

        {entries.length ===
          0 && (
          <section
            className={
              styles.infoCard
            }
            style={{
              marginTop:
                '14px',
              textAlign:
                'center',
              padding:
                '38px 24px',
            }}
          >
            <p
              className={
                styles.sectionEyebrow
              }
            >
              NO PRODUCTION RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Add the first production record
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Select a location
              and service to
              record planned and
              actual production.
            </p>

            {!isReadOnly && (
              <div
                style={{
                  marginTop:
                    '18px',
                }}
              >
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
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

        {entries.length >
          0 &&
          !isReadOnly && (
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
                  : 'Save Production'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
