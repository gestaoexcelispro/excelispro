'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { createClient } from '../../../../../../lib/supabase/client'

const supabase = createClient()

const LONG_OPEN_SESSION_MINUTES = 720

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatWorkerName(worker) {
  if (!worker) {
    return 'Unknown worker'
  }

  return [
    worker.first_name,
    worker.middle_name,
    worker.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unnamed worker'
}

function formatProjectName(project) {
  if (!project) {
    return 'Unknown project'
  }

  if (
    project.code &&
    project.name
  ) {
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
  ).format(
    new Date(value)
  )
}

function formatMinutes(minutes) {
  const numeric =
    Number(minutes)

  if (
    !Number.isFinite(numeric)
  ) {
    return '—'
  }

  const total =
    Math.max(
      0,
      Math.floor(numeric)
    )

  const hours =
    Math.floor(total / 60)

  const remainingMinutes =
    total % 60

  return `${hours}h ${String(
    remainingMinutes
  ).padStart(2, '0')}m`
}

function calculateOpenMinutes(
  session,
  currentTime
) {
  if (
    !session?.check_in_at
  ) {
    return 0
  }

  const start =
    new Date(
      session.check_in_at
    ).getTime()

  if (
    !Number.isFinite(start)
  ) {
    return 0
  }

  const difference =
    currentTime - start

  if (difference <= 0) {
    return 0
  }

  return Math.floor(
    difference / 60000
  )
}

function buildException({
  type,
  severity,
  worker,
  session,
  title,
  description,
  value,
}) {
  return {
    id: `${type}-${session.id}`,
    type,
    severity,
    worker,
    session,
    title,
    description,
    value,
  }
}

export default function AttendanceExceptionsPage() {
  const [projects, setProjects] =
    useState([])

  const [workers, setWorkers] =
    useState([])

  const [sessions, setSessions] =
    useState([])

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState('')

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDateKey()
  )

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [currentTime, setCurrentTime] =
    useState(() => Date.now())

  const [error, setError] =
    useState('')

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setCurrentTime(Date.now())
      }, 30000)

    return () => {
      window.clearInterval(
        intervalId
      )
    }
  }, [])

  const loadProjects =
    useCallback(async () => {
      const {
        data,
        error: projectsError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          code,
          name,
          standard_daily_minutes
        `)
        .order('name')

      if (projectsError) {
        throw projectsError
      }

      const loadedProjects =
        data || []

      setProjects(
        loadedProjects
      )

      setSelectedProjectId(
        (currentProjectId) => {
          if (
            currentProjectId &&
            loadedProjects.some(
              (project) =>
                project.id ===
                currentProjectId
            )
          ) {
            return currentProjectId
          }

          return (
            loadedProjects[0]
              ?.id || ''
          )
        }
      )
    }, [])

  const loadWorkers =
    useCallback(async () => {
      const {
        data,
        error: workersError,
      } = await supabase
        .from('field_workers')
        .select(`
          id,
          field_id,
          first_name,
          middle_name,
          last_name,
          status
        `)
        .order(
          'field_id',
          {
            ascending: true,
          }
        )

      if (workersError) {
        throw workersError
      }

      setWorkers(
        data || []
      )
    }, [])

  const loadExceptionsData =
    useCallback(
      async (
        projectId,
        workDate,
        {
          showRefreshing = false,
        } = {}
      ) => {
        if (
          !projectId ||
          !workDate
        ) {
          setSessions([])
          return
        }

        if (showRefreshing) {
          setRefreshing(true)
        }

        try {
          setError('')

          const {
            data,
            error: sessionsError,
          } = await supabase
            .from(
              'field_attendance_sessions'
            )
            .select(`
              id,
              organization_id,
              assignment_id,
              worker_id,
              project_id,
              work_date,
              check_in_at,
              check_out_at,
              status,
              worked_minutes,
              regular_minutes,
              overtime_minutes,
              has_exception,
              exception_code,
              exception_notes,
              created_at,
              updated_at
            `)
            .eq(
              'project_id',
              projectId
            )
            .eq(
              'work_date',
              workDate
            )
            .order(
              'check_in_at',
              {
                ascending: true,
              }
            )

          if (sessionsError) {
            throw sessionsError
          }

          setSessions(
            data || []
          )

          setCurrentTime(
            Date.now()
          )
        } catch (
          loadError
        ) {
          console.error(
            loadError
          )

          setError(
            loadError?.message ||
              'Unable to load Attendance Exceptions.'
          )
        } finally {
          if (showRefreshing) {
            setRefreshing(false)
          }
        }
      },
      []
    )

  useEffect(() => {
    async function initialize() {
      setLoading(true)

      try {
        setError('')

        await Promise.all([
          loadProjects(),
          loadWorkers(),
        ])
      } catch (
        initializeError
      ) {
        console.error(
          initializeError
        )

        setError(
          initializeError?.message ||
            'Unable to initialize Attendance Exceptions.'
        )
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [
    loadProjects,
    loadWorkers,
  ])

  useEffect(() => {
    if (
      !selectedProjectId ||
      !selectedDate
    ) {
      return
    }

    loadExceptionsData(
      selectedProjectId,
      selectedDate
    )
  }, [
    selectedProjectId,
    selectedDate,
    loadExceptionsData,
  ])

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

  const workerById =
    useMemo(() => {
      return new Map(
        workers.map(
          (worker) => [
            worker.id,
            worker,
          ]
        )
      )
    }, [workers])

  const sessionsByWorkerId =
    useMemo(() => {
      const grouped =
        new Map()

      sessions.forEach(
        (session) => {
          const existing =
            grouped.get(
              session.worker_id
            ) || []

          existing.push(
            session
          )

          grouped.set(
            session.worker_id,
            existing
          )
        }
      )

      return grouped
    }, [sessions])

  const exceptions =
    useMemo(() => {
      const items = []

      const allowedMinutes =
        selectedProject
          ?.standard_daily_minutes ===
          null ||
        selectedProject
          ?.standard_daily_minutes ===
          undefined
          ? null
          : Number(
              selectedProject
                .standard_daily_minutes
            )

      sessionsByWorkerId.forEach(
        (
          workerSessions,
          workerId
        ) => {
          const worker =
            workerById.get(
              workerId
            )

          const closedSessions =
            workerSessions.filter(
              (session) =>
                session.status ===
                'closed'
            )

          const openSessions =
            workerSessions.filter(
              (session) =>
                session.status ===
                'open'
            )

          const closedMinutes =
            closedSessions.reduce(
              (
                total,
                session
              ) => {
                const minutes =
                  Number(
                    session.worked_minutes ||
                      0
                  )

                return (
                  total +
                  (
                    Number.isFinite(
                      minutes
                    )
                      ? minutes
                      : 0
                  )
                )
              },
              0
            )

          const openMinutes =
            openSessions.reduce(
              (
                total,
                session
              ) =>
                total +
                calculateOpenMinutes(
                  session,
                  currentTime
                ),
              0
            )

          const totalWorkedMinutes =
            closedMinutes +
            openMinutes

          if (
            allowedMinutes !==
              null &&
            totalWorkedMinutes >
              allowedMinutes
          ) {
            const referenceSession =
              workerSessions[
                workerSessions.length -
                  1
              ]

            items.push(
              buildException({
                type:
                  'over_allowed_hours',

                severity:
                  'critical',

                worker,

                session:
                  referenceSession,

                title:
                  'Over Allowed Hours',

                description:
                  'Worker has exceeded the standard daily working allowance.',

                value: `+${formatMinutes(
                  totalWorkedMinutes -
                    allowedMinutes
                )}`,
              })
            )
          }

          openSessions.forEach(
            (session) => {
              const minutesOpen =
                calculateOpenMinutes(
                  session,
                  currentTime
                )

              items.push(
                buildException({
                  type:
                    'open_session',

                  severity:
                    minutesOpen >=
                    LONG_OPEN_SESSION_MINUTES
                      ? 'critical'
                      : 'warning',

                  worker,

                  session,

                  title:
                    minutesOpen >=
                    LONG_OPEN_SESSION_MINUTES
                      ? 'Long Open Session'
                      : 'Open Session',

                  description:
                    minutesOpen >=
                    LONG_OPEN_SESSION_MINUTES
                      ? 'Worker has remained checked in for an unusually long period.'
                      : 'Worker currently has an open attendance session.',

                  value:
                    formatMinutes(
                      minutesOpen
                    ),
                })
              )
            }
          )

          workerSessions
            .filter(
              (session) =>
                session.has_exception
            )
            .forEach(
              (session) => {
                items.push(
                  buildException({
                    type:
                      'recorded_exception',

                    severity:
                      'warning',

                    worker,

                    session,

                    title:
                      session.exception_code ||
                      'Recorded Exception',

                    description:
                      session.exception_notes ||
                      'This attendance session has been marked with an exception.',

                    value:
                      'Review',
                  })
                )
              }
            )
        }
      )

      return items.sort(
        (a, b) => {
          const severityRank = {
            critical: 0,
            warning: 1,
            info: 2,
          }

          const severityDifference =
            (
              severityRank[
                a.severity
              ] ?? 99
            ) -
            (
              severityRank[
                b.severity
              ] ?? 99
            )

          if (
            severityDifference !==
            0
          ) {
            return severityDifference
          }

          return formatWorkerName(
            a.worker
          ).localeCompare(
            formatWorkerName(
              b.worker
            )
          )
        }
      )
    }, [
      sessionsByWorkerId,
      workerById,
      selectedProject,
      currentTime,
    ])

  const criticalCount =
    useMemo(() => {
      return exceptions.filter(
        (exception) =>
          exception.severity ===
          'critical'
      ).length
    }, [exceptions])

  const warningCount =
    useMemo(() => {
      return exceptions.filter(
        (exception) =>
          exception.severity ===
          'warning'
      ).length
    }, [exceptions])

  const openSessionCount =
    useMemo(() => {
      return exceptions.filter(
        (exception) =>
          exception.type ===
            'open_session'
      ).length
    }, [exceptions])

  const overAllowedCount =
    useMemo(() => {
      return exceptions.filter(
        (exception) =>
          exception.type ===
            'over_allowed_hours'
      ).length
    }, [exceptions])

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
            letterSpacing:
              '0.09em',
            textTransform:
              'uppercase',
          }}
        >
          Field Management
        </p>

        <div
          style={{
            display: 'flex',
            alignItems:
              'flex-start',
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
              Attendance Exceptions
            </h2>

            <p
              style={{
                margin: '8px 0 0',
                maxWidth: '840px',
                color: '#64748b',
                lineHeight: 1.55,
              }}
            >
              Monitor workers
              requiring attention
              because of open
              sessions, excessive
              hours, or recorded
              attendance exceptions.
            </p>
          </div>

          <button
            type="button"
            disabled={
              refreshing ||
              !selectedProjectId ||
              !selectedDate
            }
            onClick={() =>
              loadExceptionsData(
                selectedProjectId,
                selectedDate,
                {
                  showRefreshing:
                    true,
                }
              )
            }
            style={{
              minHeight: '40px',
              padding: '0 15px',
              border:
                '1px solid #cbd5e1',
              borderRadius: '9px',
              background: '#ffffff',
              color: '#082a4a',
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
          display: 'grid',
          gridTemplateColumns:
            'minmax(280px, 1fr) minmax(180px, 240px) minmax(180px, 240px)',
          gap: '14px',
          padding: '18px',
          border:
            '1px solid #e2e8f0',
          borderRadius: '14px',
          background: '#ffffff',
        }}
      >
        <FormField
          label="Project"
        >
          <select
            value={
              selectedProjectId
            }
            onChange={(event) =>
              setSelectedProjectId(
                event.target.value
              )
            }
            style={inputStyle}
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
        </FormField>

        <FormField
          label="Work Date"
        >
          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(
                event.target.value
              )
            }
            style={inputStyle}
          />
        </FormField>

        <InfoField
          label="Daily Allowance"
          value={
            selectedProject
              ?.standard_daily_minutes ===
              null ||
            selectedProject
              ?.standard_daily_minutes ===
              undefined
              ? 'Not configured'
              : formatMinutes(
                  selectedProject
                    .standard_daily_minutes
                )
          }
        />
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
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

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
        }}
      >
        <MetricCard
          label="Critical"
          value={criticalCount}
          tone={
            criticalCount > 0
              ? 'danger'
              : 'default'
          }
        />

        <MetricCard
          label="Warnings"
          value={warningCount}
          tone={
            warningCount > 0
              ? 'warning'
              : 'default'
          }
        />

        <MetricCard
          label="Open Sessions"
          value={openSessionCount}
        />

        <MetricCard
          label="Over Allowed"
          value={overAllowedCount}
          tone={
            overAllowedCount > 0
              ? 'danger'
              : 'default'
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
            padding: '16px 18px',
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
            Exception Queue
          </h3>
        </div>

        {loading ? (
          <MessageArea>
            Loading Attendance
            Exceptions...
          </MessageArea>
        ) : exceptions.length ===
          0 ? (
          <MessageArea>
            No attendance
            exceptions were
            detected for this
            project and date.
          </MessageArea>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: '1250px',
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
                    Severity
                  </TableHeader>

                  <TableHeader>
                    Field ID
                  </TableHeader>

                  <TableHeader>
                    Worker
                  </TableHeader>

                  <TableHeader>
                    Exception
                  </TableHeader>

                  <TableHeader>
                    Check-In
                  </TableHeader>

                  <TableHeader>
                    Check-Out
                  </TableHeader>

                  <TableHeader>
                    Value
                  </TableHeader>

                  <TableHeader>
                    Description
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {exceptions.map(
                  (exception) => (
                    <tr
                      key={
                        exception.id
                      }
                      style={{
                        borderTop:
                          '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell>
                        <SeverityBadge
                          severity={
                            exception.severity
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <span
                          style={{
                            fontFamily:
                              'monospace',
                            fontWeight:
                              700,
                          }}
                        >
                          {exception
                            .worker
                            ?.field_id ||
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
                            exception.worker
                          )}
                        </strong>
                      </TableCell>

                      <TableCell>
                        <strong
                          style={{
                            color:
                              '#334155',
                          }}
                        >
                          {
                            exception.title
                          }
                        </strong>
                      </TableCell>

                      <TableCell>
                        {formatTime(
                          exception
                            .session
                            .check_in_at
                        )}
                      </TableCell>

                      <TableCell>
                        {exception
                          .session
                          .check_out_at
                          ? formatTime(
                              exception
                                .session
                                .check_out_at
                            )
                          : 'Open'}
                      </TableCell>

                      <TableCell>
                        <strong>
                          {
                            exception.value
                          }
                        </strong>
                      </TableCell>

                      <TableCell>
                        <span
                          style={{
                            display:
                              'block',
                            maxWidth:
                              '320px',
                            whiteSpace:
                              'normal',
                            lineHeight:
                              1.45,
                          }}
                        >
                          {
                            exception.description
                          }
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          style={{
                            display:
                              'inline-flex',
                            padding:
                              '5px 8px',
                            border:
                              '1px solid #e2e8f0',
                            borderRadius:
                              '999px',
                            background:
                              '#f8fafc',
                            color:
                              '#475569',
                            fontSize:
                              '0.7rem',
                            fontWeight:
                              800,
                            textTransform:
                              'capitalize',
                          }}
                        >
                          {
                            exception
                              .session
                              .status
                          }
                        </span>
                      </TableCell>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div
        style={{
          padding: '14px 16px',
          border:
            '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#f8fafc',
          color: '#64748b',
          fontSize: '0.76rem',
          lineHeight: 1.55,
        }}
      >
        Current V1 rules:
        open sessions are
        monitored immediately,
        sessions open for 12
        hours or more are treated
        as critical, and workers
        exceeding the project's
        standard daily allowance
        are flagged automatically.
      </div>
    </div>
  )
}

function SeverityBadge({
  severity,
}) {
  const visualMap = {
    critical: {
      color: '#b91c1c',
      background: '#fef2f2',
      border: '#fecaca',
      label: 'Critical',
    },

    warning: {
      color: '#92400e',
      background: '#fffbeb',
      border: '#fde68a',
      label: 'Warning',
    },

    info: {
      color: '#1d4ed8',
      background: '#eff6ff',
      border: '#bfdbfe',
      label: 'Info',
    },
  }

  const visual =
    visualMap[severity] ||
    visualMap.info

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '5px 8px',
        border: `1px solid ${visual.border}`,
        borderRadius: '999px',
        background:
          visual.background,
        color: visual.color,
        fontSize: '0.7rem',
        fontWeight: 800,
      }}
    >
      {visual.label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  tone = 'default',
}) {
  const tones = {
    default: {
      border: '#e2e8f0',
      background: '#ffffff',
      value: '#061b2f',
    },

    warning: {
      border: '#fde68a',
      background: '#fffbeb',
      value: '#92400e',
    },

    danger: {
      border: '#fecaca',
      background: '#fef2f2',
      value: '#b91c1c',
    },
  }

  const visual =
    tones[tone] ||
    tones.default

  return (
    <div
      style={{
        padding: '17px 18px',
        border: `1px solid ${visual.border}`,
        borderRadius: '13px',
        background:
          visual.background,
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
          color: visual.value,
          fontSize: '1.55rem',
          fontWeight: 850,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: '#334155',
          fontSize: '0.76rem',
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  )
}

function InfoField({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
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
        {label}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '44px',
          padding: '0 12px',
          border:
            '1px solid #e2e8f0',
          borderRadius: '9px',
          background: '#f8fafc',
          color: '#334155',
          fontSize: '0.9rem',
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function TableHeader({
  children,
}) {
  return (
    <th
      style={{
        padding: '11px 14px',
        color: '#64748b',
        fontSize: '0.68rem',
        fontWeight: 800,
        letterSpacing:
          '0.04em',
        textAlign: 'left',
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
}) {
  return (
    <td
      style={{
        padding: '13px 14px',
        color: '#475569',
        fontSize: '0.82rem',
        verticalAlign:
          'middle',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}

function MessageArea({
  children,
}) {
  return (
    <div
      style={{
        padding: '38px 20px',
        color: '#64748b',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  minHeight: '44px',
  boxSizing: 'border-box',
  padding: '0 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '9px',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: '0.9rem',
}
