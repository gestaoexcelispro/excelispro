'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/client'
import styles from './location-breakdown.module.css'

const locationTypeOptions = [
  {
    value: 'building',
    label: 'Building',
  },
  {
    value: 'floor',
    label: 'Floor',
  },
  {
    value: 'zone',
    label: 'Zone',
  },
  {
    value: 'area',
    label: 'Area',
  },
  {
    value: 'room',
    label: 'Room',
  },
  {
    value: 'custom',
    label: 'Custom location',
  },
]

const statusOptions = [
  {
    value: 'planned',
    label: 'Planned',
  },
  {
    value: 'ready',
    label: 'Ready',
  },
  {
    value: 'in_progress',
    label: 'In progress',
  },
  {
    value: 'completed',
    label: 'Completed',
  },
  {
    value: 'blocked',
    label: 'Blocked',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
  },
]

const unitOptions = [
  'SF',
  'LF',
  'CY',
  'EA',
  'HR',
  'DAY',
  'TON',
  'GAL',
]

const emptyLocationForm = {
  id: null,
  location_type: 'area',
  name: '',
  parent_id: '',
  environment_type: '',
  sequence_number: '',
}

const emptyScopeForm = {
  id: null,
  location_id: '',
  service_name: '',
  service_code: '',
  quantity: '',
  unit: 'SF',
  status: 'planned',
}

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function getStatusLabel(status) {
  return (
    statusOptions.find(
      (option) => option.value === status
    )?.label || status
  )
}

function getLocationTypeLabel(locationType) {
  return (
    locationTypeOptions.find(
      (option) =>
        option.value === locationType
    )?.label || locationType
  )
}

function getErrorMessage(error) {
  if (!error) {
    return 'An unexpected error occurred.'
  }

  if (error.code === '23505') {
    return 'A location with this name already exists under the selected parent.'
  }

  if (error.code === '23503') {
    return 'This record is connected to other project information and cannot be changed.'
  }

  if (error.code === '42501') {
    return 'Your account does not have permission to perform this action.'
  }

  return (
    error.message ||
    'The requested operation could not be completed.'
  )
}

