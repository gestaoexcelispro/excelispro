import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server'
import styles from './location-breakdown.module.css'

export const dynamic = 'force-dynamic'

const locationTypeLabels = {
  phase: 'Phase',
  building: 'Building',
  zone: 'Zone',
  floor: 'Floor',
  area: 'Area',
  room: 'Room',
  custom: 'Custom location',
}

function getLocationIcon(locationType) {
  const icons = {
    phase: 'PH',
    building: 'BL',
    zone: 'ZN',
    floor: 'FL',
    area: 'AR',
    room: 'RM',
    custom: 'LC',
  }

  return icons[locationType] || 'LC'
}

function getLocationIconClass(locationType) {
  if (locationType === 'zone') {
    return `${styles.locationIcon} ${styles.zoneIcon}`
  }

  if (
    locationType === 'area' ||
    locationType === 'room'
  ) {
    return `${styles.locationIcon} ${styles.areaIcon}`
  }

  return styles.locationIcon
}

function createScopeCountMap(scopeItems) {
  return scopeItems.reduce(
    (countMap, scopeItem) => {
      const currentCount =
        countMap.get(
          scopeItem.location_id
        ) || 0

      countMap.set(
        scopeItem.location_id,
        currentCount + 1
      )

      return countMap
    },
    new Map()
  )
}

function createChildrenMap(locations) {
  const childrenMap = new Map()

  locations.forEach((location) => {
    const parentKey =
      location.parent_id || 'root'

    const currentChildren =
      childrenMap.get(parentKey) || []

    currentChildren.push(location)

    childrenMap.set(
      parentKey,
      currentChildren
    )
  })

  childrenMap.forEach((children) => {
    children.sort((first, second) => {
      if (
        first.sequence_number !==
        second.sequence_number
      ) {
        return (
          first.sequence_number -
          second.sequence_number
        )
      }

      return first.name.localeCompare(
        second.name
      )
    })
  })

  return childrenMap
}

