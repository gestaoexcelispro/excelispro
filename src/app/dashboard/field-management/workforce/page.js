'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function WorkforcePage() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadWorkers = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('field_workers')
      .select(`
        id,
        field_id,
        first_name,
        middle_name,
        last_name,
        status,
        field_companies:default_company_id (
          id,
          name
        ),
        field_trades:default_trade_id (
          id,
          name
        ),
        field_roles:default_role_id (
          id,
          name
        )
      `)
      .order('field_id', { ascending: true })

    if (error) {
      console.error(
        'Error loading Field Management workers:',
        error
      )

      setWorkers([])
      setErrorMessage(
        'Unable to load the workforce registry.'
      )
      setLoading(false)
      return
    }

    setWorkers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadWorkers()
  }, [loadWorkers])

  function getWorkerName(worker) {
    return [
      worker.first_name,
      worker.middle_name,
      worker.last_name,
    ]
      .filter(Boolean)
      .join(' ')
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

  const totalWorkers = workers.length

  const activeWorkers = workers.filter(
    (worker) => worker.status === 'active'
  ).length

  const inactiveWorkers =
    totalWorkers - activeWorkers

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
            Workforce Registry
          </h2>

          <p
            style={{
              margin: 0,
              color: '#64748b',
              maxWidth: '720px',
              lineHeight: 1.6,
            }}
          >
            Manage the workers available for field
            assignments, attendance and future
            workforce reporting.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Worker registration will be enabled in the next step."
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
          + Add Worker
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
          label="Total Workers"
          value={totalWorkers}
        />

        <MetricCard
          label="Active"
          value={activeWorkers}
        />

        <MetricCard
          label="Inactive"
          value={inactiveWorkers}
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
            Workers
          </h3>
        </div>

        {loading ? (
          <div
            style={{
              padding: '32px 20px',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            Loading workforce...
          </div>
        ) : errorMessage ? (
          <div
            style={{
              padding: '32px 20px',
              color: '#b91c1c',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </div>
        ) : workers.length === 0 ? (
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
              No workers registered
            </strong>

            <span
              style={{
                color: '#64748b',
              }}
            >
              Workers added to Field Management will
              appear here.
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
                minWidth: '850px',
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
                </tr>
              </thead>

              <tbody>
                {workers.map((worker) => (
                  <tr
                    key={worker.id}
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
                        {worker.field_id}
                      </span>
                    </TableCell>

                    <TableCell>
                      <strong
                        style={{
                          color: '#0f172a',
                        }}
                      >
                        {getWorkerName(worker)}
                      </strong>
                    </TableCell>

                    <TableCell>
                      {worker.field_companies?.name ||
                        '—'}
                    </TableCell>

                    <TableCell>
                      {worker.field_trades?.name ||
                        '—'}
                    </TableCell>

                    <TableCell>
                      {worker.field_roles?.name ||
                        '—'}
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        status={worker.status}
                        label={formatStatus(
                          worker.status
                        )}
                      />
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({ label, value }) {
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

function TableHeader({ children }) {
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

function TableCell({ children }) {
  return (
    <td
      style={{
        padding: '15px 16px',
        color: '#475569',
        fontSize: '14px',
        verticalAlign: 'middle',
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
  const isActive = status === 'active'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '5px 9px',
        background: isActive
          ? '#dcfce7'
          : '#f1f5f9',
        color: isActive
          ? '#166534'
          : '#475569',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  )
}
