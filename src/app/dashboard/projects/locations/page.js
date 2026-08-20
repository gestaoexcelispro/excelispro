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
  'LB',
  'TON',
  'GAL',
  'LS',
]

const emptyLocationForm = {
  id: null,
  name: '',
  location_type: 'area',
  parent_id: '',
  environment_type: '',
  sequence_number: 0,
}

const emptyScopeForm = {
  id: null,
  location_id: '',
  service_code: '',
  service_name: '',
  quantity: '',
  unit: 'SF',
  status: 'planned',
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
      (option) => option.value === locationType
    )?.label || locationType
  )
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

function getErrorMessage(error) {
  if (!error) {
    return 'An unexpected error occurred.'
  }

  if (error.code === '23505') {
    return 'A record with the same name or code already exists.'
  }

  if (error.code === '23503') {
    return 'This record is connected to other project information.'
  }

  return (
    error.message ||
    'The operation could not be completed.'
  )
}

export default function LocationBreakdownPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [userId, setUserId] = useState(null)
  const [projectId, setProjectId] = useState(null)
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

  const [locationModalOpen, setLocationModalOpen] =
    useState(false)

  const [scopeModalOpen, setScopeModalOpen] =
    useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [notification, setNotification] =
    useState('')

  const loadWorkspace = useCallback(
    async (requestedProjectId) => {
      setLoading(true)
      setErrorMessage('')

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        )
        setLoading(false)
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
        setLoading(false)
        return
      }

      const availableProjects =
        projectsData || []

      setProjects(availableProjects)

      if (!requestedProjectId) {
        setSelectedProject(null)
        setLocations([])
        setScopeItems([])
        setLoading(false)
        return
      }

      const project =
        availableProjects.find(
          (item) =>
            item.id === requestedProjectId
        ) || null

      if (!project) {
        setSelectedProject(null)
        setLocations([])
        setScopeItems([])
        setErrorMessage(
          'The requested project does not exist or your account cannot access it.'
        )
        setLoading(false)
        return
      }

      setSelectedProject(project)

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
            requestedProjectId
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
            requestedProjectId
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
      }

      setLocations(
        locationsResult.data || []
      )

      setScopeItems(
       
