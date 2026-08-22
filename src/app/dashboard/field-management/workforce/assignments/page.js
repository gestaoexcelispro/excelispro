'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../../../../../lib/supabase'

function getLocalToday() {
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

function createInitialFormData() {
  return {
    workerId: '',
    projectId: '',
    companyId: '',
    tradeId: '',
    roleId: '',
    crewId: '',
    startDate: getLocalToday(),
    endDate: '',
    status: 'active',
  }
}

export default function WorkforceAssignmentsPage() {
  const [assignments, setAssignments] =
    useState([])

  const [workers, setWorkers] =
    useState([])

  const [projects, setProjects] =
    useState([])

  const [companies, setCompanies] =
    useState([])

  const [trades, setTrades] =
    useState([])

  const [roles, setRoles] =
    useState([])

  const [crews, setCrews] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [formError, setFormError] =
    useState('')

  const [
    showNewAssignment,
    setShowNewAssignment,
  ] = useState(false)

  const [formData, setFormData] =
    useState(createInitialFormData())

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [
        assignmentsResult,
        workersResult,
        projectsResult,
        companiesResult,
        tradesResult,
        rolesResult,
        crewsResult,
      ] = await Promise.all([
        supabase
          .from('field_project_assignments')
          .select(`
            id,
            organization_id,
            project_id,
            worker_id,
            company_id,
            trade_id,
            role_id,
            crew_id,
            start_date,
            end_date,
            status,
            created_at,

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
          }),

        supabase
          .from('field_workers')
          .select(`
            id,
            organization_id,
            field_id,
            first_name,
            middle_name,
            last_name,
            default_company_id,
            default_trade_id,
            default_role_id,
            status
          `)
          .eq('status', 'active')
          .order('field_id', {
            ascending: true,
          }),

        supabase
          .from('projects')
          .select(`
            id,
            organization_id,
            code,
            name,
            status
          `)
          .order('code', {
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

        supabase
          .from('field_crews')
          .select(`
            id,
            organization_id,
            company_id,
            name,
            status
          `)
          .eq('status', 'active')
          .order('name', {
            ascending: true,
          }),
      ])

      const firstError =
        assignmentsResult.error ||
        workersResult.error ||
        projectsResult.error ||
        companiesResult.error ||
        tradesResult.error ||
        rolesResult.error ||
        crewsResult.error

      if (firstError) {
        throw firstError
      }

      setAssignments(
        assignmentsResult.data || []
      )

      setWorkers(
        workersResult.data || []
      )

      setProjects(
        projectsResult.data || []
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

      setCrews(
        crewsResult.data || []
      )
    } catch (error) {
      console.error(
        'Error loading Project Assignments:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load project assignments.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const availableCrews = useMemo(
    () =>
      crews.filter((crew) => {
        if (!formData.companyId) {
          return true
        }

        return (
          crew.company_id ===
          formData.companyId
        )
      }),
    [crews, formData.companyId]
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

  function openNewAssignment() {
    setFormError('')
    setFormData(
      createInitialFormData()
    )
    setShowNewAssignment(true)
  }

  function closeNewAssignment() {
    if (saving) {
      return
    }

    setFormError('')
    setFormData(
      createInitialFormData()
    )
    setShowNewAssignment(false)
  }

  function handleFormChange(event) {
    const {
      name,
      value,
    } = event.target

    if (name === 'workerId') {
      const selectedWorker =
        workers.find(
          (worker) =>
            worker.id === value
        )

      setFormData((current) => ({
        ...current,
        workerId: value,
        companyId:
          selectedWorker
            ?.default_company_id || '',
        tradeId:
          selectedWorker
            ?.default_trade_id || '',
        roleId:
          selectedWorker
            ?.default_role_id || '',
        crewId: '',
      }))

      return
    }

    if (name === 'companyId') {
      setFormData((current) => ({
        ...current,
        companyId: value,
        crewId: '',
      }))

      return
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleCreateAssignment(
    event
  ) {
    event.preventDefault()

    setFormError('')

    if (!formData.workerId) {
      setFormError(
        'Worker is required.'
      )
      return
    }

    if (!formData.projectId) {
      setFormError(
        'Project is required.'
      )
      return
    }

    if (!formData.companyId) {
      setFormError(
        'Company is required.'
      )
      return
    }

    if (!formData.startDate) {
      setFormError(
        'Start Date is required.'
      )
      return
    }

    if (
      formData.endDate &&
      formData.endDate <
        formData.startDate
    ) {
      setFormError(
        'End Date cannot be earlier than Start Date.'
      )
      return
    }

    const selectedWorker =
      workers.find(
        (worker) =>
          worker.id ===
          formData.workerId
      )

    const selectedProject =
      projects.find(
        (project) =>
          project.id ===
          formData.projectId
      )

    if (
      !selectedWorker ||
      !selectedProject
    ) {
      setFormError(
        'Unable to determine the selected Worker or Project.'
      )
      return
    }

    if (
      selectedWorker.organization_id !==
      selectedProject.organization_id
    ) {
      setFormError(
        'Worker and Project must belong to the same organization.'
      )
      return
    }

    const duplicateAssignment =
      assignments.find(
        (assignment) =>
          assignment.worker_id ===
            formData.workerId &&
          assignment.project_id ===
            formData.projectId &&
          ['active', 'scheduled'].includes(
            assignment.status
          )
      )

    if (duplicateAssignment) {
      setFormError(
        'This worker already has an active or scheduled assignment for the selected project.'
      )
      return
    }

    setSaving(true)

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          'field_project_assignments'
        )
        .insert({
          organization_id:
            selectedProject.organization_id,

          project_id:
            formData.projectId,

          worker_id:
            formData.workerId,

          company_id:
            formData.companyId,

          trade_id:
            formData.tradeId || null,

          role_id:
            formData.roleId || null,

          crew_id:
            formData.crewId || null,

          start_date:
            formData.startDate,

          end_date:
            formData.endDate || null,

          status:
            formData.status,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      if (!data?.id) {
        throw new Error(
          'Assignment was created but no identifier was returned.'
        )
      }

      setShowNewAssignment(false)

      setFormData(
        createInitialFormData()
      )

      await loadData()

      window.alert(
        'Project assignment created successfully.'
      )
    } catch (error) {
      console.error(
        'Error creating Project Assignment:',
        error
      )

      setFormError(
        error?.message ||
          'Unable to create the project assignment.'
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
              Allocate workers to
              projects while preserving
              company, trade, role and
              crew context.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewAssignment
            }
            disabled={loading}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '11px 18px',
              background: loading
                ? '#cbd5e1'
                : '#0f766e',
              color: loading
                ? '#64748b'
                : '#ffffff',
              fontWeight: 700,
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
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
              Assignments
            </h3>
          </div>

          {loading ? (
            <MessageArea>
              Loading project assignments...
            </MessageArea>
          ) : errorMessage ? (
            <MessageArea
              color="#b91c1c"
            >
              {errorMessage}
            </MessageArea>
          ) : assignments.length === 0 ? (
            <MessageArea>
              No project assignments found.
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
                  borderCollapse:
                    'collapse',
                  minWidth: '1180px',
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
                          <strong>
                            {assignment
                              .field_workers
                              ?.field_id ||
                              '—'}
                          </strong>
                        </TableCell>

                        <TableCell>
                          <strong
                            style={{
                              color:
                                '#0f172a',
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
                                display:
                                  'flex',
                                flexDirection:
                                  'column',
                                gap: '2px',
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    '#0f172a',
                                }}
                              >
                                {
                                  assignment
                                    .projects
                                    .code
                                }
                              </strong>

                              <span
                                style={{
                                  color:
                                    '#64748b',
                                  fontSize:
                                    '12px',
                                }}
                              >
                                {
                                  assignment
                                    .projects
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

      {showNewAssignment && (
        <ModalOverlay>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-assignment-title"
            style={{
              width: '100%',
              maxWidth: '720px',
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
                  Workforce
                </p>

                <h2
                  id="new-assignment-title"
                  style={{
                    margin: 0,
                    color: '#0f172a',
                    fontSize: '21px',
                  }}
                >
                  New Project Assignment
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeNewAssignment
                }
                disabled={saving}
                aria-label="Close"
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleCreateAssignment
              }
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '20px',
                  padding: '24px',
                }}
              >
                <FormField
                  label="Worker"
                  required
                >
                  <select
                    name="workerId"
                    required
                    value={
                      formData.workerId
                    }
                    onChange={
                      handleFormChange
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Select worker
                    </option>

                    {workers.map(
                      (worker) => (
                        <option
                          key={worker.id}
                          value={worker.id}
                        >
                          {worker.field_id}
                          {' — '}
                          {getWorkerName(
                            worker
                          )}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField
                  label="Project"
                  required
                >
                  <select
                    name="projectId"
                    required
                    value={
                      formData.projectId
                    }
                    onChange={
                      handleFormChange
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Select project
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.code}
                          {' — '}
                          {project.name}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormSection
                  title="Assignment Context"
                >
                  <FormField
                    label="Company"
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
                            key={company.id}
                            value={company.id}
                          >
                            {company.name}
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
                      label="Trade"
                    >
                      <select
                        name="tradeId"
                        value={
                          formData.tradeId
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          No trade
                        </option>

                        {trades.map(
                          (trade) => (
                            <option
                              key={trade.id}
                              value={trade.id}
                            >
                              {trade.name}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      label="Role"
                    >
                      <select
                        name="roleId"
                        value={
                          formData.roleId
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          No role
                        </option>

                        {roles.map(
                          (role) => (
                            <option
                              key={role.id}
                              value={role.id}
                            >
                              {role.name}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="Crew"
                  >
                    <select
                      name="crewId"
                      value={
                        formData.crewId
                      }
                      onChange={
                        handleFormChange
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        No crew
                      </option>

                      {availableCrews.map(
                        (crew) => (
                          <option
                            key={crew.id}
                            value={crew.id}
                          >
                            {crew.name}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>
                </FormSection>

                <FormSection
                  title="Assignment Period"
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <FormField
                      label="Start Date"
                      required
                    >
                      <input
                        name="startDate"
                        type="date"
                        required
                        value={
                          formData.startDate
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField
                      label="End Date"
                    >
                      <input
                        name="endDate"
                        type="date"
                        min={
                          formData.startDate
                        }
                        value={
                          formData.endDate
                        }
                        onChange={
                          handleFormChange
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Status"
                    required
                  >
                    <select
                      name="status"
                      required
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

                      <option value="scheduled">
                        Scheduled
                      </option>

                      <option value="ended">
                        Ended
                      </option>

                      <option value="cancelled">
                        Cancelled
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
                    closeNewAssignment
                  }
                  disabled={saving}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButtonStyle,
                    background: saving
                      ? '#94a3b8'
                      : '#0f766e',
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  {saving
                    ? 'Creating...'
                    : 'Create Assignment'}
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

const closeButtonStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  color: '#475569',
  cursor: 'pointer',
  fontSize: '20px',
  lineHeight: 1,
}

const secondaryButtonStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '10px 17px',
  background: '#ffffff',
  color: '#334155',
  fontWeight: 700,
  cursor: 'pointer',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '8px',
  padding: '10px 17px',
  color: '#ffffff',
  fontWeight: 700,
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
  const appearances = {
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
    appearances[status] ||
    appearances.ended

  return (
    <span
      style={{
        display: 'inline-flex',
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
