'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../../../lib/supabase/client'

const supabase = createClient()

function formatWorkerName(worker) {
  if (!worker) {
    return 'Unknown worker'
  }

  const composedName = [
    worker.first_name,
    worker.middle_name,
    worker.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    composedName ||
    worker.full_name ||
    worker.name ||
    'Unnamed worker'
  )
}

function formatProjectName(project) {
  if (!project) {
    return 'Unknown project'
  }

  if (project.code && project.name) {
    return `${project.code} · ${project.name}`
  }

  return (
    project.name ||
    project.code ||
    'Unnamed project'
  )
}

function formatTime(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(new Date(value))
}

function formatWorkedMinutes(minutes) {
  if (
    minutes === null ||
    minutes === undefined
  ) {
    return '—'
  }

  const total = Number(minutes)

  if (!Number.isFinite(total)) {
    return '—'
  }

  const hours = Math.floor(total / 60)
  const remainingMinutes =
    total % 60

  return `${hours}h ${String(
    remainingMinutes
  ).padStart(2, '0')}m`
}

function getTodayKey() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    now.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function AttendancePage() {
  const [projects, setProjects] =
    useState([])

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState('')

  const [assignments, setAssignments] =
    useState([])

  const [workers, setWorkers] =
    useState([])

  const [companies, setCompanies] =
    useState([])

  const [trades, setTrades] =
    useState([])

  const [roles, setRoles] =
    useState([])

  const [sessions, setSessions] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [
    processingAssignmentId,
    setProcessingAssignmentId,
  ] = useState(null)

  const [
    processingSessionId,
    setProcessingSessionId,
  ] = useState(null)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const todayKey = useMemo(
    () => getTodayKey(),
    []
  )

  const loadProjects =
    useCallback(async () => {
      const {
        data,
        error: projectsError,
      } = await supabase
        .from('projects')
        .select(
          'id, code, name, status'
        )
        .order('name')

      if (projectsError) {
        throw projectsError
      }

      const availableProjects =
        data || []

      setProjects(
        availableProjects
      )

      setSelectedProjectId(
        (currentProjectId) => {
          if (
            currentProjectId &&
            availableProjects.some(
              (project) =>
                project.id ===
                currentProjectId
            )
          ) {
            return currentProjectId
          }

          return (
            availableProjects[0]
              ?.id || ''
          )
        }
      )
    }, [])

  const loadReferenceData =
    useCallback(async () => {
      const [
        workersResult,
        companiesResult,
        tradesResult,
        rolesResult,
      ] = await Promise.all([
        supabase
          .from('field_workers')
          .select('*'),

        supabase
          .from('field_companies')
          .select('*'),

        supabase
          .from('field_trades')
          .select('*'),

        supabase
          .from('field_roles')
          .select('*'),
      ])

      if (workersResult.error) {
        throw workersResult.error
      }

      if (companiesResult.error) {
        throw companiesResult.error
      }

      if (tradesResult.error) {
        throw tradesResult.error
      }

      if (rolesResult.error) {
        throw rolesResult.error
      }

      setWorkers(
        workersResult.data || []
      )

      setCompanies(
        companiesResult.data || []
      )

      setTrades(
        tradesResult.data || []
      )

      setRoles(
        rolesResult.data || []
      )
    }, [])

  const loadAttendance =
    useCallback(
      async (
        projectId,
        {
          showRefreshing = false,
        } = {}
      ) => {
        if (!projectId) {
          setAssignments([])
          setSessions([])
          return
        }

        if (showRefreshing) {
          setRefreshing(true)
        }

        try {
          setError('')

          const [
            assignmentsResult,
            sessionsResult,
          ] = await Promise.all([
            supabase
              .from(
                'field_project_assignments'
              )
              .select('*')
              .eq(
                'project_id',
                projectId
              )
              .eq('status', 'active')
              .order('start_date'),

            supabase
              .from(
                'field_attendance_sessions'
              )
              .select('*')
              .eq(
                'project_id',
                projectId
              )
              .gte(
                'work_date',
                todayKey
              )
              .lte(
                'work_date',
                todayKey
              )
              .order(
                'check_in_at',
                {
                  ascending: false,
                }
              ),
          ])

          if (
            assignmentsResult.error
          ) {
            throw assignmentsResult.error
          }

          if (sessionsResult.error) {
            throw sessionsResult.error
          }

          setAssignments(
            assignmentsResult.data ||
              []
          )

          setSessions(
            sessionsResult.data ||
              []
          )
        } catch (loadError) {
          console.error(loadError)

          setError(
            loadError?.message ||
              'Unable to load attendance data.'
          )
        } finally {
          if (showRefreshing) {
            setRefreshing(false)
          }
        }
      },
      [todayKey]
    )

  useEffect(() => {
    async function initialize() {
      setLoading(true)

      try {
        setError('')

        await Promise.all([
          loadProjects(),
          loadReferenceData(),
        ])
      } catch (initializeError) {
        console.error(
          initializeError
        )

        setError(
          initializeError?.message ||
            'Unable to load Attendance.'
        )
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [
    loadProjects,
    loadReferenceData,
  ])

  useEffect(() => {
    if (!selectedProjectId) {
      return
    }

    loadAttendance(
      selectedProjectId
    )
  }, [
    selectedProjectId,
    loadAttendance,
  ])

  const workerById =
    useMemo(() => {
      return new Map(
        workers.map((worker) => [
          worker.id,
          worker,
        ])
      )
    }, [workers])

  const companyById =
    useMemo(() => {
      return new Map(
        companies.map(
          (company) => [
            company.id,
            company,
          ]
        )
      )
    }, [companies])

  const tradeById =
    useMemo(() => {
      return new Map(
        trades.map((trade) => [
          trade.id,
          trade,
        ])
      )
    }, [trades])

  const roleById =
    useMemo(() => {
      return new Map(
        roles.map((role) => [
          role.id,
          role,
        ])
      )
    }, [roles])

  const selectedProject =
    useMemo(() => {
      return (
        projects.find(
          (project) =>
            project.id ===
            selectedProjectId
        ) || null
      )
    }, [
      projects,
      selectedProjectId,
    ])

  const openSessionByWorkerId =
    useMemo(() => {
      const map = new Map()

      sessions.forEach(
        (session) => {
          if (
            session.status ===
              'open' &&
            !map.has(
              session.worker_id
            )
          ) {
            map.set(
              session.worker_id,
              session
            )
          }
        }
      )

      return map
    }, [sessions])

  const latestClosedSessionByWorkerId =
    useMemo(() => {
      const map = new Map()

      sessions.forEach(
        (session) => {
          if (
            session.status ===
              'closed' &&
            !map.has(
              session.worker_id
            )
          ) {
            map.set(
              session.worker_id,
              session
            )
          }
        }
      )

      return map
    }, [sessions])

  const onSiteCount =
    useMemo(() => {
      return sessions.filter(
        (session) =>
          session.status === 'open'
      ).length
    }, [sessions])

  const checkedOutCount =
    useMemo(() => {
      return sessions.filter(
        (session) =>
          session.status ===
          'closed'
      ).length
    }, [sessions])

  async function handleCheckIn(
    assignment
  ) {
    if (!assignment?.id) {
      return
    }

    setProcessingAssignmentId(
      assignment.id
    )

    setError('')
    setSuccess('')

    try {
      const {
        data,
        error: checkInError,
      } = await supabase.rpc(
        'field_worker_check_in',
        {
          p_assignment_id:
            assignment.id,

          p_method:
            'supervisor',

          p_geofence_status:
            'not_evaluated',
        }
      )

      if (checkInError) {
        throw checkInError
      }

      const worker =
        workerById.get(
          assignment.worker_id
        )

      setSuccess(
        `${formatWorkerName(
          worker
        )} checked in successfully.`
      )

      await loadAttendance(
        selectedProjectId
      )

      return data
    } catch (checkInError) {
      console.error(
        checkInError
      )

      setError(
        checkInError?.message ||
          'Unable to check worker in.'
      )
    } finally {
      setProcessingAssignmentId(
        null
      )
    }
  }

  async function handleCheckOut(
    session
  ) {
    if (!session?.id) {
      return
    }

    setProcessingSessionId(
      session.id
    )

    setError('')
    setSuccess('')

    try {
      const {
        data,
        error: checkOutError,
      } = await supabase.rpc(
        'field_worker_check_out',
        {
          p_session_id:
            session.id,

          p_method:
            'supervisor',

          p_geofence_status:
            'not_evaluated',
        }
      )

      if (checkOutError) {
        throw checkOutError
      }

      const worker =
        workerById.get(
          session.worker_id
        )

      setSuccess(
        `${formatWorkerName(
          worker
        )} checked out successfully.`
      )

      await loadAttendance(
        selectedProjectId
      )

      return data
    } catch (checkOutError) {
      console.error(
        checkOutError
      )

      setError(
        checkOutError?.message ||
          'Unable to check worker out.'
      )
    } finally {
      setProcessingSessionId(
        null
      )
    }
  }

  const boardRows =
    useMemo(() => {
      return assignments
        .map((assignment) => {
          const worker =
            workerById.get(
              assignment.worker_id
            )

          const company =
            companyById.get(
              assignment.company_id
            )

          const trade =
            tradeById.get(
              assignment.trade_id
            )

          const role =
            roleById.get(
              assignment.role_id
            )

          const openSession =
            openSessionByWorkerId.get(
              assignment.worker_id
            )

          const latestClosedSession =
            latestClosedSessionByWorkerId.get(
              assignment.worker_id
            )

          return {
            assignment,
            worker,
            company,
            trade,
            role,
            openSession,
            latestClosedSession,
          }
        })
        .sort((a, b) =>
          formatWorkerName(
            a.worker
          ).localeCompare(
            formatWorkerName(
              b.worker
            )
          )
        )
    }, [
      assignments,
      workerById,
      companyById,
      tradeById,
      roleById,
      openSessionByWorkerId,
      latestClosedSessionByWorkerId,
    ])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      <section>
        <p
          style={{
            margin: '0 0 6px',
            color: '#64748b',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
          }}
        >
          Field Management
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent:
              'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: '#061b2f',
                fontSize: '2rem',
                lineHeight: 1.1,
              }}
            >
              Attendance
            </h2>

            <p
              style={{
                margin:
                  '8px 0 0',
                maxWidth: '760px',
                color: '#64748b',
                lineHeight: 1.55,
              }}
            >
              Manage supervisor
              check-in and check-out
              for workers assigned to
              active projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadAttendance(
                selectedProjectId,
                {
                  showRefreshing:
                    true,
                }
              )
            }
            disabled={
              !selectedProjectId ||
              refreshing
            }
            style={{
              minHeight: '40px',
              padding: '0 15px',
              border:
                '1px solid #cbd5e1',
              borderRadius: '9px',
              color: '#082a4a',
              background: '#ffffff',
              cursor:
                refreshing
                  ? 'wait'
                  : 'pointer',
              fontWeight: 750,
            }}
          >
            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
          padding: '18px',
          border:
            '1px solid #e2e8f0',
          borderRadius: '14px',
          background: '#ffffff',
        }}
      >
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 360px',
            gap: '7px',
          }}
        >
          <span
            style={{
              color: '#334155',
              fontSize: '0.76rem',
              fontWeight: 800,
            }}
          >
            Project
          </span>

          <select
            value={
              selectedProjectId
            }
            onChange={(event) =>
              setSelectedProjectId(
                event.target.value
              )
            }
            style={{
              minHeight: '44px',
              width: '100%',
              padding: '0 12px',
              border:
                '1px solid #cbd5e1',
              borderRadius: '9px',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.9rem',
            }}
          >
            {projects.length ===
              0 && (
              <option value="">
                No projects available
              </option>
            )}

            {projects.map(
              (project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {formatProjectName(
                    project
                  )}
                </option>
              )
            )}
          </select>
        </label>

        <div
          style={{
            minWidth: '180px',
          }}
        >
          <div
            style={{
              marginBottom: '7px',
              color: '#334155',
              fontSize: '0.76rem',
              fontWeight: 800,
            }}
          >
            Attendance Date
          </div>

          <div
            style={{
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '9px',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 700,
            }}
          >
            {new Intl.DateTimeFormat(
              undefined,
              {
                dateStyle:
                  'medium',
              }
            ).format(new Date())}
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding:
              '12px 14px',
            border:
              '1px solid #fecaca',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: '0.84rem',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding:
              '12px 14px',
            border:
              '1px solid #99f6e4',
            borderRadius: '10px',
            background: '#f0fdfa',
            color: '#115e59',
            fontSize: '0.84rem',
          }}
        >
          {success}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
        }}
      >
        <MetricCard
          label="Assigned Workers"
          value={assignments.length}
        />

        <MetricCard
          label="On Site"
          value={onSiteCount}
        />

        <MetricCard
          label="Checked Out Today"
          value={checkedOutCount}
        />

        <MetricCard
          label="Project"
          value={
            selectedProject?.code ||
            '—'
          }
        />
      </section>

      <section
        style={{
          overflow: 'hidden',
          border:
            '1px solid #e2e8f0',
          borderRadius: '14px',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            padding:
              '16px 18px',
            borderBottom:
              '1px solid #e2e8f0',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#0f172a',
              fontSize: '1rem',
            }}
          >
            Supervisor Attendance
          </h3>
        </div>

        {loading ? (
          <div
            style={{
              padding: '36px',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            Loading Attendance...
          </div>
        ) : boardRows.length ===
          0 ? (
          <div
            style={{
              padding: '36px',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            No active workers are
            assigned to this project.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: '1050px',
                borderCollapse:
                  'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      '#f8fafc',
                  }}
                >
                  <TableHeader>
                    Field ID
                  </TableHeader>

                  <TableHeader>
                    Worker
                  </TableHeader>

                  <TableHeader>
                    Company
                  </TableHeader>

                  <TableHeader>
                    Trade
                  </TableHeader>

                  <TableHeader>
                    Role
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Check-In
                  </TableHeader>

                  <TableHeader>
                    Worked
                  </TableHeader>

                  <TableHeader
                    align="right"
                  >
                    Action
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {boardRows.map(
                  ({
                    assignment,
                    worker,
                    company,
                    trade,
                    role,
                    openSession,
                    latestClosedSession,
                  }) => {
                    const isOnSite =
                      Boolean(
                        openSession
                      )

                    const currentSession =
                      openSession ||
                      latestClosedSession

                    return (
                      <tr
                        key={
                          assignment.id
                        }
                        style={{
                          borderTop:
                            '1px solid #e2e8f0',
                        }}
                      >
                        <TableCell>
                          <span
                            style={{
                              fontFamily:
                                'monospace',
                              fontWeight:
                                700,
                            }}
                          >
                            {worker?.field_id ||
                              worker?.employee_number ||
                              '—'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <strong
                            style={{
                              color:
                                '#0f172a',
                            }}
                          >
                            {formatWorkerName(
                              worker
                            )}
                          </strong>
                        </TableCell>

                        <TableCell>
                          {company?.name ||
                            company?.company_name ||
                            '—'}
                        </TableCell>

                        <TableCell>
                          {trade?.name ||
                            trade?.trade_name ||
                            '—'}
                        </TableCell>

                        <TableCell>
                          {role?.name ||
                            role?.role_name ||
                            '—'}
                        </TableCell>

                        <TableCell>
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              gap: '6px',
                              padding:
                                '5px 9px',
                              borderRadius:
                                '999px',
                              color:
                                isOnSite
                                  ? '#047857'
                                  : '#475569',
                              background:
                                isOnSite
                                  ? '#d1fae5'
                                  : '#f1f5f9',
                              fontSize:
                                '0.72rem',
                              fontWeight:
                                800,
                            }}
                          >
                            <span
                              style={{
                                width:
                                  '7px',
                                height:
                                  '7px',
                                borderRadius:
                                  '50%',
                                background:
                                  isOnSite
                                    ? '#10b981'
                                    : '#94a3b8',
                              }}
                            />

                            {isOnSite
                              ? 'On Site'
                              : latestClosedSession
                                ? 'Checked Out'
                                : 'Not On Site'}
                          </span>
                        </TableCell>

                        <TableCell>
                          {formatTime(
                            currentSession?.check_in_at
                          )}
                        </TableCell>

                        <TableCell>
                          {isOnSite
                            ? 'In progress'
                            : formatWorkedMinutes(
                                latestClosedSession?.worked_minutes
                              )}
                        </TableCell>

                        <TableCell
                          align="right"
                        >
                          {isOnSite ? (
                            <button
                              type="button"
                              disabled={
                                processingSessionId ===
                                openSession.id
                              }
                              onClick={() =>
                                handleCheckOut(
                                  openSession
                                )
                              }
                              style={{
                                minHeight:
                                  '38px',
                                padding:
                                  '0 14px',
                                border:
                                  '1px solid #cbd5e1',
                                borderRadius:
                                  '9px',
                                background:
                                  '#ffffff',
                                color:
                                  '#082a4a',
                                cursor:
                                  processingSessionId ===
                                  openSession.id
                                    ? 'wait'
                                    : 'pointer',
                                fontWeight:
                                  800,
                              }}
                            >
                              {processingSessionId ===
                              openSession.id
                                ? 'Checking Out...'
                                : 'Check Out'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                processingAssignmentId ===
                                assignment.id
                              }
                              onClick={() =>
                                handleCheckIn(
                                  assignment
                                )
                              }
                              style={{
                                minHeight:
                                  '38px',
                                padding:
                                  '0 14px',
                                border:
                                  '1px solid #078c7c',
                                borderRadius:
                                  '9px',
                                background:
                                  '#08aa96',
                                color:
                                  '#ffffff',
                                cursor:
                                  processingAssignmentId ===
                                  assignment.id
                                    ? 'wait'
                                    : 'pointer',
                                fontWeight:
                                  800,
                              }}
                            >
                              {processingAssignmentId ===
                              assignment.id
                                ? 'Checking In...'
                                : 'Check In'}
                            </button>
                          )}
                        </TableCell>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: '17px 18px',
        border:
          '1px solid #e2e8f0',
        borderRadius: '13px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform:
            'uppercase',
          letterSpacing:
            '0.05em',
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: '7px',
          color: '#061b2f',
          fontSize: '1.55rem',
          fontWeight: 850,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function TableHeader({
  children,
  align = 'left',
}) {
  return (
    <th
      style={{
        padding:
          '11px 14px',
        color: '#64748b',
        fontSize: '0.68rem',
        fontWeight: 800,
        letterSpacing:
          '0.04em',
        textAlign: align,
        textTransform:
          'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function TableCell({
  children,
  align = 'left',
}) {
  return (
    <td
      style={{
        padding:
          '13px 14px',
        color: '#475569',
        fontSize: '0.82rem',
        textAlign: align,
        verticalAlign:
          'middle',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}
