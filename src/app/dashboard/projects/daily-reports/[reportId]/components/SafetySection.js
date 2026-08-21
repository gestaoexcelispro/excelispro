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

const textareaStyle = {
  ...inputStyle,
  minHeight: '96px',
  padding: '10px 12px',
  lineHeight: 1.5,
  resize: 'vertical',
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

const SAFETY_TYPES = [
  'toolbox_talk',
  'inspection',
  'observation',
  'near_miss',
  'incident',
  'first_aid',
  'stop_work',
  'other',
];

const SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
];

const STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];

function createTemporaryId() {
  return `temp-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptySafetyItem() {
  return {
    localId: createTemporaryId(),
    id: null,

    safetyType: 'observation',
    title: '',
    description: '',

    severity: 'low',
    status: 'open',

    locationId: '',
    locationName: '',

    responsibleParty: '',
    correctiveAction: '',

    peopleInvolved: '',
    lostTime: false,

    resolvedAt: '',
  };
}

function formatSafetyType(value) {
  const labels = {
    toolbox_talk: 'Toolbox Talk',
    inspection: 'Safety Inspection',
    observation: 'Safety Observation',
    near_miss: 'Near Miss',
    incident: 'Incident',
    first_aid: 'First Aid',
    stop_work: 'Stop Work',
    other: 'Other',
  };

  return labels[value] || value;
}

function formatSeverity(value) {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return labels[value] || value;
}

function formatStatus(value) {
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return labels[value] || value;
}

function getLocalDateTime() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const localDate =
    new Date(
      now.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function formatDatabaseDateTime(value) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function SummaryCard({
  label,
  value,
  emphasis,
}) {
  let background =
    '#f8fafc';

  let color =
    '#061b2f';

  if (
    emphasis ===
    'success'
  ) {
    background =
      '#f2fbf9';

    color =
      '#087f73';
  }

  if (
    emphasis ===
    'warning'
  ) {
    background =
      '#fffbeb';

    color =
      '#9a6700';
  }

  if (
    emphasis ===
    'critical'
  ) {
    background =
      '#fff5f5';

    color =
      '#9f2929';
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
          color,
          fontSize: '1.35rem',
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function SafetySection({
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
    safetyItems,
    setSafetyItems,
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
    async function loadSafety() {
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

      setUserId(
        userData.user.id
      );

      const [
        locationsResult,
        safetyResult,
      ] =
        await Promise.all([
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
              'daily_report_safety'
            )
            .select('*')
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
        safetyResult.error;

      if (loadError) {
        setErrorMessage(
          loadError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedItems =
        (
          safetyResult.data ||
          []
        ).map(
          (item) => ({
            localId:
              item.id,

            id:
              item.id,

            safetyType:
              item.safety_type ||
              'observation',

            title:
              item.title ||
              '',

            description:
              item.description ||
              '',

            severity:
              item.severity ||
              'low',

            status:
              item.status ||
              'open',

            locationId:
              item.location_id ||
              '',

            locationName:
              item.location_name ||
              '',

            responsibleParty:
              item.responsible_party ||
              '',

            correctiveAction:
              item.corrective_action ||
              '',

            peopleInvolved:
              item.people_involved ||
              '',

            lostTime:
              Boolean(
                item.lost_time
              ),

            resolvedAt:
              formatDatabaseDateTime(
                item.resolved_at
              ),
          })
        );

      setLocations(
        locationsResult.data ||
          []
      );

      setSafetyItems(
        loadedItems
      );

      onCountChange?.(
        loadedItems.length
      );

      setIsLoading(false);
    }

    loadSafety();
  }, [
    reportId,
    projectId,
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
      [locations]
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
          names.join(' / ');

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

  const sortedLocations =
    useMemo(
      () =>
        [
          ...locations,
        ].sort(
          (a, b) => {
            const pathA =
              locationPathMap.get(
                a.id
              ) ||
              a.name;

            const pathB =
              locationPathMap.get(
                b.id
              ) ||
              b.name;

            return pathA.localeCompare(
              pathB
            );
          }
        ),
      [
        locations,
        locationPathMap,
      ]
    );

  function addSafetyItem() {
    setSafetyItems(
      (current) => [
        ...current,
        createEmptySafetyItem(),
      ]
    );

    setSuccessMessage('');
  }

  function updateSafetyItem(
    localId,
    field,
    value
  ) {
    setSafetyItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.localId !==
              localId
            ) {
              return item;
            }

            const nextItem = {
              ...item,
              [field]: value,
            };

            if (
              field ===
              'status'
            ) {
              if (
                value ===
                  'resolved' ||
                value ===
                  'closed'
              ) {
                if (
                  !nextItem.resolvedAt
                ) {
                  nextItem.resolvedAt =
                    getLocalDateTime();
                }
              } else {
                nextItem.resolvedAt =
                  '';
              }
            }

            return nextItem;
          }
        )
    );

    setSuccessMessage('');
  }

  function selectLocation(
    item,
    locationId
  ) {
    const location =
      locationMap.get(
        locationId
      );

    setSafetyItems(
      (current) =>
        current.map(
          (currentItem) =>
            currentItem.localId ===
            item.localId
              ? {
                  ...currentItem,

                  locationId,

                  locationName:
                    location
                      ? locationPathMap.get(
                          location.id
                        ) ||
                        location.name
                      : '',
                }
              : currentItem
        )
    );

    setSuccessMessage('');
  }

  async function removeSafetyItem(
    item
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

    if (item.id) {
      const confirmed =
        window.confirm(
          `Remove "${
            item.title ||
            formatSafetyType(
              item.safetyType
            )
          }" from the Daily Report?`
        );

      if (!confirmed) {
        return;
      }

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            'daily_report_safety'
          )
          .delete()
          .eq(
            'id',
            item.id
          );

      if (deleteError) {
        setErrorMessage(
          deleteError.message
        );

        return;
      }
    }

    setSafetyItems(
      (current) => {
        const next =
          current.filter(
            (currentItem) =>
              currentItem.localId !==
              item.localId
          );

        onCountChange?.(
          next.length
        );

        return next;
      }
    );
  }

  async function saveSafety(
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
      const item
      of safetyItems
    ) {
      const title =
        item.title.trim();

      const description =
        item.description.trim();

      if (
        !title &&
        !description
      ) {
        setErrorMessage(
          'Every safety record must contain a title or description.'
        );

        setIsSaving(false);
        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        safety_type:
          item.safetyType,

        title:
          title || null,

        description:
          description ||
          null,

        severity:
          item.severity,

        status:
          item.status,

        location_id:
          item.locationId ||
          null,

        location_name:
          item.locationName ||
          null,

        responsible_party:
          item.responsibleParty
            .trim() ||
          null,

        corrective_action:
          item.correctiveAction
            .trim() ||
          null,

        people_involved:
          item.peopleInvolved
            .trim() ||
          null,

        lost_time:
          item.lostTime,

        resolved_at:
          item.resolvedAt
            ? new Date(
                item.resolvedAt
              ).toISOString()
            : null,
      };

      let result;

      if (item.id) {
        result =
          await supabase
            .from(
              'daily_report_safety'
            )
            .update(
              payload
            )
            .eq(
              'id',
              item.id
            )
            .select('id')
            .single();
      } else {
        result =
          await supabase
            .from(
              'daily_report_safety'
            )
            .insert({
              ...payload,
              created_by:
                userId,
            })
            .select('id')
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

      setSafetyItems(
        (current) =>
          current.map(
            (currentItem) =>
              currentItem.localId ===
              item.localId
                ? {
                    ...currentItem,

                    id:
                      result.data.id,

                    localId:
                      result.data.id,
                  }
                : currentItem
          )
      );
    }

    onCountChange?.(
      safetyItems.length
    );

    setSuccessMessage(
      'Safety information saved successfully.'
    );

    setIsSaving(false);
  }

  const incidents =
    safetyItems.filter(
      (item) =>
        [
          'incident',
          'first_aid',
        ].includes(
          item.safetyType
        )
    ).length;

  const nearMisses =
    safetyItems.filter(
      (item) =>
        item.safetyType ===
        'near_miss'
    ).length;

  const openItems =
    safetyItems.filter(
      (item) =>
        [
          'open',
          'in_progress',
        ].includes(
          item.status
        )
    ).length;

  const lostTimeEvents =
    safetyItems.filter(
      (item) =>
        item.lostTime
    ).length;

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
          10 · SAFETY
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Safety...
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
            padding: '12px 14px',
            marginBottom: '14px',
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
            marginBottom: '14px',
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
              10 · SAFETY
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Safety & field events
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record safety
              observations, toolbox
              talks, inspections,
              near misses and field
              incidents for{' '}
              {project?.name ||
                'the project'}.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                addSafetyItem
              }
            >
              + Add Safety Record
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
            label="OPEN ITEMS"
            value={openItems}
            emphasis={
              openItems > 0
                ? 'warning'
                : 'success'
            }
          />

          <SummaryCard
            label="INCIDENTS"
            value={incidents}
            emphasis={
              incidents > 0
                ? 'critical'
                : undefined
            }
          />

          <SummaryCard
            label="NEAR MISSES"
            value={nearMisses}
            emphasis={
              nearMisses > 0
                ? 'warning'
                : undefined
            }
          />

          <SummaryCard
            label="LOST TIME"
            value={lostTimeEvents}
            emphasis={
              lostTimeEvents > 0
                ? 'critical'
                : 'success'
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveSafety
        }
      >
        {safetyItems.length ===
        0 ? (
          <section
            className={
              styles.infoCard
            }
            style={{
              marginTop: '14px',
              padding:
                '38px 24px',
              textAlign:
                'center',
            }}
          >
            <p
              className={
                styles.sectionEyebrow
              }
            >
              NO SAFETY RECORDS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              No safety events recorded
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record toolbox talks,
              inspections, safety
              observations, near
              misses or incidents
              that occurred during
              the workday.
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
                    addSafetyItem
                  }
                >
                  + Add Safety Record
                </button>
              </div>
            )}
          </section>
        ) : (
          safetyItems.map(
            (
              item,
              index
            ) => (
              <section
                key={
                  item.localId
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
                      SAFETY RECORD{' '}
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
                      {item.title ||
                        formatSafetyType(
                          item.safetyType
                        )}
                    </h2>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      className={`${styles.statusBadge} ${
                        item.status ===
                          'resolved' ||
                        item.status ===
                          'closed'
                          ? styles.statusApproved
                          : item.status ===
                              'in_progress'
                            ? styles.statusSubmitted
                            : styles.statusDraft
                      }`}
                    >
                      {formatStatus(
                        item.status
                      )}
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        style={
                          dangerButtonStyle
                        }
                        onClick={() =>
                          removeSafetyItem(
                            item
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '2fr 1fr 1fr',
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
                      Title
                    </span>

                    <input
                      type="text"
                      value={
                        item.title
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'title',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Brief safety record title"
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
                      Record type
                    </span>

                    <select
                      value={
                        item.safetyType
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'safetyType',
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
                      {SAFETY_TYPES.map(
                        (value) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {formatSafetyType(
                              value
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
                      Severity
                    </span>

                    <select
                      value={
                        item.severity
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'severity',
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
                      {SEVERITIES.map(
                        (value) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {formatSeverity(
                              value
                            )}
                          </option>
                        )
                      )}
                    </select>
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
                    Description
                  </span>

                  <textarea
                    rows={4}
                    value={
                      item.description
                    }
                    onChange={(
                      event
                    ) =>
                      updateSafetyItem(
                        item.localId,
                        'description',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Describe the safety observation, event or condition..."
                    style={
                      textareaStyle
                    }
                  />
                </label>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '16px',
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
                      Location
                    </span>

                    <select
                      value={
                        item.locationId
                      }
                      onChange={(
                        event
                      ) =>
                        selectLocation(
                          item,
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
                        No specific location
                      </option>

                      {sortedLocations.map(
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
                      Status
                    </span>

                    <select
                      value={
                        item.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'status',
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
                      {STATUSES.map(
                        (value) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {formatStatus(
                              value
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '2fr 1fr',
                    gap: '16px',
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
                      Responsible party
                    </span>

                    <input
                      type="text"
                      value={
                        item.responsibleParty
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'responsibleParty',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Person, company, trade or team"
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
                      People involved
                    </span>

                    <input
                      type="text"
                      value={
                        item.peopleInvolved
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'peopleInvolved',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Names or crew"
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
                    Corrective action
                  </span>

                  <textarea
                    rows={4}
                    value={
                      item.correctiveAction
                    }
                    onChange={(
                      event
                    ) =>
                      updateSafetyItem(
                        item.localId,
                        'correctiveAction',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Describe the action taken or required..."
                    style={
                      textareaStyle
                    }
                  />
                </label>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '16px',
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
                      Resolved at
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        item.resolvedAt
                      }
                      onChange={(
                        event
                      ) =>
                        updateSafetyItem(
                          item.localId,
                          'resolvedAt',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly ||
                        ![
                          'resolved',
                          'closed',
                        ].includes(
                          item.status
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <div
                    style={
                      fieldStyle
                    }
                  >
                    <span
                      style={
                        labelStyle
                      }
                    >
                      Lost time event
                    </span>

                    <label
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '10px',
                        minHeight:
                          '42px',
                        padding:
                          '0 12px',
                        border:
                          item.lostTime
                            ? '1px solid #fecaca'
                            : '1px solid #cbd5e1',
                        borderRadius:
                          '8px',
                        background:
                          item.lostTime
                            ? '#fff5f5'
                            : '#ffffff',
                        cursor:
                          isReadOnly
                            ? 'default'
                            : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          item.lostTime
                        }
                        onChange={(
                          event
                        ) =>
                          updateSafetyItem(
                            item.localId,
                            'lostTime',
                            event.target.checked
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                      />

                      <span
                        style={{
                          color:
                            item.lostTime
                              ? '#9f2929'
                              : '#475569',
                          fontSize:
                            '0.75rem',
                          fontWeight:
                            700,
                        }}
                      >
                        {item.lostTime
                          ? 'Yes — lost time recorded'
                          : 'No lost time recorded'}
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            )
          )
        )}

        {safetyItems.length >
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
                  : 'Save Safety Information'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
