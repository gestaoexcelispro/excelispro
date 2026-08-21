'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../../../../../../lib/supabase/client';

import styles from '../../../daily-reports.module.css';

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

const smallButtonStyle = {
  minHeight: '36px',
  padding: '0 12px',
  color: '#082a4a',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#ffffff',
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

function createEmptyRole() {
  return {
    localId: createTemporaryId(),
    id: null,
    roleName: '',
    workerCount: '',
  };
}

function createEmptyCrew() {
  return {
    localId: createTemporaryId(),
    id: null,

    companyName: '',
    crewName: '',
    supervisorName: '',
    workDescription: '',

    regularHours: '8',
    overtimeHours: '0',

    notes: '',

    roles: [
      createEmptyRole(),
    ],
  };
}

function getCrewWorkerCount(
  crew
) {
  return crew.roles.reduce(
    (
      total,
      role
    ) => {
      const count =
        Number(
          role.workerCount
        );

      if (
        !Number.isFinite(
          count
        ) ||
        count <= 0
      ) {
        return total;
      }

      return (
        total +
        count
      );
    },
    0
  );
}

function getCrewLaborHours(
  crew
) {
  const workers =
    getCrewWorkerCount(
      crew
    );

  const regularHours =
    Number(
      crew.regularHours
    ) || 0;

  const overtimeHours =
    Number(
      crew.overtimeHours
    ) || 0;

  return (
    workers *
    (
      regularHours +
      overtimeHours
    )
  );
}

function SummaryCard({
  label,
  value,
  helper,
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
          '#f8fafc',
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
            '#061b2f',
          fontSize:
            '1.35rem',
          fontWeight:
            800,
        }}
      >
        {value}
      </div>

      {helper && (
        <div
          style={{
            marginTop:
              '3px',
            color:
              '#64748b',
            fontSize:
              '0.66rem',
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}

export default function WorkforceSection({
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

  const [
    crews,
    setCrews,
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

  const reportId =
    report?.id;

  useEffect(() => {
    async function loadWorkforce() {
      if (!reportId) {
        setIsLoading(
          false
        );

        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data:
          workforceData,

        error:
          workforceError,
      } =
        await supabase
          .from(
            'daily_report_workforce'
          )
          .select(`
            id,
            daily_report_id,
            company_name,
            crew_name,
            supervisor_name,
            work_description,
            regular_hours,
            overtime_hours,
            notes,
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
              ascending:
                true,
            }
          );

      if (
        workforceError
      ) {
        setErrorMessage(
          workforceError.message
        );

        setIsLoading(false);
        return;
      }

      const workforceIds =
        (
          workforceData ||
          []
        ).map(
          (item) =>
            item.id
        );

      let rolesData = [];

      if (
        workforceIds.length >
        0
      ) {
        const {
          data,

          error:
            rolesError,
        } =
          await supabase
            .from(
              'daily_report_workforce_roles'
            )
            .select(`
              id,
              workforce_id,
              role_name,
              worker_count,
              created_at,
              updated_at
            `)
            .in(
              'workforce_id',
              workforceIds
            )
            .order(
              'created_at',
              {
                ascending:
                  true,
              }
            );

        if (
          rolesError
        ) {
          setErrorMessage(
            rolesError.message
          );

          setIsLoading(false);
          return;
        }

        rolesData =
          data || [];
      }

      const loadedCrews =
        (
          workforceData ||
          []
        ).map(
          (item) => {
            const crewRoles =
              rolesData
                .filter(
                  (role) =>
                    role.workforce_id ===
                    item.id
                )
                .map(
                  (role) => ({
                    localId:
                      role.id,

                    id:
                      role.id,

                    roleName:
                      role.role_name ||
                      '',

                    workerCount:
                      role.worker_count !==
                        null &&
                      role.worker_count !==
                        undefined
                        ? String(
                            role.worker_count
                          )
                        : '',
                  })
                );

            return {
              localId:
                item.id,

              id:
                item.id,

              companyName:
                item.company_name ||
                '',

              crewName:
                item.crew_name ||
                '',

              supervisorName:
                item.supervisor_name ||
                '',

              workDescription:
                item.work_description ||
                '',

              regularHours:
                item.regular_hours !==
                  null &&
                item.regular_hours !==
                  undefined
                  ? String(
                      item.regular_hours
                    )
                  : '8',

              overtimeHours:
                item.overtime_hours !==
                  null &&
                item.overtime_hours !==
                  undefined
                  ? String(
                      item.overtime_hours
                    )
                  : '0',

              notes:
                item.notes ||
                '',

              roles:
                crewRoles.length >
                0
                  ? crewRoles
                  : [
                      createEmptyRole(),
                    ],
            };
          }
        );

      setCrews(
        loadedCrews
      );

      onCountChange?.(
        loadedCrews.length
      );

      setIsLoading(false);
    }

    loadWorkforce();
  }, [
    reportId,
    supabase,
    onCountChange,
  ]);

  function addCrew() {
    setCrews(
      (
        currentCrews
      ) => [
        ...currentCrews,
        createEmptyCrew(),
      ]
    );

    setSuccessMessage('');
  }

  function updateCrew(
    localId,
    field,
    value
  ) {
    setCrews(
      (
        currentCrews
      ) =>
        currentCrews.map(
          (crew) =>
            crew.localId ===
            localId
              ? {
                  ...crew,
                  [field]:
                    value,
                }
              : crew
        )
    );

    setSuccessMessage('');
  }

  function addRole(
    crewLocalId
  ) {
    setCrews(
      (
        currentCrews
      ) =>
        currentCrews.map(
          (crew) =>
            crew.localId ===
            crewLocalId
              ? {
                  ...crew,

                  roles: [
                    ...crew.roles,
                    createEmptyRole(),
                  ],
                }
              : crew
        )
    );

    setSuccessMessage('');
  }

  function updateRole(
    crewLocalId,
    roleLocalId,
    field,
    value
  ) {
    setCrews(
      (
        currentCrews
      ) =>
        currentCrews.map(
          (crew) =>
            crew.localId ===
            crewLocalId
              ? {
                  ...crew,

                  roles:
                    crew.roles.map(
                      (
                        role
                      ) =>
                        role.localId ===
                        roleLocalId
                          ? {
                              ...role,

                              [field]:
                                value,
                            }
                          : role
                    ),
                }
              : crew
        )
    );

    setSuccessMessage('');
  }

  function removeRole(
    crewLocalId,
    roleLocalId
  ) {
    setCrews(
      (
        currentCrews
      ) =>
        currentCrews.map(
          (crew) => {
            if (
              crew.localId !==
              crewLocalId
            ) {
              return crew;
            }

            const nextRoles =
              crew.roles.filter(
                (role) =>
                  role.localId !==
                  roleLocalId
              );

            return {
              ...crew,

              roles:
                nextRoles.length >
                0
                  ? nextRoles
                  : [
                      createEmptyRole(),
                    ],
            };
          }
        )
    );

    setSuccessMessage('');
  }

  async function removeCrew(
    crew
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

    if (crew.id) {
      const confirmed =
        window.confirm(
          `Remove ${crew.crewName || 'this crew'} from the Daily Report?`
        );

      if (!confirmed) {
        return;
      }

      const {
        error:
          deleteRolesError,
      } =
        await supabase
          .from(
            'daily_report_workforce_roles'
          )
          .delete()
          .eq(
            'workforce_id',
            crew.id
          );

      if (
        deleteRolesError
      ) {
        setErrorMessage(
          deleteRolesError.message
        );

        return;
      }

      const {
        error:
          deleteCrewError,
      } =
        await supabase
          .from(
            'daily_report_workforce'
          )
          .delete()
          .eq(
            'id',
            crew.id
          );

      if (
        deleteCrewError
      ) {
        setErrorMessage(
          deleteCrewError.message
        );

        return;
      }
    }

    setCrews(
      (
        currentCrews
      ) => {
        const next =
          currentCrews.filter(
            (item) =>
              item.localId !==
              crew.localId
          );

        onCountChange?.(
          next.length
        );

        return next;
      }
    );
  }

  async function saveWorkforce(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
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
      const crew
      of crews
    ) {
      const companyName =
        crew.companyName.trim();

      const crewName =
        crew.crewName.trim();

      if (
        !companyName
      ) {
        setErrorMessage(
          'Company / Subcontractor is required for every workforce group.'
        );

        setIsSaving(false);
        return;
      }

      if (
        !crewName
      ) {
        setErrorMessage(
          'Crew name is required for every workforce group.'
        );

        setIsSaving(false);
        return;
      }

      const regularHours =
        crew.regularHours ===
        ''
          ? 0
          : Number(
              crew.regularHours
            );

      const overtimeHours =
        crew.overtimeHours ===
        ''
          ? 0
          : Number(
              crew.overtimeHours
            );

      if (
        !Number.isFinite(
          regularHours
        ) ||
        regularHours < 0
      ) {
        setErrorMessage(
          `${crewName}: regular hours must be zero or greater.`
        );

        setIsSaving(false);
        return;
      }

      if (
        !Number.isFinite(
          overtimeHours
        ) ||
        overtimeHours < 0
      ) {
        setErrorMessage(
          `${crewName}: overtime hours must be zero or greater.`
        );

        setIsSaving(false);
        return;
      }

      const validRoles =
        crew.roles.filter(
          (role) =>
            role.roleName.trim() ||
            role.workerCount !==
              ''
        );

      for (
        const role
        of validRoles
      ) {
        if (
          !role.roleName.trim()
        ) {
          setErrorMessage(
            `${crewName}: every workforce role must have a role name.`
          );

          setIsSaving(false);
          return;
        }

        const workerCount =
          Number(
            role.workerCount
          );

        if (
          !Number.isInteger(
            workerCount
          ) ||
          workerCount <= 0
        ) {
          setErrorMessage(
            `${crewName} · ${role.roleName}: worker count must be a whole number greater than zero.`
          );

          setIsSaving(false);
          return;
        }
      }

      if (
        validRoles.length ===
        0
      ) {
        setErrorMessage(
          `${crewName}: add at least one workforce role.`
        );

        setIsSaving(false);
        return;
      }

      const crewPayload = {
        daily_report_id:
          report.id,

        company_name:
          companyName,

        crew_name:
          crewName,

        supervisor_name:
          crew.supervisorName.trim() ||
          null,

        work_description:
          crew.workDescription.trim() ||
          null,

        regular_hours:
          regularHours,

        overtime_hours:
          overtimeHours,

        notes:
          crew.notes.trim() ||
          null,
      };

      let workforceId =
        crew.id;

      if (
        workforceId
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              'daily_report_workforce'
            )
            .update(
              crewPayload
            )
            .eq(
              'id',
              workforceId
            );

        if (
          updateError
        ) {
          setErrorMessage(
            updateError.message
          );

          setIsSaving(false);
          return;
        }
      } else {
        const {
          data:
            insertedCrew,

          error:
            insertError,
        } =
          await supabase
            .from(
              'daily_report_workforce'
            )
            .insert(
              crewPayload
            )
            .select(
              'id'
            )
            .single();

        if (
          insertError
        ) {
          setErrorMessage(
            insertError.message
          );

          setIsSaving(false);
          return;
        }

        workforceId =
          insertedCrew.id;
      }

      const {
        error:
          deleteRolesError,
      } =
        await supabase
          .from(
            'daily_report_workforce_roles'
          )
          .delete()
          .eq(
            'workforce_id',
            workforceId
          );

      if (
        deleteRolesError
      ) {
        setErrorMessage(
          deleteRolesError.message
        );

        setIsSaving(false);
        return;
      }

      const rolesPayload =
        validRoles.map(
          (role) => ({
            workforce_id:
              workforceId,

            role_name:
              role.roleName.trim(),

            worker_count:
              Number(
                role.workerCount
              ),
          })
        );

      const {
        data:
          insertedRoles,

        error:
          rolesInsertError,
      } =
        await supabase
          .from(
            'daily_report_workforce_roles'
          )
          .insert(
            rolesPayload
          )
          .select(`
            id,
            workforce_id,
            role_name,
            worker_count
          `);

      if (
        rolesInsertError
      ) {
        setErrorMessage(
          rolesInsertError.message
        );

        setIsSaving(false);
        return;
      }

      setCrews(
        (
          currentCrews
        ) =>
          currentCrews.map(
            (
              currentCrew
            ) => {
              if (
                currentCrew.localId !==
                crew.localId
              ) {
                return currentCrew;
              }

              return {
                ...currentCrew,

                id:
                  workforceId,

                localId:
                  workforceId,

                roles:
                  (
                    insertedRoles ||
                    []
                  ).map(
                    (
                      role
                    ) => ({
                      localId:
                        role.id,

                      id:
                        role.id,

                      roleName:
                        role.role_name,

                      workerCount:
                        String(
                          role.worker_count
                        ),
                    })
                  ),
              };
            }
          )
      );
    }

    onCountChange?.(
      crews.length
    );

    setSuccessMessage(
      'Workforce information saved successfully.'
    );

    setIsSaving(false);
  }

  const totalWorkers =
    crews.reduce(
      (
        total,
        crew
      ) =>
        total +
        getCrewWorkerCount(
          crew
        ),
      0
    );

  const totalLaborHours =
    crews.reduce(
      (
        total,
        crew
      ) =>
        total +
        getCrewLaborHours(
          crew
        ),
      0
    );

  const totalRegularLaborHours =
    crews.reduce(
      (
        total,
        crew
      ) => {
        const workers =
          getCrewWorkerCount(
            crew
          );

        return (
          total +
          workers *
            (
              Number(
                crew.regularHours
              ) || 0
            )
        );
      },
      0
    );

  const totalOvertimeLaborHours =
    crews.reduce(
      (
        total,
        crew
      ) => {
        const workers =
          getCrewWorkerCount(
            crew
          );

        return (
          total +
          workers *
            (
              Number(
                crew.overtimeHours
              ) || 0
            )
        );
      },
      0
    );

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
          03 · WORKFORCE
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Workforce...
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
              03 · WORKFORCE
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily workforce summary
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              {project?.name ||
                'Project'} workforce,
              crews, roles and
              labor-hours.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                addCrew
              }
            >
              + Add Crew
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
            label="CREWS"
            value={
              crews.length
            }
          />

          <SummaryCard
            label="WORKERS"
            value={
              totalWorkers
            }
          />

          <SummaryCard
            label="REGULAR LABOR-HOURS"
            value={
              totalRegularLaborHours.toFixed(
                1
              )
            }
          />

          <SummaryCard
            label="TOTAL LABOR-HOURS"
            value={
              totalLaborHours.toFixed(
                1
              )
            }
            helper={
              totalOvertimeLaborHours >
              0
                ? `${totalOvertimeLaborHours.toFixed(
                    1
                  )} overtime`
                : ''
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveWorkforce
        }
      >
        {crews.length ===
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
              NO WORKFORCE RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Add the first crew
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record companies,
              crews, workforce roles
              and working hours.
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
                    addCrew
                  }
                >
                  + Add Crew
                </button>
              </div>
            )}
          </section>
        ) : (
          crews.map(
            (
              crew,
              crewIndex
            ) => {
              const crewWorkers =
                getCrewWorkerCount(
                  crew
                );

              const crewLaborHours =
                getCrewLaborHours(
                  crew
                );

              return (
                <section
                  key={
                    crew.localId
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
                        CREW{' '}
                        {String(
                          crewIndex +
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
                        {crew.crewName ||
                          'New Crew'}
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
                        className={`${styles.statusBadge} ${styles.statusDraft}`}
                      >
                        {
                          crewWorkers
                        }{' '}
                        workers
                      </span>

                      {!isReadOnly && (
                        <button
                          type="button"
                          style={
                            dangerButtonStyle
                          }
                          onClick={() =>
                            removeCrew(
                              crew
                            )
                          }
                        >
                          Remove Crew
                        </button>
                      )}
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
                        Company /
                        Subcontractor
                      </span>

                      <input
                        type="text"
                        value={
                          crew.companyName
                        }
                        onChange={(
                          event
                        ) =>
                          updateCrew(
                            crew.localId,
                            'companyName',
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="e.g. ABC Construction"
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
                        Crew name
                      </span>

                      <input
                        type="text"
                        value={
                          crew.crewName
                        }
                        onChange={(
                          event
                        ) =>
                          updateCrew(
                            crew.localId,
                            'crewName',
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="e.g. Framing Crew 01"
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
                        Supervisor /
                        Foreman
                      </span>

                      <input
                        type="text"
                        value={
                          crew.supervisorName
                        }
                        onChange={(
                          event
                        ) =>
                          updateCrew(
                            crew.localId,
                            'supervisorName',
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Name"
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
                        Regular hours
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={
                          crew.regularHours
                        }
                        onChange={(
                          event
                        ) =>
                          updateCrew(
                            crew.localId,
                            'regularHours',
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
                        Overtime hours
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={
                          crew.overtimeHours
                        }
                        onChange={(
                          event
                        ) =>
                          updateCrew(
                            crew.localId,
                            'overtimeHours',
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
                      />
                    </label>

                    <div
                      style={{
                        padding:
                          '11px 12px',
                        border:
                          '1px solid #d9f6f1',
                        borderRadius:
                          '8px',
                        background:
                          '#f2fbf9',
                      }}
                    >
                      <div
                        style={
                          labelStyle
                        }
                      >
                        CREW LABOR-HOURS
                      </div>

                      <div
                        style={{
                          marginTop:
                            '4px',
                          color:
                            '#087f73',
                          fontSize:
                            '1.1rem',
                          fontWeight:
                            800,
                        }}
                      >
                        {crewLaborHours.toFixed(
                          1
                        )}
                      </div>
                    </div>
                  </div>

                  <label
                    style={{
                      ...fieldStyle,
                      marginTop:
                        '16px',
                    }}
                  >
                    <span
                      style={
                        labelStyle
                      }
                    >
                      Work description
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        crew.workDescription
                      }
                      onChange={(
                        event
                      ) =>
                        updateCrew(
                          crew.localId,
                          'workDescription',
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Describe the work performed by this crew..."
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

                  <div
                    style={{
                      marginTop:
                        '22px',
                      paddingTop:
                        '18px',
                      borderTop:
                        '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap:
                          '12px',
                        marginBottom:
                          '12px',
                      }}
                    >
                      <div>
                        <p
                          className={
                            styles.sectionEyebrow
                          }
                        >
                          WORKFORCE
                          COMPOSITION
                        </p>

                        <h3
                          style={{
                            margin:
                              0,
                            color:
                              '#061b2f',
                            fontSize:
                              '0.92rem',
                          }}
                        >
                          Roles
                        </h3>
                      </div>

                      {!isReadOnly && (
                        <button
                          type="button"
                          style={
                            smallButtonStyle
                          }
                          onClick={() =>
                            addRole(
                              crew.localId
                            )
                          }
                        >
                          + Add Role
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        gap:
                          '9px',
                      }}
                    >
                      {crew.roles.map(
                        (
                          role,
                          roleIndex
                        ) => (
                          <div
                            key={
                              role.localId
                            }
                            style={{
                              display:
                                'grid',
                              gridTemplateColumns:
                                '50px minmax(0, 1fr) 160px 100px',
                              alignItems:
                                'end',
                              gap:
                                '10px',
                              padding:
                                '10px',
                              border:
                                '1px solid #e2e8f0',
                              borderRadius:
                                '8px',
                              background:
                                '#f8fafc',
                            }}
                          >
                            <div
                              style={{
                                alignSelf:
                                  'center',
                                color:
                                  '#94a3b8',
                                fontSize:
                                  '0.68rem',
                                fontWeight:
                                  800,
                                textAlign:
                                  'center',
                              }}
                            >
                              {String(
                                roleIndex +
                                  1
                              ).padStart(
                                2,
                                '0'
                              )}
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
                                Role
                              </span>

                              <input
                                type="text"
                                value={
                                  role.roleName
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateRole(
                                    crew.localId,
                                    role.localId,
                                    'roleName',
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  isReadOnly
                                }
                                placeholder="e.g. Carpenter"
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
                                Workers
                              </span>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                  role.workerCount
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateRole(
                                    crew.localId,
                                    role.localId,
                                    'workerCount',
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

                            {!isReadOnly && (
                              <button
                                type="button"
                                style={
                                  dangerButtonStyle
                                }
                                onClick={() =>
                                  removeRole(
                                    crew.localId,
                                    role.localId
                                  )
                                }
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <label
                    style={{
                      ...fieldStyle,
                      marginTop:
                        '16px',
                    }}
                  >
                    <span
                      style={
                        labelStyle
                      }
                    >
                      Crew notes
                    </span>

                    <textarea
                      rows={
                        3
                      }
                      value={
                        crew.notes
                      }
                      onChange={(
                        event
                      ) =>
                        updateCrew(
                          crew.localId,
                          'notes',
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Additional workforce observations..."
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
          )
        )}

        {crews.length >
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
                  : 'Save Workforce'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