export default function LocationBreakdownPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [userId, setUserId] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] =
    useState(null)

  const [locations, setLocations] = useState([])
  const [scopeItems, setScopeItems] = useState([])

  const [activeTab, setActiveTab] =
    useState('locations')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [floorFilter, setFloorFilter] =
    useState('all')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [locationForm, setLocationForm] =
    useState(emptyLocationForm)

  const [scopeForm, setScopeForm] =
    useState(emptyScopeForm)

  const [
    isLocationModalOpen,
    setIsLocationModalOpen,
  ] = useState(false)

  const [
    isScopeModalOpen,
    setIsScopeModalOpen,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSaving, setIsSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [noticeMessage, setNoticeMessage] =
    useState('')

  const loadWorkspace = useCallback(
    async () => {
      setIsLoading(true)
      setErrorMessage('')

      const queryParameters =
        new URLSearchParams(
          window.location.search
        )

      const selectedProjectId =
        queryParameters.get('projectId')

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        )

        setIsLoading(false)
        return
      }

      setUserId(userData.user.id)

      const {
        data: projectsData,
        error: projectsError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          code,
          name,
          client_name,
          status,
          created_at
        `)
        .neq('status', 'archived')
        .order('created_at', {
          ascending: false,
        })

      if (projectsError) {
        setErrorMessage(
          getErrorMessage(projectsError)
        )

        setIsLoading(false)
        return
      }

      const availableProjects =
        projectsData || []

      setProjects(availableProjects)

      if (!selectedProjectId) {
        setSelectedProject(null)
        setLocations([])
        setScopeItems([])
        setIsLoading(false)
        return
      }

      const activeProject =
        availableProjects.find(
          (project) =>
            project.id === selectedProjectId
        )

      if (!activeProject) {
        setErrorMessage(
          'The selected project does not exist or your account cannot access it.'
        )

        setSelectedProject(null)
        setIsLoading(false)
        return
      }

      setSelectedProject(activeProject)

      const [
        locationsResult,
        scopeItemsResult,
      ] = await Promise.all([
        supabase
          .from('locations')
          .select(`
            id,
            project_id,
            parent_id,
            name,
            location_type,
            environment_type,
            sequence_number,
            created_at,
            updated_at
          `)
          .eq(
            'project_id',
            selectedProjectId
          )
          .order('sequence_number', {
            ascending: true,
          })
          .order('name', {
            ascending: true,
          }),

        supabase
          .from('scope_items')
          .select(`
            id,
            project_id,
            location_id,
            service_code,
            service_name,
            quantity,
            unit,
            status,
            created_at,
            updated_at
          `)
          .eq(
            'project_id',
            selectedProjectId
          )
          .order('service_name', {
            ascending: true,
          }),
      ])

      if (
        locationsResult.error ||
        scopeItemsResult.error
      ) {
        setErrorMessage(
          getErrorMessage(
            locationsResult.error ||
              scopeItemsResult.error
          )
        )

        setIsLoading(false)
        return
      }

      setLocations(
        locationsResult.data || []
      )

      setScopeItems(
        scopeItemsResult.data || []
      )

      setIsLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const locationMap = useMemo(() => {
    return new Map(
      locations.map((location) => [
        location.id,
        location,
      ])
    )
  }, [locations])

  const locationPathMap = useMemo(() => {
    const pathMap = new Map()

    function buildPath(location) {
      if (!location) {
        return []
      }

      if (pathMap.has(location.id)) {
        return pathMap.get(location.id)
      }

      const path = []
      const visitedIds = new Set()

      let currentLocation = location

      while (
        currentLocation &&
        !visitedIds.has(currentLocation.id)
      ) {
        visitedIds.add(
          currentLocation.id
        )

        path.unshift(currentLocation)

        currentLocation =
          currentLocation.parent_id
            ? locationMap.get(
                currentLocation.parent_id
              )
            : null
      }

      pathMap.set(location.id, path)

      return path
    }

    locations.forEach((location) => {
      buildPath(location)
    })

    return pathMap
  }, [locations, locationMap])

  const sortedLocations = useMemo(() => {
    return [...locations].sort(
      (firstLocation, secondLocation) => {
        if (
          firstLocation.sequence_number !==
          secondLocation.sequence_number
        ) {
          return (
            firstLocation.sequence_number -
            secondLocation.sequence_number
          )
        }

        return firstLocation.name.localeCompare(
          secondLocation.name
        )
      }
    )
  }, [locations])

  const floorLocations = useMemo(() => {
    return sortedLocations.filter(
      (location) =>
        location.location_type === 'floor'
    )
  }, [sortedLocations])

  const areaCount = useMemo(() => {
    return locations.filter(
      (location) =>
        location.location_type === 'area' ||
        location.location_type === 'room'
    ).length
  }, [locations])

  const zoneCount = useMemo(() => {
    return locations.filter(
      (location) =>
        location.location_type === 'zone'
    ).length
  }, [locations])

  const filteredLocations = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return sortedLocations
    }

    return sortedLocations.filter(
      (location) => {
        const parentLocation =
          location.parent_id
            ? locationMap.get(
                location.parent_id
              )
            : null

        const searchableText = [
          location.name,
          location.location_type,
          location.environment_type,
          parentLocation?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(
          normalizedSearch
        )
      }
    )
  }, [
    locationMap,
    searchTerm,
    sortedLocations,
  ])

  const filteredScopeItems = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return scopeItems.filter((scopeItem) => {
      const path =
        locationPathMap.get(
          scopeItem.location_id
        ) || []

      const floor = path.find(
        (location) =>
          location.location_type === 'floor'
      )

      const searchableText = [
        scopeItem.service_name,
        scopeItem.service_code,
        scopeItem.unit,
        scopeItem.status,
        ...path.map(
          (location) => location.name
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch
        )

      const matchesFloor =
        floorFilter === 'all' ||
        floor?.id === floorFilter

      const matchesStatus =
        statusFilter === 'all' ||
        scopeItem.status === statusFilter

      return (
        matchesSearch &&
        matchesFloor &&
        matchesStatus
      )
    })
  }, [
    floorFilter,
    locationPathMap,
    scopeItems,
    searchTerm,
    statusFilter,
  ])

  function changeProject(projectId) {
    window.location.href =
      `/dashboard/projects/locations?projectId=${projectId}`
  }

  function openNewLocationModal() {
    const nextSequence =
      locations.reduce(
        (largestSequence, location) =>
          Math.max(
            largestSequence,
            Number(
              location.sequence_number
            ) || 0
          ),
        0
      ) + 1

    setLocationForm({
      ...emptyLocationForm,
      sequence_number: String(
        nextSequence
      ),
    })

    setErrorMessage('')
    setIsLocationModalOpen(true)
  }

  function openEditLocationModal(
    location
  ) {
    setLocationForm({
      id: location.id,
      location_type:
        location.location_type,
      name: location.name,
      parent_id:
        location.parent_id || '',
      environment_type:
        location.environment_type || '',
      sequence_number: String(
        location.sequence_number
      ),
    })

    setErrorMessage('')
    setIsLocationModalOpen(true)
  }

  function closeLocationModal() {
    if (isSaving) {
      return
    }

    setIsLocationModalOpen(false)
    setLocationForm(
      emptyLocationForm
    )
  }

  function openNewScopeModal() {
    setScopeForm({
      ...emptyScopeForm,
      location_id:
        sortedLocations[0]?.id || '',
    })

    setErrorMessage('')
    setIsScopeModalOpen(true)
  }

  function openEditScopeModal(
    scopeItem
  ) {
    setScopeForm({
      id: scopeItem.id,
      location_id:
        scopeItem.location_id,
      service_name:
        scopeItem.service_name,
      service_code:
        scopeItem.service_code || '',
      quantity:
        scopeItem.quantity === null
          ? ''
          : String(scopeItem.quantity),
      unit: scopeItem.unit || 'SF',
      status:
        scopeItem.status || 'planned',
    })

    setErrorMessage('')
    setIsScopeModalOpen(true)
  }

  function closeScopeModal() {
    if (isSaving) {
      return
    }

    setIsScopeModalOpen(false)
    setScopeForm(emptyScopeForm)
  }

  async function saveLocation(event) {
    event.preventDefault()

    if (
      !selectedProject ||
      !userId
    ) {
      return
    }

    const normalizedName =
      locationForm.name.trim()

    if (!normalizedName) {
      setErrorMessage(
        'Enter a location name.'
      )
      return
    }

    if (
      locationForm.id &&
      locationForm.parent_id ===
        locationForm.id
    ) {
      setErrorMessage(
        'A location cannot be its own parent.'
      )
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const locationPayload = {
      project_id:
        selectedProject.id,
      parent_id:
        locationForm.parent_id ||
        null,
      name: normalizedName,
      location_type:
        locationForm.location_type,
      environment_type:
        locationForm.environment_type
          .trim() || null,
      sequence_number:
        Number(
          locationForm.sequence_number
        ) || 0,
    }

    let operationResult

    if (locationForm.id) {
      operationResult = await supabase
        .from('locations')
        .update(locationPayload)
        .eq('id', locationForm.id)
        .eq(
          'project_id',
          selectedProject.id
        )
        .select(`
          id,
          project_id,
          parent_id,
          name,
          location_type,
          environment_type,
          sequence_number,
          created_at,
          updated_at
        `)
        .single()
    } else {
      operationResult = await supabase
        .from('locations')
        .insert({
          ...locationPayload,
          created_by: userId,
        })
        .select(`
          id,
          project_id,
          parent_id,
          name,
          location_type,
          environment_type,
          sequence_number,
          created_at,
          updated_at
        `)
        .single()
    }

    if (operationResult.error) {
      setErrorMessage(
        getErrorMessage(
          operationResult.error
        )
      )

      setIsSaving(false)
      return
    }

    if (locationForm.id) {
      setLocations(
        (currentLocations) =>
          currentLocations.map(
            (location) =>
              location.id ===
              operationResult.data.id
                ? operationResult.data
                : location
          )
      )

      setNoticeMessage(
        `${operationResult.data.name} was updated.`
      )
    } else {
      setLocations(
        (currentLocations) => [
          ...currentLocations,
          operationResult.data,
        ]
      )

      setNoticeMessage(
        `${operationResult.data.name} was added to the location structure.`
      )
    }

    setIsSaving(false)
    setIsLocationModalOpen(false)
    setLocationForm(
      emptyLocationForm
    )
  }

  async function deleteLocation(
    location
  ) {
    const hasChildLocations =
      locations.some(
        (childLocation) =>
          childLocation.parent_id ===
          location.id
      )

    const hasScopeItems =
      scopeItems.some(
        (scopeItem) =>
          scopeItem.location_id ===
          location.id
      )

    if (
      hasChildLocations ||
      hasScopeItems
    ) {
      setNoticeMessage(
        `Cannot delete ${location.name}. Remove its child locations and scope assignments first.`
      )
      return
    }

    const confirmed =
      window.confirm(
        `Delete ${location.name}? This action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    setErrorMessage('')

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', location.id)
      .eq(
        'project_id',
        selectedProject.id
      )

    if (error) {
      setErrorMessage(
        getErrorMessage(error)
      )
      return
    }

    setLocations(
      (currentLocations) =>
        currentLocations.filter(
          (currentLocation) =>
            currentLocation.id !==
            location.id
        )
    )

    setNoticeMessage(
      `${location.name} was deleted.`
    )
  }

  async function saveScopeItem(event) {
    event.preventDefault()

    if (
      !selectedProject ||
      !userId
    ) {
      return
    }

    const normalizedServiceName =
      scopeForm.service_name.trim()

    if (!scopeForm.location_id) {
      setErrorMessage(
        'Select a production location.'
      )
      return
    }

    if (!normalizedServiceName) {
      setErrorMessage(
        'Enter a scope item name.'
      )
      return
    }

    const normalizedQuantity =
      scopeForm.quantity === ''
        ? null
        : Number(scopeForm.quantity)

    if (
      normalizedQuantity !== null &&
      (
        Number.isNaN(
          normalizedQuantity
        ) ||
        normalizedQuantity < 0
      )
    ) {
      setErrorMessage(
        'Enter a valid quantity.'
      )
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const scopePayload = {
      project_id:
        selectedProject.id,
      location_id:
        scopeForm.location_id,
      service_name:
        normalizedServiceName,
      service_code:
        scopeForm.service_code
          .trim() || null,
      quantity:
        normalizedQuantity,
      unit:
        scopeForm.unit || null,
      status:
        scopeForm.status,
    }

    let operationResult

    if (scopeForm.id) {
      operationResult = await supabase
        .from('scope_items')
        .update(scopePayload)
        .eq('id', scopeForm.id)
        .eq(
          'project_id',
          selectedProject.id
        )
        .select(`
          id,
          project_id,
          location_id,
          service_code,
          service_name,
          quantity,
          unit,
          status,
          created_at,
          updated_at
        `)
        .single()
    } else {
      operationResult = await supabase
        .from('scope_items')
        .insert({
          ...scopePayload,
          created_by: userId,
        })
        .select(`
          id,
          project_id,
          location_id,
          service_code,
          service_name,
          quantity,
          unit,
          status,
          created_at,
          updated_at
        `)
        .single()
    }

    if (operationResult.error) {
      setErrorMessage(
        getErrorMessage(
          operationResult.error
        )
      )

      setIsSaving(false)
      return
    }

    if (scopeForm.id) {
      setScopeItems(
        (currentScopeItems) =>
          currentScopeItems.map(
            (scopeItem) =>
              scopeItem.id ===
              operationResult.data.id
                ? operationResult.data
                : scopeItem
          )
      )

      setNoticeMessage(
        `${operationResult.data.service_name} was updated.`
      )
    } else {
      setScopeItems(
        (currentScopeItems) => [
          ...currentScopeItems,
          operationResult.data,
        ]
      )

      setNoticeMessage(
        `${operationResult.data.service_name} was assigned to the selected location.`
      )
    }

    setIsSaving(false)
    setIsScopeModalOpen(false)
    setScopeForm(emptyScopeForm)
  }

  async function deleteScopeItem(
    scopeItem
  ) {
    const confirmed =
      window.confirm(
        `Delete ${scopeItem.service_name}? This action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    setErrorMessage('')

    const { error } = await supabase
      .from('scope_items')
      .delete()
      .eq('id', scopeItem.id)
      .eq(
        'project_id',
        selectedProject.id
      )

    if (error) {
      setErrorMessage(
        getErrorMessage(error)
      )
      return
    }

    setScopeItems(
      (currentScopeItems) =>
        currentScopeItems.filter(
          (currentScopeItem) =>
            currentScopeItem.id !==
            scopeItem.id
        )
    )

    setNoticeMessage(
      `${scopeItem.service_name} was deleted.`
    )
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <span
          className={styles.loadingSpinner}
        />

        <p>Loading location workspace...</p>
      </div>
    )
  }

  if (
    errorMessage &&
    projects.length === 0
  ) {
    return (
      <div className={styles.errorState}>
        <h1 className={styles.errorTitle}>
          Workspace unavailable
        </h1>

        <p
          className={
            styles.errorDescription
          }
        >
          {errorMessage}
        </p>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={loadWorkspace}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <section className={styles.heading}>
          <div
            className={
              styles.headingContent
            }
          >
            <p className={styles.eyebrow}>
              Location-based planning
            </p>

            <h1 className={styles.title}>
              Location & Scope Workspace
            </h1>

            <p
              className={
                styles.description
              }
            >
              Select a project to define its
              location breakdown structure,
              scope items, and measurable
              quantities.
            </p>
          </div>

          <Link
            href="/dashboard/projects"
            className={styles.backLink}
          >
            ← Back to projects
          </Link>
        </section>

        <article className={styles.panel}>
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <h2
                className={
                  styles.panelTitle
                }
              >
                Select a project
              </h2>

              <p
                className={
                  styles.panelDescription
                }
              >
                Every project has an independent
                location and scope structure.
              </p>
            </div>

            <span
              className={
                styles.projectCode
              }
            >
              {projects.length === 1
                ? '1 project'
                : `${projects.length} projects`}
            </span>
          </div>

          {projects.length === 0 ? (
            <div
              className={
                styles.emptyState
              }
            >
              <h3
                className={
                  styles.emptyTitle
                }
              >
                No projects available.
              </h3>

              <p
                className={
                  styles.emptyDescription
                }
              >
                Create a project before defining
                its location breakdown
                structure.
              </p>

              <Link
                href="/dashboard/projects"
                className={
                  styles.primaryButton
                }
              >
                Open projects
              </Link>
            </div>
          ) : (
            <div
              className={
                styles.projectGrid
              }
            >
              {projects.map((project) => (
                <button
                  type="button"
                  className={
                    styles.projectCard
                  }
                  onClick={() =>
                    changeProject(project.id)
                  }
                  key={project.id}
                >
                  <div
                    className={
                      styles.projectIdentity
                    }
                  >
                    <span
                      className={
                        styles.projectName
                      }
                    >
                      {project.name}
                    </span>

                    <span
                      className={
                        styles.projectClient
                      }
                    >
                      {project.code ||
                        'Unassigned'}{' '}
                      ·{' '}
                      {project.client_name ||
                        'Client not specified'}
                    </span>
                  </div>

                  <span
                    className={
                      styles.projectArrow
                    }
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>
      </div>
    )
  }

  const summaryItems = [
    {
      label: 'Floors',
      value: floorLocations.length,
      detail: 'Building levels',
    },
    {
      label: 'Zones',
      value: zoneCount,
      detail: 'Production sequences',
    },
    {
      label: 'Areas and rooms',
      value: areaCount,
      detail: 'Assignable locations',
    },
    {
      label: 'Scope items',
      value: scopeItems.length,
      detail: 'Measured assignments',
    },
  ]

  return (
    <div className={styles.container}>
      <section className={styles.heading}>
        <div
          className={
            styles.headingContent
          }
        >
          <p className={styles.eyebrow}>
            Location-based planning foundation
          </p>

          <h1 className={styles.title}>
            Location & Scope Workspace
          </h1>

          <p
            className={
              styles.description
            }
          >
            Build the physical production
            hierarchy first, then assign
            measurable scope to the places where
            work will be controlled.
          </p>
        </div>

        <div
          className={
            styles.projectSelector
          }
        >
          <label
            htmlFor="active-project"
            className={
              styles.projectSelectorLabel
            }
          >
            Active project
          </label>

          <select
            id="active-project"
            className={
              styles.projectSelectorInput
            }
            value={selectedProject.id}
            onChange={(event) =>
              changeProject(
                event.target.value
              )
            }
          >
            {projects.map((project) => (
              <option
                value={project.id}
                key={project.id}
              >
                {project.code ||
                  'Unassigned'}{' '}
                · {project.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section
        className={styles.summaryGrid}
        aria-label="Location summary"
      >
        {summaryItems.map((item) => (
          <article
            className={styles.summaryCard}
            key={item.label}
          >
            <p
              className={
                styles.summaryLabel
              }
            >
              {item.label}
            </p>

            <p
              className={
                styles.summaryValue
              }
            >
              {item.value}
            </p>

            <p
              className={
                styles.summaryDetail
              }
            >
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.tabList}>
          <button
            type="button"
            className={
              activeTab === 'locations'
                ? `${styles.tabButton} ${styles.tabButtonActive}`
                : styles.tabButton
            }
            onClick={() => {
              setActiveTab('locations')
              setSearchTerm('')
            }}
          >
            <span className={styles.tabNumber}>
              01
            </span>

            Location Structure

            <span className={styles.tabCount}>
              {locations.length}
            </span>
          </button>

          <button
            type="button"
            className={
              activeTab === 'scope'
                ? `${styles.tabButton} ${styles.tabButtonActive}`
                : styles.tabButton
            }
            onClick={() => {
              setActiveTab('scope')
              setSearchTerm('')
            }}
          >
            <span className={styles.tabNumber}>
              02
            </span>

            Scope & Quantities

            <span className={styles.tabCount}>
              {scopeItems.length}
            </span>
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <span
              className={styles.searchIcon}
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              className={styles.searchInput}
              placeholder={
                activeTab === 'locations'
                  ? 'Search locations...'
                  : 'Search scope, code, or location...'
              }
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          {activeTab === 'scope' && (
            <>
              <select
                className={
                  styles.filterSelect
                }
                value={floorFilter}
                onChange={(event) =>
                  setFloorFilter(
                    event.target.value
                  )
                }
                aria-label="Filter scope by floor"
              >
                <option value="all">
                  All floors
                </option>

                {floorLocations.map(
                  (floor) => (
                    <option
                      value={floor.id}
                      key={floor.id}
                    >
                      {floor.name}
                    </option>
                  )
                )}
              </select>

              <select
                className={
                  styles.filterSelect
                }
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter scope by status"
              >
                <option value="all">
                  All statuses
                </option>

                {statusOptions.map(
                  (status) => (
                    <option
                      value={status.value}
                      key={status.value}
                    >
                      {status.label}
                    </option>
                  )
                )}
              </select>
            </>
          )}

          <button
            type="button"
            className={styles.primaryButton}
            onClick={
              activeTab === 'locations'
                ? openNewLocationModal
                : openNewScopeModal
            }
            disabled={
              activeTab === 'scope' &&
              locations.length === 0
            }
          >
            {activeTab === 'locations'
              ? '+ Add location'
              : '+ Assign scope'}
          </button>
        </div>

        {errorMessage && (
          <div
            className={
              styles.inlineError
            }
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {activeTab === 'locations' ? (
          <div
            className={
              styles.tableContainer
            }
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Location type</th>
                  <th>Location name</th>
                  <th>Parent location</th>
                  <th>Environment type</th>
                  <th
                    className={
                      styles.actionsHeader
                    }
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLocations.map(
                  (location) => {
                    const parentLocation =
                      location.parent_id
                        ? locationMap.get(
                            location.parent_id
                          )
                        : null

                    const path =
                      locationPathMap.get(
                        location.id
                      ) || []

                    const depth = Math.max(
                      path.length - 1,
                      0
                    )

                    return (
                      <tr key={location.id}>
                        <td
                          className={
                            styles.sequenceCell
                          }
                        >
                          {String(
                            location.sequence_number
                          ).padStart(2, '0')}
                        </td>

                        <td>
                          <span
                            className={`${styles.locationTypeBadge} ${
                              styles[
                                `locationType_${location.location_type}`
                              ] || ''
                            }`}
                          >
                            {getLocationTypeLabel(
                              location.location_type
                            )}
                          </span>
                        </td>

                        <td>
                          <div
                            className={
                              styles.locationNameCell
                            }
                            style={{
                              paddingLeft:
                                `${Math.min(
                                  depth,
                                  4
                                ) * 18}px`,
                            }}
                          >
                            <span
                              className={
                                styles.locationNode
                              }
                            />

                            <strong>
                              {location.name}
                            </strong>
                          </div>
                        </td>

                        <td
                          className={
                            styles.mutedCell
                          }
                        >
                          {parentLocation?.name ||
                            '—'}
                        </td>

                        <td>
                          {location.environment_type ||
                            '—'}
                        </td>

                        <td
                          className={
                            styles.actionsCell
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.tableAction
                            }
                            onClick={() =>
                              openEditLocationModal(
                                location
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`${styles.tableAction} ${styles.deleteAction}`}
                            onClick={() =>
                              deleteLocation(
                                location
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>

            {filteredLocations.length ===
              0 && (
              <div
                className={
                  styles.emptyState
                }
              >
                <h3
                  className={
                    styles.emptyTitle
                  }
                >
                  No locations found.
                </h3>

                <p
                  className={
                    styles.emptyDescription
                  }
                >
                  Add the first project location
                  or adjust the current search.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              styles.tableContainer
            }
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Location path</th>
                  <th>Scope item</th>
                  <th>Code</th>
                  <th
                    className={
                      styles.numericHeader
                    }
                  >
                    Quantity
                  </th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th
                    className={
                      styles.actionsHeader
                    }
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredScopeItems.map(
                  (scopeItem) => {
                    const path =
                      locationPathMap.get(
                        scopeItem.location_id
                      ) || []

                    const location =
                      locationMap.get(
                        scopeItem.location_id
                      )

                    const parentPath = path
                      .slice(0, -1)
                      .map(
                        (pathLocation) =>
                          pathLocation.name
                      )
                      .join(' / ')

                    return (
                      <tr key={scopeItem.id}>
                        <td>
                          <div
                            className={
                              styles.locationPath
                            }
                          >
                            {parentPath && (
                              <span>
                                {parentPath}
                              </span>
                            )}

                            <strong>
                              {location?.name ||
                                'Unknown location'}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {scopeItem.service_name}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              styles.serviceCode
                            }
                          >
                            {scopeItem.service_code ||
                              '—'}
                          </span>
                        </td>

                        <td
                          className={
                            styles.numericCell
                          }
                        >
                          {formatNumber(
                            scopeItem.quantity
                          )}
                        </td>

                        <td>
                          {scopeItem.unit || '—'}
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[
                                `status_${scopeItem.status}`
                              ] || ''
                            }`}
                          >
                            <span
                              className={
                                styles.statusDot
                              }
                            />

                            {getStatusLabel(
                              scopeItem.status
                            )}
                          </span>
                        </td>

                        <td
                          className={
                            styles.actionsCell
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.tableAction
                            }
                            onClick={() =>
                              openEditScopeModal(
                                scopeItem
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`${styles.tableAction} ${styles.deleteAction}`}
                            onClick={() =>
                              deleteScopeItem(
                                scopeItem
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>

            {filteredScopeItems.length ===
              0 && (
              <div
                className={
                  styles.emptyState
                }
              >
                <h3
                  className={
                    styles.emptyTitle
                  }
                >
                  No scope assignments found.
                </h3>

                <p
                  className={
                    styles.emptyDescription
                  }
                >
                  Assign measurable scope to a
                  project location or adjust the
                  current filters.
                </p>
              </div>
            )}
          </div>
        )}

        <div className={styles.tableFooter}>
          <span>
            {activeTab === 'locations'
              ? filteredLocations.length
              : filteredScopeItems.length}{' '}
            records shown
          </span>

          <span>
            Project:{' '}
            {selectedProject.code ||
              selectedProject.name}
          </span>
        </div>
      </section>

      {noticeMessage && (
        <div
          className={styles.notice}
          role="status"
        >
          <span
            className={
              styles.noticeIcon
            }
          >
            ✓
          </span>

          <span>{noticeMessage}</span>

          <button
            type="button"
            className={
              styles.noticeClose
            }
            onClick={() =>
              setNoticeMessage('')
            }
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {isLocationModalOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeLocationModal()
            }
          }}
        >
          <form
            className={styles.modal}
            onSubmit={saveLocation}
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <p
                  className={
                    styles.modalEyebrow
                  }
                >
                  Location structure
                </p>

                <h2
                  className={
                    styles.modalTitle
                  }
                >
                  {locationForm.id
                    ? 'Edit location'
                    : 'Add a new location'}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  closeLocationModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <p
              className={
                styles.modalDescription
              }
            >
              Define the location level and its
              relationship to the physical
              production hierarchy.
            </p>

            <div className={styles.formGrid}>
              <label
                className={
                  styles.formField
                }
              >
                <span>Location type</span>

                <select
                  value={
                    locationForm.location_type
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (currentForm) => ({
                        ...currentForm,
                        location_type:
                          event.target.value,
                      })
                    )
                  }
                >
                  {locationTypeOptions.map(
                    (option) => (
                      <option
                        value={option.value}
                        key={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Location name</span>

                <input
                  type="text"
                  required
                  autoFocus
                  value={locationForm.name}
                  onChange={(event) =>
                    setLocationForm(
                      (currentForm) => ({
                        ...currentForm,
                        name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: East Wing"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Parent location</span>

                <select
                  value={
                    locationForm.parent_id
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (currentForm) => ({
                        ...currentForm,
                        parent_id:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="">
                    No parent location
                  </option>

                  {sortedLocations
                    .filter(
                      (location) =>
                        location.id !==
                        locationForm.id
                    )
                    .map((location) => (
                      <option
                        value={location.id}
                        key={location.id}
                      >
                        {(
                          locationPathMap.get(
                            location.id
                          ) || []
                        )
                          .map(
                            (pathLocation) =>
                              pathLocation.name
                          )
                          .join(' / ')}
                      </option>
                    ))}
                </select>
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Environment type</span>

                <input
                  type="text"
                  value={
                    locationForm.environment_type
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (currentForm) => ({
                        ...currentForm,
                        environment_type:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: Office"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Sequence</span>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    locationForm.sequence_number
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (currentForm) => ({
                        ...currentForm,
                        sequence_number:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>
            </div>

            {errorMessage && (
              <div
                className={
                  styles.modalError
                }
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  closeLocationModal
                }
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={
                  styles.primaryButton
                }
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isScopeModalOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeScopeModal()
            }
          }}
        >
          <form
            className={styles.modal}
            onSubmit={saveScopeItem}
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <p
                  className={
                    styles.modalEyebrow
                  }
                >
                  Scope assignment
                </p>

                <h2
                  className={
                    styles.modalTitle
                  }
                >
                  {scopeForm.id
                    ? 'Edit scope and quantity'
                    : 'Assign scope to location'}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={closeScopeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <p
              className={
                styles.modalDescription
              }
            >
              Connect measurable work to the
              location where production will be
              planned and controlled.
            </p>

            <div className={styles.formGrid}>
              <label
                className={`${styles.formField} ${styles.formFieldFull}`}
              >
                <span>Production location</span>

                <select
                  required
                  value={
                    scopeForm.location_id
                  }
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        location_id:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="">
                    Select a location
                  </option>

                  {sortedLocations.map(
                    (location) => (
                      <option
                        value={location.id}
                        key={location.id}
                      >
                        {(
                          locationPathMap.get(
                            location.id
                          ) || []
                        )
                          .map(
                            (pathLocation) =>
                              pathLocation.name
                          )
                          .join(' / ')}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                className={`${styles.formField} ${styles.formFieldFull}`}
              >
                <span>Scope item</span>

                <input
                  type="text"
                  required
                  autoFocus
                  value={
                    scopeForm.service_name
                  }
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        service_name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: Drywall installation"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Scope code</span>

                <input
                  type="text"
                  value={
                    scopeForm.service_code
                  }
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        service_code:
                          event.target.value.toUpperCase(),
                      })
                    )
                  }
                  placeholder="Example: DWL-201"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Quantity</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    scopeForm.quantity
                  }
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        quantity:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="0"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Unit</span>

                <select
                  value={scopeForm.unit}
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        unit:
                          event.target.value,
                      })
                    )
                  }
                >
                  {unitOptions.map((unit) => (
                    <option
                      value={unit}
                      key={unit}
                    >
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Status</span>

                <select
                  value={
                    scopeForm.status
                  }
                  onChange={(event) =>
                    setScopeForm(
                      (currentForm) => ({
                        ...currentForm,
                        status:
                          event.target.value,
                      })
                    )
                  }
                >
                  {statusOptions.map(
                    (status) => (
                      <option
                        value={status.value}
                        key={status.value}
                      >
                        {status.label}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            {errorMessage && (
              <div
                className={
                  styles.modalError
                }
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={closeScopeModal}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={
                  styles.primaryButton
                }
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save assignment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
