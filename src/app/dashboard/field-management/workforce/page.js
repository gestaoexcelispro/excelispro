'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../../../../lib/supabase'

const initialFormData = {
  companyEmployeeNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  companyId: '',
  tradeId: '',
  roleId: '',
  status: 'active',
}

export default function WorkforcePage() {
  const [workers, setWorkers] = useState([])
  const [companies, setCompanies] = useState([])
  const [trades, setTrades] = useState([])
  const [roles, setRoles] = useState([])

  const [organizationId, setOrganizationId] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [formError, setFormError] =
    useState('')

  const [showAddWorker, setShowAddWorker] =
    useState(false)

  const [formData, setFormData] =
    useState(initialFormData)

  const loadWorkforceData =
    useCallback(async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const [
          workersResult,
          companiesResult,
          tradesResult,
          rolesResult,
        ] = await Promise.all([
          supabase
            .from('field_workers')
            .select(`
              id,
              organization_id,
              field_id,
              company_employee_number,
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
            .order('field_id', {
              ascending: true,
            }),

          supabase
            .from('field_companies')
            .select(`
              id,
              organization_id,
              name,
              status
            `)
            .eq('status', 'active')
            .order('name', {
              ascending: true,
            }),

          supabase
            .from('field_trades')
            .select(`
              id,
              organization_id,
              name,
              status
            `)
            .eq('status', 'active')
            .order('name', {
              ascending: true,
            }),

          supabase
            .from('field_roles')
            .select(`
              id,
              organization_id,
              name,
              status
            `)
            .eq('status', 'active')
            .order('name', {
              ascending: true,
            }),
        ])

        const firstError =
          workersResult.error ||
          companiesResult.error ||
          tradesResult.error ||
          rolesResult.error

        if (firstError) {
          throw firstError
        }

        const loadedWorkers =
          workersResult.data || []

        const loadedCompanies =
          companiesResult.data || []

        const loadedTrades =
          tradesResult.data || []

        const loadedRoles =
          rolesResult.data || []

        setWorkers(loadedWorkers)
        setCompanies(loadedCompanies)
        setTrades(loadedTrades)
        setRoles(loadedRoles)

        const detectedOrganizationId =
          loadedWorkers[0]?.organization_id ||
          loadedCompanies[0]?.organization_id ||
          loadedTrades[0]?.organization_id ||
          loadedRoles[0]?.organization_id ||
          null

        setOrganizationId(
          detectedOrganizationId
        )

        if (!detectedOrganizationId) {
          setErrorMessage(
            'Unable to determine the active organization for Field Management.'
          )
        }
      } catch (error) {
        console.error(
          'Error loading Field Management:',
          error
        )

        setWorkers([])
        setCompanies([])
        setTrades([])
        setRoles([])

        setErrorMessage(
          error?.message ||
            'Unable to load the workforce registry.'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    loadWorkforceData()
  }, [loadWorkforceData])

  const totalWorkers = workers.length

  const activeWorkers = useMemo(
    () =>
      workers.filter(
        (worker) =>
          worker.status === 'active'
      ).length,
    [workers]
  )

  const inactiveWorkers =
    totalWorkers - activeWorkers

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

  function openAddWorker() {
    setFormData(initialFormData)
    setFormError('')
    setShowAddWorker(true)
  }

  function closeAddWorker() {
    if (saving) {
      return
    }

    setShowAddWorker(false)
    setFormError('')
    setFormData(initialFormData)
  }

  function handleFormChange(event) {
    const {
      name,
      value,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleAddWorker(event) {
    event.preventDefault()

    setFormError('')

    if (!organizationId) {
      setFormError(
        'The active organization could not be determined.'
      )
      return
    }

    const companyEmployeeNumber =
      formData.companyEmployeeNumber.trim()

    const firstName =
      formData.firstName.trim()

    const middleName =
      formData.middleName.trim()

    const lastName =
      formData.lastName.trim()

    if (!firstName) {
      setFormError(
        'First Name is required.'
      )
      return
    }

    if (!lastName) {
      setFormError(
        'Last Name is required.'
      )
      return
    }

    if (!formData.companyId) {
      setFormError(
        'Company is required.'
      )
      return
    }

    if (!formData.tradeId) {
      setFormError(
        'Trade is required.'
      )
      return
    }

    if (!formData.roleId) {
      setFormError(
        'Role is required.'
      )
      return
    }

    setSaving(true)

    try {
      /*
       * field_id is intentionally NOT sent.
       *
       * PostgreSQL generates it through:
       *
       * trg_set_field_worker_id
       *        ↓
       * generate_next_field_worker_id()
       *
       * Field ID is the RitsuFlow internal
       * workforce identifier.
       *
       * company_employee_number is different:
       * it is the optional employee number
       * assigned by the worker's employer.
       */
      const {
        data,
        error,
      } = await supabase
        .from('field_workers')
        .insert({
          organization_id:
            organizationId,

          company_employee_number:
            companyEmployeeNumber ||
            null,

          first_name:
            firstName,

          middle_name:
            middleName || null,

          last_name:
            lastName,

          default_company_id:
            formData.companyId,

          default_trade_id:
            formData.tradeId,

          default_role_id:
            formData.roleId,

          status:
            formData.status,
        })
        .select(`
          id,
          field_id,
          company_employee_number,
          first_name,
          middle_name,
          last_name
        `)
        .single()

      if (error) {
        throw error
      }

      setShowAddWorker(false)
      setFormData(initialFormData)

      await loadWorkforceData()

      window.alert(
        `Worker registered successfully. Field ID: ${data.field_id}`
      )
    } catch (error) {
      console.error(
        'Error registering Field Worker:',
        error
      )

      setFormError(
        error?.message ||
          'Unable to register the worker.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
            justifyContent:
              'space-between',
            alignItems:
              'flex-start',
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
                letterSpacing:
                  '0.08em',
                textTransform:
                  'uppercase',
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
              Manage the master worker
              records available for project
              assignments, attendance and
              workforce reporting.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddWorker}
            disabled={
              loading ||
              !organizationId
            }
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '11px 18px',
              background:
                loading ||
                !organizationId
                  ? '#cbd5e1'
                  : '#0f766e',
              color:
                loading ||
                !organizationId
                  ? '#64748b'
                  : '#ffffff',
              fontWeight: 700,
              cursor:
                loading ||
                !organizationId
                  ? 'not-allowed'
                  : 'pointer',
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
            border:
              '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom:
                '1px solid #e2e8f0',
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
            <MessageArea>
              Loading workforce...
            </MessageArea>
          ) : errorMessage ? (
            <MessageArea
              color="#b91c1c"
            >
              {errorMessage}
            </MessageArea>
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
                Add the first worker
                to start the Field
                Management registry.
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
                  borderCollapse:
                    'collapse',
                  minWidth: '980px',
                }}
              >
                <thead
                  style={{
                    background:
                      '#f8fafc',
                  }}
                >
                  <tr>
                    <TableHeader>
                      Field ID
                    </TableHeader>

                    <TableHeader>
                      Employee No.
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
                  {workers.map(
                    (worker) => (
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
                              fontWeight:
                                700,
                              color:
                                '#0f172a',
                            }}
                          >
                            {
                              worker.field_id
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          {worker.company_employee_number ||
                            '—'}
                        </TableCell>

                        <TableCell>
                          <strong
                            style={{
                              color:
                                '#0f172a',
                            }}
                          >
                            {getWorkerName(
                              worker
                            )}
                          </strong>
                        </TableCell>

                        <TableCell>
                          {worker
                            .field_companies
                            ?.name || '—'}
                        </TableCell>

                        <TableCell>
                          {worker
                            .field_trades
                            ?.name || '—'}
                        </TableCell>

                        <TableCell>
                          {worker
                            .field_roles
                            ?.name || '—'}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              worker.status
                            }
                            label={formatStatus(
                              worker.status
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

      {showAddWorker && (
        <ModalOverlay>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-worker-title"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.24)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'flex-start',
                gap: '20px',
                padding: '22px 24px',
                borderBottom:
                  '1px solid #e2e8f0',
              }}
            >
              <div>
                <p
                  style={{
                    margin: '0 0 5px',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform:
                      'uppercase',
                    letterSpacing:
                      '0.07em',
                  }}
                >
                  Workforce Registry
                </p>

                <h2
                  id="add-worker-title"
                  style={{
                    margin: 0,
                    color: '#0f172a',
                    fontSize: '21px',
                  }}
                >
                  Add Worker
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAddWorker}
                disabled={saving}
                aria-label="Close"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border:
                    '1px solid #e2e8f0',
                  background:
                    '#ffffff',
                  color: '#475569',
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                  fontSize: '20px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddWorker}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '22px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    padding:
                      '13px 15px',
                    borderRadius: '9px',
                    border:
                      '1px solid #dbeafe',
                    background:
                      '#eff6ff',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 3px',
                      color: '#1e40af',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    RitsuFlow Field ID
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: '#475569',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    Generated
                    automatically when
                    this worker is
                    registered. This is
                    the worker&apos;s
                    internal RitsuFlow
                    identifier.
                  </p>
                </div>

                <FormSection
                  title="Worker Identity"
                >
                  <FormField
                    label="Company Employee Number"
                  >
                    <input
                      name="companyEmployeeNumber"
                      type="text"
                      autoComplete="off"
                      value={
                        formData.companyEmployeeNumber
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Optional employer-issued ID"
                      style={inputStyle}
                    />
                  </FormField>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <FormField
                      label="First Name"
                      required
                    >
                      <input
                        name="firstName"
                        type="text"
                        required
                        autoComplete="off"
                        value={
                          formData.firstName
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField
                      label="Middle Name"
                    >
                      <input
                        name="middleName"
                        type="text"
                        autoComplete="off"
                        value={
                          formData.middleName
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Last Name"
                    required
                  >
                    <input
                      name="lastName"
                      type="text"
                      required
                      autoComplete="off"
                      value={
                        formData.lastName
                      }
                      onChange={
                        handleFormChange
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </FormSection>

                <FormSection
                  title="Default Work Classification"
                >
                  <p
                    style={{
                      margin: '-4px 0 2px',
                      color: '#64748b',
                      fontSize: '12px',
                      lineHeight: 1.5,
                    }}
                  >
                    These values define the
                    worker&apos;s default
                    classification and can
                    later be overridden by
                    project assignment context.
                  </p>

                  <FormField
                    label="Company / Employer"
                    required
                  >
                    <select
                      name="companyId"
                      required
                      value={
                        formData.companyId
                      }
                      onChange={
                        handleFormChange
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select company
                      </option>

                      {companies.map(
                        (company) => (
                          <option
                            key={
                              company.id
                            }
                            value={
                              company.id
                            }
                          >
                            {
                              company.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </FormField>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <FormField
                      label="Default Trade"
                      required
                    >
                      <select
                        name="tradeId"
                        required
                        value={
                          formData.tradeId
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Select trade
                        </option>

                        {trades.map(
                          (trade) => (
                            <option
                              key={
                                trade.id
                              }
                              value={
                                trade.id
                              }
                            >
                              {
                                trade.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      label="Default Role"
                      required
                    >
                      <select
                        name="roleId"
                        required
                        value={
                          formData.roleId
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Select role
                        </option>

                        {roles.map(
                          (role) => (
                            <option
                              key={
                                role.id
                              }
                              value={
                                role.id
                              }
                            >
                              {
                                role.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="Status"
                    required
                  >
                    <select
                      name="status"
                      value={
                        formData.status
                      }
                      onChange={
                        handleFormChange
                      }
                      style={inputStyle}
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>
                    </select>
                  </FormField>
                </FormSection>

                {formError && (
                  <div
                    style={{
                      padding:
                        '12px 14px',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #fecaca',
                      background:
                        '#fef2f2',
                      color: '#b91c1c',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    {formError}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  padding: '18px 24px',
                  borderTop:
                    '1px solid #e2e8f0',
                  background:
                    '#f8fafc',
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeAddWorker
                  }
                  disabled={saving}
                  style={{
                    border:
                      '1px solid #cbd5e1',
                    borderRadius:
                      '8px',
                    padding:
                      '10px 17px',
                    background:
                      '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: 'none',
                    borderRadius:
                      '8px',
                    padding:
                      '10px 17px',
                    background: saving
                      ? '#94a3b8'
                      : '#0f766e',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  {saving
                    ? 'Registering...'
                    : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </>
  )
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '42px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '9px 11px',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: '14px',
  outline: 'none',
}

function MetricCard({
  label,
  value,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border:
          '1px solid #e2e8f0',
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
  const isActive =
    status === 'active'

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

function FormSection({
  title,
  children,
}) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <h3
        style={{
          margin: 0,
          color: '#0f172a',
          fontSize: '15px',
        }}
      >
        {title}
      </h3>

      {children}
    </section>
  )
}

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        color: '#334155',
        fontSize: '13px',
        fontWeight: 700,
      }}
    >
      <span>
        {label}

        {required && (
          <span
            style={{
              color: '#dc2626',
            }}
          >
            {' '}
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}

function ModalOverlay({
  children,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background:
          'rgba(15, 23, 42, 0.52)',
      }}
    >
      {children}
    </div>
  )
}
