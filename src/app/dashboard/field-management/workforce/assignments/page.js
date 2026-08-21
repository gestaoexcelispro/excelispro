'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../../../../../lib/supabase'

export default function WorkforceAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const { data, error } = await supabase
        .from('field_project_assignments')
        .select(`
          id,
          start_date,
          end_date,
          status,

          field_workers:worker_id (
            id,
            field_id,
            first_name,
            middle_name,
            last_name
          ),

          projects:project_id (
            id,
            code,
            name
          ),

          field_companies:company_id (
            id,
            name
          ),

          field_trades:trade_id (
            id,
            name
          ),

          field_roles:role_id (
            id,
            name
          ),

          field_crews:crew_id (
            id,
            name
          )
        `)
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        throw error
      }

      setAssignments(data || [])
    } catch (error) {
      console.error(
        'Error loading Field Project Assignments:',
        error
      )

      setAssignments([])

      setErrorMessage(
        error?.message ||
          'Unable to load project assignments.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status === 'active'
      ).length,
    [assignments]
  )

  const scheduledAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status === 'scheduled'
      ).length,
    [assignments]
  )

  const endedAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status === 'ended'
      ).length,
    [assignments]
  )

  function getWorkerName(worker) {
    if (!worker) {
      return '—'
    }

    return [
      worker.first_name,
      worker.middle_name,
      worker.last_name,
    ]
      .filter(Boolean)
      .join(' ')
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return '—'
    }

    const [year, month, day] =
      dateValue.split('-')

    return `${month}/${day}/${year}`
  }

  function formatStatus(status) {
    if (!status) {
      return '—'
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 8px',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Field Management
          </p>

          <h2
            style={{
              margin: '0 0 8px',
              color: '#0f172a',
              fontSize: '28px',
              lineHeight: 1.2,
            }}
          >
            Project Assignments
          </h2>

          <p
            style={{
              margin: 0,
              color: '#64748b',
              maxWidth: '760px',
              lineHeight: 1.6,
            }}
          >
            Manage how workers are allocated to
            projects while preserving company,
            trade, role and crew context.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Assignment creation will be enabled in the next step."
          style={{
            border: 'none',
            borderRadius: '8px',
            padding: '11px 18px',
            background: '#cbd5e1',
            color: '#64748b',
            fontWeight: 700,
            cursor: 'not-allowed',
          }}
        >
          + New Assignment
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          label="Total Assignments"
          value={assignments.length}
        />

        <MetricCard
          label="Active"
          value={activeAssignments}
        />

        <MetricCard
          label="Scheduled"
          value={scheduledAssignments}
        />

        <MetricCard
          label="Ended"
          value={endedAssignments}
        />
      </section>

      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#0f172a',
              fontSize: '17px',
            }}
          >
            Assignments
          </h3>
        </div>

        {loading ? (
          <MessageArea>
            Loading project assignments...
          </MessageArea>
        ) : errorMessage ? (
          <MessageArea color="#b91c1c">
            {errorMessage}
          </MessageArea>
        ) : assignments.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#334155',
              }}
            >
              No project assignments found
            </strong>

            <span
              style={{
                color: '#64748b',
              }}
            >
              Worker assignments will appear here
              when they are linked to projects.
            </span>
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
                borderCollapse: 'collapse',
                minWidth: '1180px',
              }}
            >
              <thead
                style={{
                  background: '#f8fafc',
                }}
              >
                <tr>
                  <TableHeader>
                    Field ID
                  </TableHeader>

                  <TableHeader>
                    Worker
                  </TableHeader>

                  <TableHeader>
                    Project
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
                    Crew
                  </TableHeader>

                  <TableHeader>
                    Start Date
                  </TableHeader>

                  <TableHeader>
                    End Date
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {assignments.map(
                  (assignment) => (
                    <tr
                      key={assignment.id}
                      style={{
                        borderTop:
                          '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell>
                        <span
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          {assignment
                            .field_workers
                            ?.field_id || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <strong
                          style={{
                            color: '#0f172a',
                          }}
                        >
                          {getWorkerName(
                            assignment.field_workers
                          )}
                        </strong>
                      </TableCell>

                      <TableCell>
                        {assignment.projects ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                            }}
                          >
                            <strong
                              style={{
                                color: '#0f172a',
                              }}
                            >
                              {
                                assignment.projects
                                  .code
                              }
                            </strong>

                            <span
                              style={{
                                color: '#64748b',
                                fontSize: '12px',
                              }}
                            >
                              {
                                assignment.projects
                                  .name
                              }
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell>
                        {assignment
                          .field_companies
                          ?.name || '—'}
                      </TableCell>

                      <TableCell>
                        {assignment
                          .field_trades
                          ?.name || '—'}
                      </TableCell>

                      <TableCell>
                        {assignment
                          .field_roles
                          ?.name || '—'}
                      </TableCell>

                      <TableCell>
                        {assignment
                          .field_crews
                          ?.name || '—'}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          assignment.start_date
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          assignment.end_date
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={
                            assignment.status
                          }
                          label={formatStatus(
                            assignment.status
                          )}
                        />
                      </TableCell>
                    </tr>
                  )
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
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 20px',
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        {label}
      </p>

      <strong
        style={{
          color: '#0f172a',
          fontSize: '28px',
          lineHeight: 1,
        }}
      >
        {value}
      </strong>
    </div>
  )
}

function TableHeader({
  children,
}) {
  return (
    <th
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
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
        padding: '15px 16px',
        color: '#475569',
        fontSize: '14px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}

function StatusBadge({
  status,
  label,
}) {
  const stylesByStatus = {
    active: {
      background: '#dcfce7',
      color: '#166534',
    },
    scheduled: {
      background: '#dbeafe',
      color: '#1d4ed8',
    },
    ended: {
      background: '#f1f5f9',
      color: '#475569',
    },
    cancelled: {
      background: '#fee2e2',
      color: '#b91c1c',
    },
  }

  const appearance =
    stylesByStatus[status] ||
    stylesByStatus.ended

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '5px 9px',
        background:
          appearance.background,
        color: appearance.color,
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  )
}

function MessageArea({
  children,
  color = '#64748b',
}) {
  return (
    <div
      style={{
        padding: '32px 20px',
        color,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}