export default async function LocationBreakdownPage({
  searchParams,
}) {
  const resolvedSearchParams =
    await searchParams

  const rawProjectId =
    resolvedSearchParams?.projectId

  const projectId = Array.isArray(
    rawProjectId
  )
    ? rawProjectId[0]
    : rawProjectId

  const supabase = await createClient()

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
      status
    `)
    .neq('status', 'archived')
    .order('created_at', {
      ascending: false,
    })

  const projects = projectsData || []

  if (projectsError) {
    console.error(
      'Projects could not be loaded for the location breakdown.',
      projectsError
    )
  }

  if (!projectId) {
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
              Location Breakdown
            </h1>

            <p
              className={
                styles.description
              }
            >
              Select a project to review its
              physical production hierarchy from
              floors and zones to areas and
              rooms.
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
                The location hierarchy is
                configured independently for
                each project.
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

          {projectsError ? (
            <div
              className={
                styles.errorState
              }
            >
              <h3
                className={
                  styles.errorTitle
                }
              >
                Projects unavailable
              </h3>

              <p
                className={
                  styles.errorDescription
                }
              >
                The project portfolio could not
                be loaded.
              </p>
            </div>
          ) : projects.length === 0 ? (
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
            </div>
          ) : (
            <div
              className={
                styles.projectGrid
              }
            >
              {projects.map((project) => (
                <Link
                  href={`/dashboard/projects/locations?projectId=${project.id}`}
                  className={
                    styles.projectCard
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
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>
    )
  }

  const selectedProject =
    projects.find(
      (project) =>
        project.id === projectId
    ) || null

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <div
          className={styles.errorState}
        >
          <h1 className={styles.errorTitle}>
            Project unavailable
          </h1>

          <p
            className={
              styles.errorDescription
            }
          >
            The requested project does not exist
            or your account cannot access it.
          </p>

          <Link
            href="/dashboard/projects/locations"
            className={styles.backLink}
          >
            Select another project
          </Link>
        </div>
      </div>
    )
  }

  const [
    locationsResult,
    scopeItemsResult,
  ] = await Promise.all([
    supabase
      .from('locations')
      .select(`
        id,
        parent_id,
        name,
        location_type,
        environment_type,
        sequence_number
      `)
      .eq('project_id', projectId)
      .order('sequence_number', {
        ascending: true,
      }),

    supabase
      .from('scope_items')
      .select('location_id')
      .eq('project_id', projectId),
  ])

  const locations =
    locationsResult.data || []

  const scopeItems =
    scopeItemsResult.data || []

  const hasDataError = Boolean(
    locationsResult.error ||
      scopeItemsResult.error
  )

  if (hasDataError) {
    console.error(
      'Location breakdown data could not be loaded.',
      {
        locations:
          locationsResult.error,
        scopeItems:
          scopeItemsResult.error,
      }
    )
  }

  const childrenMap =
    createChildrenMap(locations)

  const scopeCountMap =
    createScopeCountMap(scopeItems)

  const floorCount = locations.filter(
    (location) =>
      location.location_type === 'floor'
  ).length

  const zoneCount = locations.filter(
    (location) =>
      location.location_type === 'zone'
  ).length

  const areaCount = locations.filter(
    (location) =>
      location.location_type === 'area' ||
      location.location_type === 'room'
  ).length

  const summaryItems = [
    {
      label: 'Floors',
      value: floorCount,
    },
    {
      label: 'Zones',
      value: zoneCount,
    },
    {
      label: 'Areas and rooms',
      value: areaCount,
    },
    {
      label: 'Scope items',
      value: scopeItems.length,
    },
  ]

  function renderLocationNode(location) {
    const children =
      childrenMap.get(location.id) || []

    const directScopeCount =
      scopeCountMap.get(location.id) || 0

    return (
      <li key={location.id}>
        <article
          className={
            styles.locationCard
          }
        >
          <div
            className={
              styles.locationIdentity
            }
          >
            <span
              className={getLocationIconClass(
                location.location_type
              )}
            >
              {getLocationIcon(
                location.location_type
              )}
            </span>

            <div>
              <span
                className={
                  styles.locationName
                }
              >
                {location.name}
              </span>

              <span
                className={
                  styles.locationType
                }
              >
                {locationTypeLabels[
                  location.location_type
                ] ||
                  location.location_type}

                {location.environment_type
                  ? ` · ${location.environment_type}`
                  : ''}
              </span>
            </div>
          </div>

          <div
            className={
              styles.locationMeta
            }
          >
            <span
              className={
                styles.sequenceBadge
              }
            >
              Sequence{' '}
              {location.sequence_number}
            </span>

            {directScopeCount > 0 && (
              <span
                className={
                  styles.scopeBadge
                }
              >
                {directScopeCount}{' '}
                {directScopeCount === 1
                  ? 'scope item'
                  : 'scope items'}
              </span>
            )}
          </div>
        </article>

        {children.length > 0 && (
          <ul className={styles.childList}>
            {children.map(
              renderLocationNode
            )}
          </ul>
        )}
      </li>
    )
  }

  const rootLocations =
    childrenMap.get('root') || []

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
            Location Breakdown
          </h1>

          <p
            className={
              styles.description
            }
          >
            Review the physical production
            hierarchy for{' '}
            <strong>
              {selectedProject.name}
            </strong>
            .
          </p>
        </div>

        <Link
          href="/dashboard/projects/locations"
          className={styles.backLink}
        >
          ← Change project
        </Link>
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
          </article>
        ))}
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
              Production hierarchy
            </h2>

            <p
              className={
                styles.panelDescription
              }
            >
              Floor → Zone → Area / Room
            </p>
          </div>

          <span
            className={
              styles.projectCode
            }
          >
            {selectedProject.code ||
              'Unassigned'}
          </span>
        </div>

        {hasDataError ? (
          <div
            className={
              styles.errorState
            }
          >
            <h3
              className={
                styles.errorTitle
              }
            >
              Location data unavailable
            </h3>

            <p
              className={
                styles.errorDescription
              }
            >
              The location hierarchy could not
              be loaded.
            </p>
          </div>
        ) : rootLocations.length === 0 ? (
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
              No locations configured.
            </h3>

            <p
              className={
                styles.emptyDescription
              }
            >
              This project does not have a
              location breakdown structure yet.
            </p>
          </div>
        ) : (
          <div
            className={styles.treeArea}
          >
            <ul
              className={styles.treeList}
            >
              {rootLocations.map(
                renderLocationNode
              )}
            </ul>
          </div>
        )}
      </article>
    </div>
  )
}
