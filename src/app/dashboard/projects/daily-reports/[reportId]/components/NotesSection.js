'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

const noteCategories = [
  'general',
  'safety',
  'quality',
  'coordination',
  'inspection',
  'visitor',
  'other',
];

function createTemporaryId() {
  return `temp-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptyNote() {
  return {
    localId: createTemporaryId(),
    id: null,

    category: 'general',

    title: '',
    content: '',

    locationId: '',
    locationName: '',

    projectServiceId: '',
    serviceName: '',
  };
}

function formatCategory(category) {
  const labels = {
    general: 'General',
    safety: 'Safety',
    quality: 'Quality',
    coordination: 'Coordination',
    inspection: 'Inspection',
    visitor: 'Visitor',
    other: 'Other',
  };

  return (
    labels[category] ||
    category
  );
}

function getCategoryBadgeStyle(
  category
) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '28px',
    padding: '0 10px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 800,
  };

  if (
    category ===
    'safety'
  ) {
    return {
      ...base,
      color: '#9f2929',
      border: '1px solid #fecaca',
      background: '#fff5f5',
    };
  }

  if (
    category ===
    'quality'
  ) {
    return {
      ...base,
      color: '#0b5fa5',
      border: '1px solid #bfdbfe',
      background: '#eff6ff',
    };
  }

  if (
    category ===
    'inspection'
  ) {
    return {
      ...base,
      color: '#7c4a03',
      border: '1px solid #fde68a',
      background: '#fffbeb',
    };
  }

  if (
    category ===
    'coordination'
  ) {
    return {
      ...base,
      color: '#5b3aa4',
      border: '1px solid #ddd6fe',
      background: '#f5f3ff',
    };
  }

  if (
    category ===
    'visitor'
  ) {
    return {
      ...base,
      color: '#087f73',
      border: '1px solid #b7eee6',
      background: '#effcf9',
    };
  }

  return {
    ...base,
    color: '#475569',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
  };
}

function SummaryCard({
  label,
  value,
  emphasis,
}) {
  return (
    <div
      style={{
        padding: '14px',

        border:
          '1px solid #e2e8f0',

        borderRadius:
          '9px',

        background:
          emphasis ===
          'success'
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
          marginTop:
            '5px',

          color:
            emphasis ===
            'success'
              ? '#087f73'
              : '#061b2f',

          fontSize:
            '1.35rem',

          fontWeight:
            800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function NotesSection({
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
    notes,
    setNotes,
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
    async function loadNotes() {
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
        notesResult,
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
              'daily_report_notes'
            )
            .select(`
              id,
              daily_report_id,
              category,
              title,
              content,
              location_name,
              service_name,
              location_id,
              project_service_id,
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
        notesResult.error;

      if (
        loadError
      ) {
        setErrorMessage(
          loadError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedNotes =
        (
          notesResult.data ||
          []
        ).map(
          (item) => ({
            localId:
              item.id,

            id:
              item.id,

            category:
              item.category ||
              'general',

            title:
              item.title ||
              '',

            content:
              item.content ||
              '',

            locationId:
              item.location_id ||
              '',

            locationName:
              item.location_name ||
              '',

            projectServiceId:
              item.project_service_id ||
              '',

            serviceName:
              item.service_name ||
              '',
          })
        );

      setLocations(
        locationsResult.data ||
          []
      );

      setProjectServices(
        servicesResult.data ||
          []
      );

      setServiceQuantities(
        quantitiesResult.data ||
          []
      );

      setNotes(
        loadedNotes
      );

      onCountChange?.(
        loadedNotes.length
      );

      setIsLoading(false);
    }

    loadNotes();
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
        if (
          !location
        ) {
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

  function getAvailableServices(
    locationId
  ) {
    if (
      !locationId
    ) {
      return projectServices;
    }

    const serviceIds =
      new Set(
        serviceQuantities
          .filter(
            (item) =>
              item.location_id ===
              locationId
          )
          .map(
            (item) =>
              item.service_id
          )
      );

    if (
      serviceIds.size ===
      0
    ) {
      return projectServices;
    }

    return projectServices.filter(
      (service) =>
        serviceIds.has(
          service.id
        )
    );
  }

  function addNote() {
    setNotes(
      (
        currentNotes
      ) => [
        ...currentNotes,
        createEmptyNote(),
      ]
    );

    setSuccessMessage('');
  }

  function updateNote(
    localId,
    field,
    value
  ) {
    setNotes(
      (
        currentNotes
      ) =>
        currentNotes.map(
          (note) =>
            note.localId ===
            localId
              ? {
                  ...note,
                  [field]:
                    value,
                }
              : note
        )
    );

    setSuccessMessage('');
  }

  function selectLocation(
    note,
    locationId
  ) {
    const location =
      locationMap.get(
        locationId
      );

    setNotes(
      (
        currentNotes
      ) =>
        currentNotes.map(
          (
            currentNote
          ) =>
            currentNote.localId ===
            note.localId
              ? {
                  ...currentNote,

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

                  serviceName:
                    '',
                }
              : currentNote
        )
    );

    setSuccessMessage('');
  }

  function selectService(
    note,
    serviceId
  ) {
    const service =
      projectServices.find(
        (item) =>
          item.id ===
          serviceId
      );

    setNotes(
      (
        currentNotes
      ) =>
        currentNotes.map(
          (
            currentNote
          ) =>
            currentNote.localId ===
            note.localId
              ? {
                  ...currentNote,

                  projectServiceId:
                    serviceId,

                  serviceName:
                    service
                      ?.service_name ||
                    '',
                }
              : currentNote
        )
    );

    setSuccessMessage('');
  }

  async function removeNote(
    note
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

    if (
      note.id
    ) {
      const confirmed =
        window.confirm(
          `Remove "${
            note.title ||
            `${formatCategory(
              note.category
            )} note`
          }" from the Daily Report?`
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
            'daily_report_notes'
          )
          .delete()
          .eq(
            'id',
            note.id
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

    setNotes(
      (
        currentNotes
      ) => {
        const nextNotes =
          currentNotes.filter(
            (
              currentNote
            ) =>
              currentNote.localId !==
              note.localId
          );

        onCountChange?.(
          nextNotes.length
        );

        return nextNotes;
      }
    );
  }

  async function saveNotes(
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
      const note
      of notes
    ) {
      const content =
        note.content.trim();

      if (
        !content
      ) {
        setErrorMessage(
          'Observation content is required for every note.'
        );

        setIsSaving(false);
        return;
      }

      if (
        !noteCategories.includes(
          note.category
        )
      ) {
        setErrorMessage(
          'One of the notes has an invalid category.'
        );

        setIsSaving(false);
        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        category:
          note.category,

        title:
          note.title.trim() ||
          null,

        content,

        location_name:
          note.locationName ||
          null,

        service_name:
          note.serviceName ||
          null,

        location_id:
          note.locationId ||
          null,

        project_service_id:
          note.projectServiceId ||
          null,
      };

      let result;

      if (
        note.id
      ) {
        result =
          await supabase
            .from(
              'daily_report_notes'
            )
            .update(
              payload
            )
            .eq(
              'id',
              note.id
            )
            .select(`
              id,
              category,
              title,
              content,
              location_name,
              service_name,
              location_id,
              project_service_id
            `)
            .single();
      } else {
        result =
          await supabase
            .from(
              'daily_report_notes'
            )
            .insert({
              ...payload,

              created_by:
                userId,
            })
            .select(`
              id,
              category,
              title,
              content,
              location_name,
              service_name,
              location_id,
              project_service_id
            `)
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

      setNotes(
        (
          currentNotes
        ) =>
          currentNotes.map(
            (
              currentNote
            ) =>
              currentNote.localId ===
              note.localId
                ? {
                    ...currentNote,

                    id:
                      result.data.id,

                    localId:
                      result.data.id,
                  }
                : currentNote
          )
      );
    }

    onCountChange?.(
      notes.length
    );

    setSuccessMessage(
      'Daily notes saved successfully.'
    );

    setIsSaving(false);
  }

  const safetyNotes =
    notes.filter(
      (note) =>
        note.category ===
        'safety'
    ).length;

  const qualityNotes =
    notes.filter(
      (note) =>
        note.category ===
        'quality'
    ).length;

  const inspectionNotes =
    notes.filter(
      (note) =>
        note.category ===
        'inspection'
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
          08 · NOTES
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Notes...
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
              08 · NOTES & OBSERVATIONS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily notes & observations
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record general,
              safety, quality,
              coordination,
              inspection and
              visitor observations
              for {project?.name ||
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
                addNote
              }
            >
              + Add Note
            </button>
          )}
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
            label="TOTAL NOTES"
            value={
              notes.length
            }
            emphasis="success"
          />

          <SummaryCard
            label="SAFETY"
            value={
              safetyNotes
            }
          />

          <SummaryCard
            label="QUALITY"
            value={
              qualityNotes
            }
          />

          <SummaryCard
            label="INSPECTIONS"
            value={
              inspectionNotes
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveNotes
        }
      >
        {notes.length ===
        0 ? (
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
              NO NOTES RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              No field observations recorded
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Add observations
              and optionally
              associate them with
              a project location
              and service.
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
                    addNote
                  }
                >
                  + Add Note
                </button>
              </div>
            )}
          </section>
        ) : (
          notes.map(
            (
              note,
              index
            ) => {
              const availableServices =
                getAvailableServices(
                  note.locationId
                );

              return (
                <section
                  key={
                    note.localId
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
                        NOTE{' '}
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
                        {note.title ||
                          formatCategory(
                            note.category
                          )}
                      </h2>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '8px',
                      }}
                    >
                      <span
                        style={getCategoryBadgeStyle(
                          note.category
                        )}
                      >
                        {formatCategory(
                          note.category
                        )}
                      </span>

                      {!isReadOnly && (
                        <button
                          type="button"
                          style={
                            dangerButtonStyle
                          }
                          onClick={() =>
                            removeNote(
                              note
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
                        '1fr 2fr',

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
                        Category
                      </span>

                      <select
                        value={
                          note.category
                        }
                        onChange={(
                          event
                        ) =>
                          updateNote(
                            note.localId,
                            'category',
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
                        {noteCategories.map(
                          (
                            category
                          ) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {formatCategory(
                                category
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
                        Title
                      </span>

                      <input
                        type="text"
                        value={
                          note.title
                        }
                        onChange={(
                          event
                        ) =>
                          updateNote(
                            note.localId,
                            'title',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Optional note title"
                        style={
                          inputStyle
                        }
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',

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
                        Location
                      </span>

                      <select
                        value={
                          note.locationId
                        }
                        onChange={(
                          event
                        ) =>
                          selectLocation(
                            note,
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
                        Service
                      </span>

                      <select
                        value={
                          note.projectServiceId
                        }
                        onChange={(
                          event
                        ) =>
                          selectService(
                            note,
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
                          No specific service
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
                      Observation
                    </span>

                    <textarea
                      rows={5}
                      value={
                        note.content
                      }
                      onChange={(
                        event
                      ) =>
                        updateNote(
                          note.localId,
                          'content',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Record the field observation, relevant context, decisions or other information..."
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

                  {(
                    note.locationName ||
                    note.serviceName
                  ) && (
                    <div
                      style={{
                        marginTop:
                          '16px',

                        padding:
                          '12px 14px',

                        border:
                          '1px solid #e2e8f0',

                        borderRadius:
                          '8px',

                        background:
                          '#f8fafc',
                      }}
                    >
                      <div
                        style={
                          labelStyle
                        }
                      >
                        LINKED CONTEXT
                      </div>

                      <div
                        style={{
                          marginTop:
                            '5px',

                          color:
                            '#061b2f',

                          fontSize:
                            '0.76rem',

                          fontWeight:
                            700,
                        }}
                      >
                        {note.locationName ||
                          'No location'}

                        {note.serviceName
                          ? ` · ${note.serviceName}`
                          : ''}
                      </div>
                    </div>
                  )}
                </section>
              );
            }
          )
        )}

        {notes.length >
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
                  : 'Save Notes'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
