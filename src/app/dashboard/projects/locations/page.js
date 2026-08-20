'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

const emptyServiceForm = {
  service_name: '',
  service_code: '',
  unit: 'SF',
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
    return (
      'A record with the same identifying information ' +
      'already exists.'
    )
  }

  if (error.code === '23503') {
    return (
      'This record is connected to other project ' +
      'information and cannot be changed.'
    )
  }

  if (error.code === '42501') {
    return (
      'Your account does not have permission to ' +
      'perform this action.'
    )
  }

  return (
    error.message ||
    'The requested operation could not be completed.'
  )
}

function normalizeServiceCode(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function createServiceCode(
  serviceName,
  services
) {
  const base =
    normalizeServiceCode(serviceName) ||
    'SERVICE'

  const existingCodes = new Set(
    services.map((service) =>
      String(
        service.service_code || ''
      ).toUpperCase()
    )
  )

  if (!existingCodes.has(base)) {
    return base
  }

  let suffix = 2

  while (
    existingCodes.has(
      `${base}_${suffix}`
    )
  ) {
    suffix += 1
  }

  return `${base}_${suffix}`
}

function getZoneColor(zoneName) {
  if (!zoneName) {
    return '#ffffff'
  }

  const normalized =
    zoneName.trim().toUpperCase()

  const fixedColors = {
    Z1: '#ebf8ff',
    Z2: '#f0fff4',
    Z3: '#fffaf0',
    Z4: '#f5f3ff',
    Z5: '#fff1f2',
    Z6: '#ecfeff',
    Z7: '#fefce8',
    Z8: '#f0fdf4',
    'ZONE 1': '#ebf8ff',
    'ZONE 2': '#f0fff4',
    'ZONE 3': '#fffaf0',
    'ZONE 4': '#f5f3ff',
    'ZONE 5': '#fff1f2',
    'ZONE 6': '#ecfeff',
  }

  if (fixedColors[normalized]) {
    return fixedColors[normalized]
  }

  const palette = [
    '#ebf8ff',
    '#f0fff4',
    '#fffaf0',
    '#f5f3ff',
    '#fff1f2',
    '#ecfeff',
    '#fefce8',
    '#f0fdf4',
    '#fdf4ff',
    '#f8fafc',
  ]

  let hash = 0

  for (
    let index = 0;
    index < normalized.length;
    index += 1
  ) {
    hash =
      normalized.charCodeAt(index) +
      ((hash << 5) - hash)
  }

  return palette[
    Math.abs(hash) % palette.length
  ]
}

export default function LocationBreakdownPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [userId, setUserId] =
    useState(null)

  const [projects, setProjects] =
    useState([])

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null)

  const [locations, setLocations] =
    useState([])

  /*
   * scopeItems remains loaded only as a
   * compatibility/safety reference.
   *
   * The new quantity matrix does not write
   * to scope_items.
   */
  const [scopeItems, setScopeItems] =
    useState([])

  const [
    projectServices,
    setProjectServices,
  ] = useState([])

  const [
    serviceQuantities,
    setServiceQuantities,
  ] = useState([])

  const [
    quantityDrafts,
    setQuantityDrafts,
  ] = useState({})

  const [activeTab, setActiveTab] =
    useState('locations')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [floorFilter, setFloorFilter] =
    useState('all')

  const [
    locationForm,
    setLocationForm,
  ] = useState(emptyLocationForm)

  const [
    serviceForm,
    setServiceForm,
  ] = useState(emptyServiceForm)

  const [
    serviceCodeWasEdited,
    setServiceCodeWasEdited,
  ] = useState(false)

  const [
    isLocationModalOpen,
    setIsLocationModalOpen,
  ] = useState(false)

  const [
    isServiceModalOpen,
    setIsServiceModalOpen,
  ] = useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSaving, setIsSaving] =
    useState(false)

  const [
    savingCellKey,
    setSavingCellKey,
  ] = useState(null)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState('')

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

      if (
        userError ||
        !userData?.user
      ) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        )

        setIsLoading(false)
        return
      }

      setUserId(
        userData.user.id
      )

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
        .neq(
          'status',
          'archived'
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )

      if (projectsError) {
        setErrorMessage(
          getErrorMessage(
            projectsError
          )
        )

        setIsLoading(false)
        return
      }

      const availableProjects =
        projectsData || []

      setProjects(
        availableProjects
      )

      if (!selectedProjectId) {
        setSelectedProject(null)
        setLocations([])
        setScopeItems([])
        setProjectServices([])
        setServiceQuantities([])
        setQuantityDrafts({})
        setIsLoading(false)
        return
      }

      const activeProject =
        availableProjects.find(
          (project) =>
            project.id ===
            selectedProjectId
        )

      if (!activeProject) {
        setErrorMessage(
          'The selected project does not exist or your account cannot access it.'
        )

        setSelectedProject(null)
        setIsLoading(false)
        return
      }

      setSelectedProject(
        activeProject
      )

      const [
        locationsResult,
        scopeItemsResult,
        servicesResult,
        quantitiesResult,
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
          ),

        supabase
          .from('project_services')
          .select(`
            id,
            project_id,
            service_code,
            service_name,
            unit,
            sequence_number,
            is_active,
            created_at,
            updated_at
          `)
          .eq(
            'project_id',
            selectedProjectId
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
            quantity,
            source_scope_item_id,
            created_at,
            updated_at
          `)
          .eq(
            'project_id',
            selectedProjectId
          ),
      ])

      const workspaceError =
        locationsResult.error ||
        scopeItemsResult.error ||
        servicesResult.error ||
        quantitiesResult.error

      if (workspaceError) {
        setErrorMessage(
          getErrorMessage(
            workspaceError
          )
        )

        setIsLoading(false)
        return
      }

      const loadedQuantities =
        quantitiesResult.data || []

      setLocations(
        locationsResult.data || []
      )

      setScopeItems(
        scopeItemsResult.data || []
      )

      setProjectServices(
        servicesResult.data || []
      )

      setServiceQuantities(
        loadedQuantities
      )

      const nextDrafts = {}

      loadedQuantities.forEach(
        (quantityItem) => {
          const key =
            `${quantityItem.location_id}___${quantityItem.service_id}`

          nextDrafts[key] =
            quantityItem.quantity ===
              null ||
            quantityItem.quantity ===
              undefined
              ? ''
              : String(
                  quantityItem.quantity
                )
        }
      )

      setQuantityDrafts(
        nextDrafts
      )

      setIsLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const locationMap =
    useMemo(() => {
      return new Map(
        locations.map(
          (location) => [
            location.id,
            location,
          ]
        )
      )
    }, [locations])

  const locationPathMap =
    useMemo(() => {
      const pathMap =
        new Map()

      function buildPath(
        location
      ) {
        if (!location) {
          return []
        }

        if (
          pathMap.has(
            location.id
          )
        ) {
          return pathMap.get(
            location.id
          )
        }

        const path = []
        const visitedIds =
          new Set()

        let currentLocation =
          location

        while (
          currentLocation &&
          !visitedIds.has(
            currentLocation.id
          )
        ) {
          visitedIds.add(
            currentLocation.id
          )

          path.unshift(
            currentLocation
          )

          currentLocation =
            currentLocation.parent_id
              ? locationMap.get(
                  currentLocation.parent_id
                )
              : null
        }

        pathMap.set(
          location.id,
          path
        )

        return path
      }

      locations.forEach(
        (location) => {
          buildPath(
            location
          )
        }
      )

      return pathMap
    }, [
      locations,
      locationMap,
    ])

  const sortedLocations =
    useMemo(() => {
      return [
        ...locations,
      ].sort(
        (
          firstLocation,
          secondLocation
        ) => {
          if (
            Number(
              firstLocation.sequence_number
            ) !==
            Number(
              secondLocation.sequence_number
            )
          ) {
            return (
              Number(
                firstLocation.sequence_number
              ) -
              Number(
                secondLocation.sequence_number
              )
            )
          }

          return firstLocation.name.localeCompare(
            secondLocation.name
          )
        }
      )
    }, [locations])

  const floorLocations =
    useMemo(() => {
      return sortedLocations.filter(
        (location) =>
          location.location_type ===
          'floor'
      )
    }, [sortedLocations])

  const areaCount =
    useMemo(() => {
      return locations.filter(
        (location) =>
          location.location_type ===
            'area' ||
          location.location_type ===
            'room'
      ).length
    }, [locations])

  const zoneCount =
    useMemo(() => {
      return locations.filter(
        (location) =>
          location.location_type ===
          'zone'
      ).length
    }, [locations])

  const filteredLocations =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

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

          const searchableText =
            [
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

  const matrixLocations =
    useMemo(() => {
      const candidates =
        sortedLocations.filter(
          (location) =>
            location.location_type ===
              'area' ||
            location.location_type ===
              'room' ||
            location.location_type ===
              'custom'
        )

      /*
       * If the project currently has no
       * Area / Room / Custom locations,
       * fall back to leaf locations so
       * the matrix is still usable.
       */
      const sourceLocations =
        candidates.length > 0
          ? candidates
          : sortedLocations.filter(
              (location) =>
                !locations.some(
                  (candidate) =>
                    candidate.parent_id ===
                    location.id
                )
            )

      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

      return sourceLocations.filter(
        (location) => {
          const path =
            locationPathMap.get(
              location.id
            ) || []

          const floor =
            path.find(
              (pathLocation) =>
                pathLocation.location_type ===
                'floor'
            )

          const searchableText =
            [
              location.name,
              location.environment_type,
              ...path.map(
                (pathLocation) =>
                  pathLocation.name
              ),
              ...projectServices.map(
                (service) =>
                  service.service_name
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
            floor?.id ===
              floorFilter

          return (
            matchesSearch &&
            matchesFloor
          )
        }
      )
    }, [
      floorFilter,
      locationPathMap,
      locations,
      projectServices,
      searchTerm,
      sortedLocations,
    ])

  const quantityMap =
    useMemo(() => {
      const map =
        new Map()

      serviceQuantities.forEach(
        (quantityItem) => {
          map.set(
            `${quantityItem.location_id}___${quantityItem.service_id}`,
            quantityItem
          )
        }
      )

      return map
    }, [serviceQuantities])

  function changeProject(
    projectId
  ) {
    window.location.href =
      `/dashboard/projects/locations?projectId=${projectId}`
  }

  function openNewLocationModal() {
    const nextSequence =
      locations.reduce(
        (
          largestSequence,
          location
        ) =>
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
      sequence_number:
        String(nextSequence),
    })

    setErrorMessage('')
    setIsLocationModalOpen(
      true
    )
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
        location.parent_id ||
        '',
      environment_type:
        location.environment_type ||
        '',
      sequence_number:
        String(
          location.sequence_number
        ),
    })

    setErrorMessage('')
    setIsLocationModalOpen(
      true
    )
  }

  function closeLocationModal() {
    if (isSaving) {
      return
    }

    setIsLocationModalOpen(
      false
    )

    setLocationForm(
      emptyLocationForm
    )
  }

  function openServiceModal() {
    setServiceForm(
      emptyServiceForm
    )

    setServiceCodeWasEdited(
      false
    )

    setErrorMessage('')
    setIsServiceModalOpen(
      true
    )
  }

  function closeServiceModal() {
    if (isSaving) {
      return
    }

    setIsServiceModalOpen(
      false
    )

    setServiceForm(
      emptyServiceForm
    )

    setServiceCodeWasEdited(
      false
    )
  }

  async function saveLocation(
    event
  ) {
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

      name:
        normalizedName,

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
      operationResult =
        await supabase
          .from('locations')
          .update(
            locationPayload
          )
          .eq(
            'id',
            locationForm.id
          )
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
      operationResult =
        await supabase
          .from('locations')
          .insert({
            ...locationPayload,
            created_by:
              userId,
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

    if (
      operationResult.error
    ) {
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
              operationResult
                .data.id
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
    setIsLocationModalOpen(
      false
    )
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

    const hasLegacyScopeItems =
      scopeItems.some(
        (scopeItem) =>
          scopeItem.location_id ===
          location.id
      )

    const hasMatrixQuantities =
      serviceQuantities.some(
        (quantityItem) =>
          quantityItem.location_id ===
          location.id
      )

    if (
      hasChildLocations ||
      hasLegacyScopeItems ||
      hasMatrixQuantities
    ) {
      setNoticeMessage(
        `Cannot delete ${location.name}. Remove its child locations and assigned quantities first.`
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

    const { error } =
      await supabase
        .from('locations')
        .delete()
        .eq(
          'id',
          location.id
        )
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

  async function saveService(
    event
  ) {
    event.preventDefault()

    if (
      !selectedProject ||
      !userId
    ) {
      return
    }

    const normalizedName =
      serviceForm.service_name.trim()

    if (!normalizedName) {
      setErrorMessage(
        'Enter a service name.'
      )
      return
    }

    let normalizedCode =
      normalizeServiceCode(
        serviceForm.service_code
      )

    if (!normalizedCode) {
      normalizedCode =
        createServiceCode(
          normalizedName,
          projectServices
        )
    }

    const duplicateName =
      projectServices.some(
        (service) =>
          service.service_name
            .trim()
            .toLowerCase() ===
          normalizedName
            .toLowerCase()
      )

    if (duplicateName) {
      setErrorMessage(
        'A service with this name already exists in the project.'
      )
      return
    }

    const duplicateCode =
      projectServices.some(
        (service) =>
          String(
            service.service_code
          ).toUpperCase() ===
          normalizedCode
      )

    if (duplicateCode) {
      setErrorMessage(
        'A service with this code already exists in the project.'
      )
      return
    }

    const nextSequence =
      projectServices.reduce(
        (
          largestSequence,
          service
        ) =>
          Math.max(
            largestSequence,
            Number(
              service.sequence_number
            ) || 0
          ),
        -1
      ) + 1

    setIsSaving(true)
    setErrorMessage('')

    const {
      data,
      error,
    } = await supabase
      .from(
        'project_services'
      )
      .insert({
        project_id:
          selectedProject.id,

        service_code:
          normalizedCode,

        service_name:
          normalizedName,

        unit:
          serviceForm.unit ||
          null,

        sequence_number:
          nextSequence,

        is_active: true,

        created_by:
          userId,
      })
      .select(`
        id,
        project_id,
        service_code,
        service_name,
        unit,
        sequence_number,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      setErrorMessage(
        getErrorMessage(error)
      )

      setIsSaving(false)
      return
    }

    setProjectServices(
      (currentServices) => [
        ...currentServices,
        data,
      ]
    )

    setNoticeMessage(
      `${data.service_name} was added as a new quantity column.`
    )

    setIsSaving(false)
    setIsServiceModalOpen(
      false
    )
    setServiceForm(
      emptyServiceForm
    )
    setServiceCodeWasEdited(
      false
    )
  }

  async function saveQuantity(
    locationId,
    serviceId
  ) {
    if (
      !selectedProject ||
      !userId
    ) {
      return
    }

    const key =
      `${locationId}___${serviceId}`

    const rawValue =
      quantityDrafts[key] ??
      ''

    const normalizedText =
      String(
        rawValue
      ).trim()

    const existingRecord =
      quantityMap.get(key)

    if (
      normalizedText === ''
    ) {
      if (!existingRecord) {
        return
      }

      setSavingCellKey(key)
      setErrorMessage('')

      const { error } =
        await supabase
          .from(
            'location_service_quantities'
          )
          .delete()
          .eq(
            'id',
            existingRecord.id
          )
          .eq(
            'project_id',
            selectedProject.id
          )

      if (error) {
        setErrorMessage(
          getErrorMessage(error)
        )

        setQuantityDrafts(
          (currentDrafts) => ({
            ...currentDrafts,
            [key]:
              existingRecord.quantity ===
                null
                ? ''
                : String(
                    existingRecord.quantity
                  ),
          })
        )

        setSavingCellKey(null)
        return
      }

      setServiceQuantities(
        (currentQuantities) =>
          currentQuantities.filter(
            (quantityItem) =>
              quantityItem.id !==
              existingRecord.id
          )
      )

      setSavingCellKey(null)
      return
    }

    const numericValue =
      Number(
        normalizedText.replace(
          ',',
          '.'
        )
      )

    if (
      Number.isNaN(
        numericValue
      ) ||
      numericValue < 0
    ) {
      setErrorMessage(
        'Enter a valid quantity greater than or equal to zero.'
      )

      if (existingRecord) {
        setQuantityDrafts(
          (currentDrafts) => ({
            ...currentDrafts,
            [key]:
              String(
                existingRecord.quantity ??
                  ''
              ),
          })
        )
      } else {
        setQuantityDrafts(
          (currentDrafts) => ({
            ...currentDrafts,
            [key]: '',
          })
        )
      }

      return
    }

    /*
     * Avoid an unnecessary database update
     * when the cell value did not change.
     */
    if (
      existingRecord &&
      Number(
        existingRecord.quantity
      ) === numericValue
    ) {
      return
    }

    setSavingCellKey(key)
    setErrorMessage('')

    if (existingRecord) {
      const {
        data,
        error,
      } = await supabase
        .from(
          'location_service_quantities'
        )
        .update({
          quantity:
            numericValue,
        })
        .eq(
          'id',
          existingRecord.id
        )
        .eq(
          'project_id',
          selectedProject.id
        )
        .select(`
          id,
          project_id,
          location_id,
          service_id,
          quantity,
          source_scope_item_id,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        setErrorMessage(
          getErrorMessage(error)
        )

        setQuantityDrafts(
          (currentDrafts) => ({
            ...currentDrafts,
            [key]:
              String(
                existingRecord.quantity ??
                  ''
              ),
          })
        )

        setSavingCellKey(null)
        return
      }

      setServiceQuantities(
        (currentQuantities) =>
          currentQuantities.map(
            (quantityItem) =>
              quantityItem.id ===
              data.id
                ? data
                : quantityItem
          )
      )

      setQuantityDrafts(
        (currentDrafts) => ({
          ...currentDrafts,
          [key]:
            String(
              data.quantity
            ),
        })
      )

      setSavingCellKey(null)
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        'location_service_quantities'
      )
      .insert({
        project_id:
          selectedProject.id,

        location_id:
          locationId,

        service_id:
          serviceId,

        quantity:
          numericValue,

        created_by:
          userId,
      })
      .select(`
        id,
        project_id,
        location_id,
        service_id,
        quantity,
        source_scope_item_id,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      setErrorMessage(
        getErrorMessage(error)
      )

      setQuantityDrafts(
        (currentDrafts) => ({
          ...currentDrafts,
          [key]: '',
        })
      )

      setSavingCellKey(null)
      return
    }

    setServiceQuantities(
      (currentQuantities) => [
        ...currentQuantities,
        data,
      ]
    )

    setQuantityDrafts(
      (currentDrafts) => ({
        ...currentDrafts,
        [key]:
          String(
            data.quantity
          ),
      })
    )

    setSavingCellKey(null)
  }

  if (isLoading) {
    return (
      <div
        className={
          styles.loadingState
        }
      >
        <span
          className={
            styles.loadingSpinner
          }
        />

        <p>
          Loading location workspace...
        </p>
      </div>
    )
  }

  if (
    errorMessage &&
    projects.length === 0
  ) {
    return (
      <div
        className={
          styles.errorState
        }
      >
        <h1
          className={
            styles.errorTitle
          }
        >
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
          className={
            styles.primaryButton
          }
          onClick={
            loadWorkspace
          }
        >
          Try again
        </button>
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div
        className={
          styles.container
        }
      >
        <section
          className={
            styles.heading
          }
        >
          <div
            className={
              styles.headingContent
            }
          >
            <p
              className={
                styles.eyebrow
              }
            >
              Location-based planning
            </p>

            <h1
              className={
                styles.title
              }
            >
              Location & Scope Workspace
            </h1>

            <p
              className={
                styles.description
              }
            >
              Select a project to define its
              location breakdown structure,
              services, and measurable
              quantities.
            </p>
          </div>

          <Link
            href="/dashboard/projects"
            className={
              styles.backLink
            }
          >
            ← Back to projects
          </Link>
        </section>

        <article
          className={
            styles.panel
          }
        >
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
                Every project has an
                independent location and
                production scope structure.
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

          {projects.length ===
          0 ? (
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
                Create a project before
                defining its location
                breakdown structure.
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
              {projects.map(
                (project) => (
                  <button
                    type="button"
                    className={
                      styles.projectCard
                    }
                    onClick={() =>
                      changeProject(
                        project.id
                      )
                    }
                    key={
                      project.id
                    }
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
                )
              )}
            </div>
          )}
        </article>
      </div>
    )
  }

  const summaryItems = [
    {
      label: 'Floors',
      value:
        floorLocations.length,
      detail:
        'Building levels',
    },
    {
      label: 'Zones',
      value: zoneCount,
      detail:
        'Production subdivisions',
    },
    {
      label: 'Areas and rooms',
      value: areaCount,
      detail:
        'Assignable locations',
    },
    {
      label: 'Services',
      value:
        projectServices.length,
      detail:
        'Dynamic quantity columns',
    },
  ]

  return (
    <div
      className={
        styles.container
      }
    >
      <section
        className={
          styles.heading
        }
      >
        <div
          className={
            styles.headingContent
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            Location-based planning
            foundation
          </p>

          <h1
            className={
              styles.title
            }
          >
            Location & Scope Workspace
          </h1>

          <p
            className={
              styles.description
            }
          >
            Build the physical production
            hierarchy first, then quantify
            each service across the locations
            where production will be planned
            and controlled.
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
            value={
              selectedProject.id
            }
            onChange={(
              event
            ) =>
              changeProject(
                event.target.value
              )
            }
          >
            {projects.map(
              (project) => (
                <option
                  value={
                    project.id
                  }
                  key={
                    project.id
                  }
                >
                  {project.code ||
                    'Unassigned'}{' '}
                  · {project.name}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Location summary"
      >
        {summaryItems.map(
          (item) => (
            <article
              className={
                styles.summaryCard
              }
              key={
                item.label
              }
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
          )
        )}
      </section>

      <section
        className={
          styles.panel
        }
      >
        <div
          className={
            styles.tabList
          }
        >
          <button
            type="button"
            className={
              activeTab ===
              'locations'
                ? `${styles.tabButton} ${styles.tabButtonActive}`
                : styles.tabButton
            }
            onClick={() => {
              setActiveTab(
                'locations'
              )
              setSearchTerm('')
            }}
          >
            <span
              className={
                styles.tabNumber
              }
            >
              01
            </span>

            Location Structure

            <span
              className={
                styles.tabCount
              }
            >
              {locations.length}
            </span>
          </button>

          <button
            type="button"
            className={
              activeTab ===
              'scope'
                ? `${styles.tabButton} ${styles.tabButtonActive}`
                : styles.tabButton
            }
            onClick={() => {
              setActiveTab(
                'scope'
              )
              setSearchTerm('')
            }}
          >
            <span
              className={
                styles.tabNumber
              }
            >
              02
            </span>

            Scope & Quantities

            <span
              className={
                styles.tabCount
              }
            >
              {
                projectServices.length
              }
            </span>
          </button>
        </div>

        <div
          className={
            styles.toolbar
          }
        >
          <div
            className={
              styles.searchField
            }
          >
            <span
              className={
                styles.searchIcon
              }
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              className={
                styles.searchInput
              }
              placeholder={
                activeTab ===
                'locations'
                  ? 'Search locations...'
                  : 'Search locations or services...'
              }
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          {activeTab ===
            'scope' && (
            <select
              className={
                styles.filterSelect
              }
              value={
                floorFilter
              }
              onChange={(
                event
              ) =>
                setFloorFilter(
                  event.target.value
                )
              }
              aria-label="Filter matrix by floor"
            >
              <option value="all">
                All divisions
              </option>

              {floorLocations.map(
                (floor) => (
                  <option
                    value={
                      floor.id
                    }
                    key={
                      floor.id
                    }
                  >
                    {floor.name}
                  </option>
                )
              )}
            </select>
          )}

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              activeTab ===
              'locations'
                ? openNewLocationModal
                : openServiceModal
            }
            disabled={
              activeTab ===
                'scope' &&
              locations.length ===
                0
            }
          >
            {activeTab ===
            'locations'
              ? '+ Add location'
              : '+ Add service'}
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

        {activeTab ===
        'locations' ? (
          <div
            className={
              styles.tableContainer
            }
          >
            <table
              className={
                styles.table
              }
            >
              <thead>
                <tr>
                  <th>
                    Sequence
                  </th>

                  <th>
                    Location type
                  </th>

                  <th>
                    Location name
                  </th>

                  <th>
                    Parent location
                  </th>

                  <th>
                    Environment type
                  </th>

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
                  (
                    location
                  ) => {
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

                    const depth =
                      Math.max(
                        path.length -
                          1,
                        0
                      )

                    return (
                      <tr
                        key={
                          location.id
                        }
                      >
                        <td
                          className={
                            styles.sequenceCell
                          }
                        >
                          {String(
                            location.sequence_number
                          ).padStart(
                            2,
                            '0'
                          )}
                        </td>

                        <td>
                          <span
                            className={`${styles.locationTypeBadge} ${
                              styles[
                                `locationType_${location.location_type}`
                              ] ||
                              ''
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
                              {
                                location.name
                              }
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
                  Add the first project
                  location or adjust the
                  current search.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              styles.tableContainer
            }
            style={{
              overflowX: 'auto',
              maxHeight: '520px',
              overflowY: 'auto',
            }}
          >
            <table
              className={
                styles.table
              }
              style={{
                width: 'max-content',
                minWidth: '100%',
                borderCollapse:
                  'separate',
                borderSpacing: 0,
              }}
            >
              <thead
                style={{
                  position:
                    'sticky',
                  top: 0,
                  zIndex: 20,
                }}
              >
                <tr>
                  <th
                    style={{
                      minWidth:
                        '200px',
                      position:
                        'sticky',
                      left: 0,
                      zIndex: 25,
                      background:
                        '#2a4365',
                    }}
                  >
                    LOCATION
                  </th>

                  <th
                    style={{
                      minWidth:
                        '120px',
                    }}
                  >
                    TYPE
                  </th>

                  <th
                    style={{
                      minWidth:
                        '110px',
                    }}
                  >
                    DIVISION
                  </th>

                  <th
                    style={{
                      minWidth:
                        '125px',
                    }}
                  >
                    SUBDIVISION
                  </th>

                  {projectServices.map(
                    (
                      service
                    ) => (
                      <th
                        key={
                          service.id
                        }
                        style={{
                          minWidth:
                            '135px',
                          maxWidth:
                            '165px',
                          textAlign:
                            'center',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            flexDirection:
                              'column',
                            gap: '3px',
                            alignItems:
                              'center',
                          }}
                        >
                          <span>
                            {service.service_name.toUpperCase()}
                          </span>

                          {service.unit && (
                            <span
                              style={{
                                fontSize:
                                  '0.68rem',
                                opacity:
                                  0.72,
                                fontWeight:
                                  500,
                              }}
                            >
                              {
                                service.unit
                              }
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {matrixLocations.map(
                  (
                    location
                  ) => {
                    const path =
                      locationPathMap.get(
                        location.id
                      ) || []

                    const floor =
                      path.find(
                        (
                          pathLocation
                        ) =>
                          pathLocation.location_type ===
                          'floor'
                      )

                    const zone =
                      path.find(
                        (
                          pathLocation
                        ) =>
                          pathLocation.location_type ===
                          'zone'
                      )

                    const rowColor =
                      getZoneColor(
                        zone?.name
                      )

                    return (
                      <tr
                        key={
                          location.id
                        }
                        style={{
                          backgroundColor:
                            rowColor,
                        }}
                      >
                        <td
                          style={{
                            minWidth:
                              '200px',
                            position:
                              'sticky',
                            left: 0,
                            zIndex: 10,
                            backgroundColor:
                              rowColor,
                            fontWeight:
                              700,
                            borderRight:
                              '1px solid #cbd5e0',
                          }}
                        >
                          {
                            location.name
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center',
                            backgroundColor:
                              rowColor,
                          }}
                        >
                          <span
                            className={
                              styles.locationTypeBadge
                            }
                          >
                            {location.environment_type ||
                              getLocationTypeLabel(
                                location.location_type
                              )}
                          </span>
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center',
                            backgroundColor:
                              rowColor,
                          }}
                        >
                          {floor?.name ||
                            '—'}
                        </td>

                        <td
                          style={{
                            textAlign:
                              'center',
                            fontWeight:
                              700,
                            backgroundColor:
                              rowColor,
                          }}
                        >
                          {zone?.name ||
                            '—'}
                        </td>

                        {projectServices.map(
                          (
                            service
                          ) => {
                            const cellKey =
                              `${location.id}___${service.id}`

                            const value =
                              quantityDrafts[
                                cellKey
                              ] ?? ''

                            const isCellSaving =
                              savingCellKey ===
                              cellKey

                            return (
                              <td
                                key={
                                  service.id
                                }
                                style={{
                                  minWidth:
                                    '135px',
                                  textAlign:
                                    'center',
                                  backgroundColor:
                                    rowColor,
                                }}
                              >
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={
                                    value
                                  }
                                  onChange={(
                                    event
                                  ) => {
                                    const nextValue =
                                      event
                                        .target
                                        .value

                                    setQuantityDrafts(
                                      (
                                        currentDrafts
                                      ) => ({
                                        ...currentDrafts,
                                        [cellKey]:
                                          nextValue,
                                      })
                                    )
                                  }}
                                  onBlur={() =>
                                    saveQuantity(
                                      location.id,
                                      service.id
                                    )
                                  }
                                  onKeyDown={(
                                    event
                                  ) => {
                                    if (
                                      event.key ===
                                      'Enter'
                                    ) {
                                      event.currentTarget.blur()
                                    }
                                  }}
                                  disabled={
                                    isCellSaving
                                  }
                                  aria-label={`Quantity of ${service.service_name} at ${location.name}`}
                                  style={{
                                    width:
                                      '88px',
                                    maxWidth:
                                      '100%',
                                    padding:
                                      '7px 8px',
                                    textAlign:
                                      'center',
                                    backgroundColor:
                                      isCellSaving
                                        ? '#edf2f7'
                                        : '#ffffff',
                                    border:
                                      '1px solid #cbd5e0',
                                    borderRadius:
                                      '6px',
                                    fontSize:
                                      '0.84rem',
                                    outline:
                                      'none',
                                  }}
                                />
                              </td>
                            )
                          }
                        )}
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>

            {matrixLocations.length ===
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
                  No production locations
                  found.
                </h3>

                <p
                  className={
                    styles.emptyDescription
                  }
                >
                  Add Area or Room
                  locations to build the
                  quantity matrix.
                </p>
              </div>
            )}

            {matrixLocations.length >
              0 &&
              projectServices.length ===
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
                    No services have been
                    added.
                  </h3>

                  <p
                    className={
                      styles.emptyDescription
                    }
                  >
                    Click Add service to
                    create the first dynamic
                    quantity column.
                  </p>
                </div>
              )}
          </div>
        )}

        <div
          className={
            styles.tableFooter
          }
        >
          <span>
            {activeTab ===
            'locations'
              ? filteredLocations.length
              : matrixLocations.length}{' '}
            {activeTab ===
            'locations'
              ? 'records shown'
              : 'locations shown'}
          </span>

          {activeTab ===
            'scope' && (
            <span>
              {
                projectServices.length
              }{' '}
              {projectServices.length ===
              1
                ? 'service column'
                : 'service columns'}
            </span>
          )}

          <span>
            Project:{' '}
            {selectedProject.code ||
              selectedProject.name}
          </span>
        </div>
      </section>

      {noticeMessage && (
        <div
          className={
            styles.notice
          }
          role="status"
        >
          <span
            className={
              styles.noticeIcon
            }
          >
            ✓
          </span>

          <span>
            {noticeMessage}
          </span>

          <button
            type="button"
            className={
              styles.noticeClose
            }
            onClick={() =>
              setNoticeMessage(
                ''
              )
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
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeLocationModal()
            }
          }}
        >
          <form
            className={
              styles.modal
            }
            onSubmit={
              saveLocation
            }
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
              Define the location level and
              its relationship to the physical
              production hierarchy.
            </p>

            <div
              className={
                styles.formGrid
              }
            >
              <label
                className={
                  styles.formField
                }
              >
                <span>
                  Location type
                </span>

                <select
                  value={
                    locationForm.location_type
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        location_type:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  {locationTypeOptions.map(
                    (
                      option
                    ) => (
                      <option
                        value={
                          option.value
                        }
                        key={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
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
                <span>
                  Location name
                </span>

                <input
                  type="text"
                  required
                  autoFocus
                  value={
                    locationForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        name:
                          event.target
                            .value,
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
                <span>
                  Parent location
                </span>

                <select
                  value={
                    locationForm.parent_id
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        parent_id:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="">
                    No parent location
                  </option>

                  {sortedLocations
                    .filter(
                      (
                        location
                      ) =>
                        location.id !==
                        locationForm.id
                    )
                    .map(
                      (
                        location
                      ) => (
                        <option
                          value={
                            location.id
                          }
                          key={
                            location.id
                          }
                        >
                          {(
                            locationPathMap.get(
                              location.id
                            ) || []
                          )
                            .map(
                              (
                                pathLocation
                              ) =>
                                pathLocation.name
                            )
                            .join(
                              ' / '
                            )}
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
                <span>
                  Environment type
                </span>

                <input
                  type="text"
                  value={
                    locationForm.environment_type
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        environment_type:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Example: Internal"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>
                  Sequence
                </span>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    locationForm.sequence_number
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        sequence_number:
                          event.target
                            .value,
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
                {
                  errorMessage
                }
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
                disabled={
                  isSaving
                }
              >
                Cancel
              </button>

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
                  : 'Save location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isServiceModalOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeServiceModal()
            }
          }}
        >
          <form
            className={
              styles.modal
            }
            onSubmit={
              saveService
            }
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
                  Production scope
                </p>

                <h2
                  className={
                    styles.modalTitle
                  }
                >
                  Add service column
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  closeServiceModal
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
              Create a service once and use it
              as a quantity column across every
              production location in the
              project.
            </p>

            <div
              className={
                styles.formGrid
              }
            >
              <label
                className={`${styles.formField} ${styles.formFieldFull}`}
              >
                <span>
                  Service name
                </span>

                <input
                  type="text"
                  required
                  autoFocus
                  value={
                    serviceForm.service_name
                  }
                  onChange={(
                    event
                  ) => {
                    const nextName =
                      event.target
                        .value

                    setServiceForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        service_name:
                          nextName,

                        service_code:
                          serviceCodeWasEdited
                            ? currentForm.service_code
                            : createServiceCode(
                                nextName,
                                projectServices
                              ),
                      })
                    )
                  }}
                  placeholder="Example: Drywall"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>
                  Service code
                </span>

                <input
                  type="text"
                  value={
                    serviceForm.service_code
                  }
                  onChange={(
                    event
                  ) => {
                    setServiceCodeWasEdited(
                      true
                    )

                    setServiceForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        service_code:
                          normalizeServiceCode(
                            event.target
                              .value
                          ),
                      })
                    )
                  }}
                  placeholder="Example: DRYWALL"
                />
              </label>

              <label
                className={
                  styles.formField
                }
              >
                <span>Unit</span>

                <select
                  value={
                    serviceForm.unit
                  }
                  onChange={(
                    event
                  ) =>
                    setServiceForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        unit:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  {unitOptions.map(
                    (unit) => (
                      <option
                        value={
                          unit
                        }
                        key={
                          unit
                        }
                      >
                        {unit}
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
                {
                  errorMessage
                }
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
                  closeServiceModal
                }
                disabled={
                  isSaving
                }
              >
                Cancel
              </button>

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
                  ? 'Adding...'
                  : 'Add service'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
