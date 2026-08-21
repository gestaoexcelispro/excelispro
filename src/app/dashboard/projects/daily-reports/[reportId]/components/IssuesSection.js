'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient } from '../../../../../../../lib/supabase/client';

import styles from '../../daily-reports.module.css';

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
};

const labelStyle = {
  color: '#64748b',
  fontSize: '0.7rem',
  fontWeight: 800,
};

const inputStyle = {
  width: '100%',
  minHeight: '42px',
  padding: '0 12px',
  color: '#061b2f',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#ffffff',
  fontFamily: 'inherit',
  fontSize: '0.78rem',
  boxSizing: 'border-box',
};

const dangerButtonStyle = {
  minHeight: '36px',
  padding: '0 12px',
  color: '#9f2929',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  background: '#fff5f5',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.72rem',
  fontWeight: 800,
};

function createTemporaryId() {
  return `temp-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptyIssue() {
  return {
    localId: createTemporaryId(),
    id: null,

    title: '',
    description: '',

    issueType: 'general',
    severity: 'medium',
    status: 'open',

    locationId: '',
    locationName: '',

    projectServiceId: '',
    serviceName: '',

    productionImpact: 'none',
    impactDescription: '',

    responsibleParty: '',
    correctiveAction: '',

    dueDate: '',
    resolvedAt: '',

    createConstraint: false,
  };
}

function formatIssueStatus(status) {
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    labels[status] ||
    status
  );
}

function formatIssueType(type) {
  const labels = {
    general: 'General',
    production: 'Production',
    material: 'Material',
    equipment: 'Equipment',
    design: 'Design',
    quality: 'Quality',
    safety: 'Safety',
    coordination: 'Coordination',
    weather: 'Weather',
    other: 'Other',
  };

  return (
    labels[type] ||
    type
  );
}

function formatSeverity(severity) {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return (
    labels[severity] ||
    severity
  );
}

function formatProductionImpact(
  impact
) {
  const labels = {
    none: 'None',
    minor: 'Minor',
    moderate: 'Moderate',
    severe: 'Severe',
    stopped: 'Production Stopped',
  };

  return (
    labels[impact] ||
    impact
  );
}

function SummaryCard({
  label,
  value,
  emphasis,
}) {
  return (
    <div
      style={{
        padding: '14px',
        border: '1px solid #e2e8f0',
        borderRadius: '9px',
        background:
          emphasis === 'critical'
            ? '#fff5f5'
            : emphasis === 'warning'
              ? '#fffaf0'
              : emphasis === 'success'
                ? '#f2fbf9'
                : '#f8fafc',
      }}
    >
      <div
        style={
          labelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          marginTop: '5px',

          color:
            emphasis === 'critical'
              ? '#9f2929'
              : emphasis === 'warning'
                ? '#9a6700'
                : emphasis === 'success'
                  ? '#087f73'
                  : '#061b2f',

          fontSize: '1.35rem',
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function IssuesSection({
  report,
  project,
  onCountChange,
}) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const reportId =
    report?.id;

  const projectId =
    project?.id;

  const [
    userId,
    setUserId,
  ] = useState(null);

  const [
    locations,
    setLocations,
  ] = useState([]);

  const [
    projectServices,
    setProjectServices,
  ] = useState([]);

  const [
    serviceQuantities,
    setServiceQuantities,
  ] = useState([]);

  const [
    issues,
    setIssues,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    async function loadIssues() {
      if (
        !reportId ||
        !projectId
      ) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data:
          userData,

        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData?.user
      ) {
        setErrorMessage(
          'Your authenticated session could not be verified.'
        );

        setIsLoading(false);
        return;
      }

      setUserId(
        userData.user.id
      );

      const [
        locationsResult,
        servicesResult,
        quantitiesResult,
        issuesResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'locations'
            )
            .select(`
              id,
              project_id,
              parent_id,
              name,
              location_type,
              environment_type,
              sequence_number
            `)
            .eq(
              'project_id',
              projectId
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
            .from(
              'project_services'
            )
            .select(`
              id,
              project_id,
              service_code,
              service_name,
              unit,
              sequence_number,
              is_active
            `)
            .eq(
              'project_id',
              projectId
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
              quantity
            `)
            .eq(
              'project_id',
              projectId
            ),

          supabase
            .from(
              'daily_report_issues'
            )
            .select(`
              *
            `)
            .eq(
              'daily_report_id',
              reportId
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            ),
        ]);

      const loadError =
        locationsResult.error ||
        servicesResult.error ||
        quantitiesResult.error ||
        issuesResult.error;

      if (
        loadError
      ) {
        setErrorMessage(
          loadError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedIssues =
        (
          issuesResult.data ||
          []
        ).map(
          (item) => ({
            localId:
              item.id,

            id:
              item.id,

            title:
              item.title ||
              '',

            description:
              item.description ||
              '',

            issueType:
              item.issue_type ||
              'general',

            severity:
              item.severity ||
              'medium',

            status:
              item.status ||
              'open',

            locationId:
              item.location_id ||
              '',

            locationName:
              item.location_name ||
              '',

            projectServiceId:
              item.project_service_id ||
              '',

            serviceName:
              item.service_name ||
              '',

            productionImpact:
              item.production_impact ||
              'none',

            impactDescription:
              item.impact_description ||
              '',

            responsibleParty:
              item.responsible_party ||
              '',

            correctiveAction:
              item.corrective_action ||
              '',

            dueDate:
              item.due_date ||
              '',

            resolvedAt:
              item.resolved_at
                ? String(
                    item.resolved_at
                  ).slice(
                    0,
                    16
                  )
                : '',

            createConstraint:
              Boolean(
                item.create_constraint
              ),
          })
        );

      setLocations(
        locationsResult.data ||
          []
      );

      setProjectServices(
        servicesResult.data ||
          []
      );

      setServiceQuantities(
        quantitiesResult.data ||
          []
      );

      setIssues(
        loadedIssues
      );

      onCountChange?.(
        loadedIssues.length
      );

      setIsLoading(false);
    }

    loadIssues();
  }, [
    reportId,
    projectId,
    supabase,
    onCountChange,
  ]);

  const locationMap =
    useMemo(
      () =>
        new Map(
          locations.map(
            (location) => [
              location.id,
              location,
            ]
          )
        ),
      [
        locations,
      ]
    );

  const locationPathMap =
    useMemo(() => {
      const result =
        new Map();

      function buildPath(
        location
      ) {
        if (
          !location
        ) {
          return '';
        }

        if (
          result.has(
            location.id
          )
        ) {
          return result.get(
            location.id
          );
        }

        const names = [];
        const visited =
          new Set();

        let current =
          location;

        while (
          current &&
          !visited.has(
            current.id
          )
        ) {
          visited.add(
            current.id
          );

          names.unshift(
            current.name
          );

          current =
            current.parent_id
              ? locationMap.get(
                  current.parent_id
                )
              : null;
        }

        const path =
          names.join(
            ' / '
          );

        result.set(
          location.id,
          path
        );

        return path;
      }

      locations.forEach(
        (location) => {
          buildPath(
            location
          );
        }
      );

      return result;
    }, [
      locations,
      locationMap,
    ]);

  const issueLocations =
    useMemo(
      () =>
        [
          ...locations,
        ].sort(
          (a, b) => {
            const pathA =
              locationPathMap.get(
                a.id
              ) ||
              a.name;

            const pathB =
              locationPathMap.get(
                b.id
              ) ||
              b.name;

            return pathA.localeCompare(
              pathB
            );
          }
        ),
      [
        locations,
        locationPathMap,
      ]
    );

  function getAvailableServices(
    locationId
  ) {
    if (
      !locationId
    ) {
      return projectServices;
    }

    const serviceIds =
      new Set(
        serviceQuantities
          .filter(
            (quantity) =>
              quantity.location_id ===
              locationId
          )
          .map(
            (quantity) =>
              quantity.service_id
          )
      );

    if (
      serviceIds.size ===
      0
    ) {
      return projectServices;
    }

    return projectServices.filter(
      (service) =>
        serviceIds.has(
          service.id
        )
    );
  }

  function addIssue() {
    setIssues(
      (
        currentIssues
      ) => [
        ...currentIssues,
        createEmptyIssue(),
      ]
    );

    setSuccessMessage('');
  }

  function updateIssue(
    localId,
    field,
    value
  ) {
    setIssues(
      (
        currentIssues
      ) =>
        currentIssues.map(
          (item) => {
            if (
              item.localId !==
              localId
            ) {
              return item;
            }

            const nextItem = {
              ...item,
              [field]:
                value,
            };

            if (
              field ===
              'status'
            ) {
              if (
                value ===
                  'resolved' ||
                value ===
                  'closed'
              ) {
                if (
                  !nextItem.resolvedAt
                ) {
                  const now =
                    new Date();

                  const offset =
                    now.getTimezoneOffset();

                  const localDate =
                    new Date(
                      now.getTime() -
                        offset *
                          60 *
                          1000
                    );

                  nextItem.resolvedAt =
                    localDate
                      .toISOString()
                      .slice(
                        0,
                        16
                      );
                }
              } else {
                nextItem.resolvedAt =
                  '';
              }
            }

            return nextItem;
          }
        )
    );

    setSuccessMessage('');
  }

  function selectLocation(
    issue,
    locationId
  ) {
    const location =
      locationMap.get(
        locationId
      );

    setIssues(
      (
        currentIssues
      ) =>
        currentIssues.map(
          (item) =>
            item.localId ===
            issue.localId
              ? {
                  ...item,

                  locationId,

                  locationName:
                    location
                      ? locationPathMap.get(
                          location.id
                        ) ||
                        location.name
                      : '',

                  projectServiceId:
                    '',

                  serviceName:
                    '',
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  function selectService(
    issue,
    serviceId
  ) {
    const service =
      projectServices.find(
        (item) =>
          item.id ===
          serviceId
      );

    setIssues(
      (
        currentIssues
      ) =>
        currentIssues.map(
          (item) =>
            item.localId ===
            issue.localId
              ? {
                  ...item,

                  projectServiceId:
                    serviceId,

                  serviceName:
                    service
                      ?.service_name ||
                    '',
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  async function removeIssue(
    issue
  ) {
    if (
      isSaving ||
      report?.status !==
        'draft'
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (
      issue.id
    ) {
      const confirmed =
        window.confirm(
          `Remove "${
            issue.title ||
            'this issue'
          }" from the Daily Report?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            'daily_report_issues'
          )
          .delete()
          .eq(
            'id',
            issue.id
          );

      if (
        deleteError
      ) {
        setErrorMessage(
          deleteError.message
        );

        return;
      }
    }

    setIssues(
      (
        currentIssues
      ) => {
        const nextIssues =
          currentIssues.filter(
            (item) =>
              item.localId !==
              issue.localId
          );

        onCountChange?.(
          nextIssues.length
        );

        return nextIssues;
      }
    );
  }

  async function saveIssues(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      !userId ||
      isSaving ||
      report.status !==
        'draft'
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (
      const issue
      of issues
    ) {
      const title =
        issue.title.trim();

      if (
        !title
      ) {
        setErrorMessage(
          'Issue title is required for every issue.'
        );

        setIsSaving(false);
        return;
      }

      if (
        issue.createConstraint &&
        !issue.locationId
      ) {
        setErrorMessage(
          `${title}: select a location before marking the issue to create a constraint.`
        );

        setIsSaving(false);
        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        title,

        description:
          issue.description.trim() ||
          null,

        issue_type:
          issue.issueType,

        severity:
          issue.severity,

        status:
          issue.status,

        location_id:
          issue.locationId ||
          null,

        location_name:
          issue.locationName ||
          null,

        project_service_id:
          issue.projectServiceId ||
          null,

        service_name:
          issue.serviceName ||
          null,

        production_impact:
          issue.productionImpact,

        impact_description:
          issue.impactDescription.trim() ||
          null,

        responsible_party:
          issue.responsibleParty.trim() ||
          null,

        corrective_action:
          issue.correctiveAction.trim() ||
          null,

        due_date:
          issue.dueDate ||
          null,

        resolved_at:
          issue.resolvedAt
            ? new Date(
                issue.resolvedAt
              ).toISOString()
            : null,

        create_constraint:
          issue.createConstraint,
      };

      let result;

      if (
        issue.id
      ) {
        result =
          await supabase
            .from(
              'daily_report_issues'
            )
            .update(
              payload
            )
            .eq(
              'id',
              issue.id
            )
            .select(
              'id'
            )
            .single();
      } else {
        result =
          await supabase
            .from(
              'daily_report_issues'
            )
            .insert({
              ...payload,

              created_by:
                userId,
            })
            .select(
              'id'
            )
            .single();
      }

      if (
        result.error
      ) {
        setErrorMessage(
          result.error.message
        );

        setIsSaving(false);
        return;
      }

      setIssues(
        (
          currentIssues
        ) =>
          currentIssues.map(
            (item) =>
              item.localId ===
              issue.localId
                ? {
                    ...item,

                    id:
                      result.data.id,

                    localId:
                      result.data.id,
                  }
                : item
          )
      );
    }

    onCountChange?.(
      issues.length
    );

    setSuccessMessage(
      'Issues and constraints information saved successfully.'
    );

    setIsSaving(false);
  }

  const openIssues =
    issues.filter(
      (issue) =>
        issue.status ===
          'open' ||
        issue.status ===
          'in_progress'
    ).length;

  const criticalIssues =
    issues.filter(
      (issue) =>
        issue.severity ===
        'critical'
    ).length;

  const impactedIssues =
    issues.filter(
      (issue) =>
        issue.productionImpact !==
        'none'
    ).length;

  const constraintCandidates =
    issues.filter(
      (issue) =>
        issue.createConstraint
    ).length;

  if (
    isLoading
  ) {
    return (
      <section
        className={
          styles.infoCard
        }
      >
        <p
          className={
            styles.sectionEyebrow
          }
        >
          07 · ISSUES & CONSTRAINTS
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Issues...
        </h2>
      </section>
    );
  }

  const isReadOnly =
    report?.status !==
    'draft';

  return (
    <div>
      {errorMessage && (
        <div
          style={{
            padding:
              '12px 14px',

            marginBottom:
              '14px',

            color:
              '#9f2929',

            border:
              '1px solid #fecaca',

            borderRadius:
              '9px',

            background:
              '#fff5f5',

            fontSize:
              '0.76rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding:
              '12px 14px',

            marginBottom:
              '14px',

            color:
              '#087f73',

            border:
              '1px solid #b7eee6',

            borderRadius:
              '9px',

            background:
              '#effcf9',

            fontSize:
              '0.76rem',

            fontWeight:
              700,
          }}
        >
          {successMessage}
        </div>
      )}

      <section
        className={
          styles.infoCard
        }
      >
        <div
          className={
            styles.infoCardHeader
          }
        >
          <div>
            <p
              className={
                styles.sectionEyebrow
              }
            >
              07 · ISSUES & CONSTRAINTS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily issues summary
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              {project?.name ||
                'Project'} field
              issues, production
              impacts and potential
              planning constraints.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                addIssue
              }
            >
              + Add Issue
            </button>
          )}
        </div>

        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',

            gap:
              '12px',

            marginTop:
              '16px',
          }}
        >
          <SummaryCard
            label="OPEN ISSUES"
            value={
              openIssues
            }
          />

          <SummaryCard
            label="CRITICAL"
            value={
              criticalIssues
            }
            emphasis={
              criticalIssues >
              0
                ? 'critical'
                : undefined
            }
          />

          <SummaryCard
            label="PRODUCTION IMPACT"
            value={
              impactedIssues
            }
            emphasis={
              impactedIssues >
              0
                ? 'warning'
                : undefined
            }
          />

          <SummaryCard
            label="CONSTRAINT CANDIDATES"
            value={
              constraintCandidates
            }
            emphasis={
              constraintCandidates >
              0
                ? 'success'
                : undefined
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveIssues
        }
      >
        {issues.length ===
        0 ? (
          <section
            className={
              styles.infoCard
            }
            style={{
              marginTop:
                '14px',

              textAlign:
                'center',

              padding:
                '38px 24px',
            }}
          >
            <p
              className={
                styles.sectionEyebrow
              }
            >
              NO ISSUES RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              No field issues reported
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Add field issues,
              production impacts
              and potential
              planning constraints.
            </p>

            {!isReadOnly && (
              <div
                style={{
                  marginTop:
                    '18px',
                }}
              >
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={
                    addIssue
                  }
                >
                  + Add Issue
                </button>
              </div>
            )}
          </section>
        ) : (
          issues.map(
            (
              issue,
              index
            ) => {
              const availableServices =
                getAvailableServices(
                  issue.locationId
                );

              return (
                <section
                  key={
                    issue.localId
                  }
                  className={
                    styles.infoCard
                  }
                  style={{
                    marginTop:
                      '14px',
                  }}
                >
                  <div
                    className={
                      styles.infoCardHeader
                    }
                  >
                    <div>
                      <p
                        className={
                          styles.sectionEyebrow
                        }
                      >
                        ISSUE{' '}
                        {String(
                          index +
                            1
                        ).padStart(
                          2,
                          '0'
                        )}
                      </p>

                      <h2
                        className={
                          styles.sectionTitle
                        }
                      >
                        {issue.title ||
                          'New Issue'}
                      </h2>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '8px',
                      }}
                    >
                      <span
                        className={`${styles.statusBadge} ${
                          issue.status ===
                            'resolved' ||
                          issue.status ===
                            'closed'
                            ? styles.statusApproved
                            : issue.status ===
                                'in_progress'
                              ? styles.statusSubmitted
                              : styles.statusDraft
                        }`}
                      >
                        {formatIssueStatus(
                          issue.status
                        )}
                      </span>

                      {!isReadOnly && (
                        <button
                          type="button"
                          style={
                            dangerButtonStyle
                          }
                          onClick={() =>
                            removeIssue(
                              issue
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '2fr 1fr 1fr 1fr',

                      gap:
                        '16px',
                    }}
                  >
                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Issue title
                      </span>

                      <input
                        type="text"
                        value={
                          issue.title
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'title',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Describe the issue briefly"
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Issue type
                      </span>

                      <select
                        value={
                          issue.issueType
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'issueType',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        {[
                          'general',
                          'production',
                          'material',
                          'equipment',
                          'design',
                          'quality',
                          'safety',
                          'coordination',
                          'weather',
                          'other',
                        ].map(
                          (value) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {formatIssueType(
                                value
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Severity
                      </span>

                      <select
                        value={
                          issue.severity
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'severity',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        {[
                          'low',
                          'medium',
                          'high',
                          'critical',
                        ].map(
                          (value) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {formatSeverity(
                                value
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Status
                      </span>

                      <select
                        value={
                          issue.status
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'status',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        {[
                          'open',
                          'in_progress',
                          'resolved',
                          'closed',
                        ].map(
                          (value) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {formatIssueStatus(
                                value
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <label
                    style={{
                      ...fieldStyle,

                      marginTop:
                        '16px',
                    }}
                  >
                    <span
                      style={
                        labelStyle
                      }
                    >
                      Description
                    </span>

                    <textarea
                      rows={3}
                      value={
                        issue.description
                      }
                      onChange={(
                        event
                      ) =>
                        updateIssue(
                          issue.localId,
                          'description',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Describe what happened and the field condition observed..."
                      style={{
                        ...inputStyle,

                        minHeight:
                          '84px',

                        padding:
                          '10px 12px',

                        lineHeight:
                          1.5,

                        resize:
                          'vertical',
                      }}
                    />
                  </label>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',

                      gap:
                        '16px',

                      marginTop:
                        '18px',
                    }}
                  >
                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Location
                      </span>

                      <select
                        value={
                          issue.locationId
                        }
                        onChange={(
                          event
                        ) =>
                          selectLocation(
                            issue,
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        <option value="">
                          No specific location
                        </option>

                        {issueLocations.map(
                          (
                            location
                          ) => (
                            <option
                              key={
                                location.id
                              }
                              value={
                                location.id
                              }
                            >
                              {locationPathMap.get(
                                location.id
                              ) ||
                                location.name}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Service
                      </span>

                      <select
                        value={
                          issue.projectServiceId
                        }
                        onChange={(
                          event
                        ) =>
                          selectService(
                            issue,
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        <option value="">
                          No specific service
                        </option>

                        {availableServices.map(
                          (
                            service
                          ) => (
                            <option
                              key={
                                service.id
                              }
                              value={
                                service.id
                              }
                            >
                              {
                                service.service_name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '1fr 2fr',

                      gap:
                        '16px',

                      marginTop:
                        '18px',
                    }}
                  >
                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Production impact
                      </span>

                      <select
                        value={
                          issue.productionImpact
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'productionImpact',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      >
                        {[
                          'none',
                          'minor',
                          'moderate',
                          'severe',
                          'stopped',
                        ].map(
                          (value) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {formatProductionImpact(
                                value
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Impact description
                      </span>

                      <input
                        type="text"
                        value={
                          issue.impactDescription
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'impactDescription',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Describe the impact on production or workflow..."
                        style={
                          inputStyle
                        }
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '2fr 1fr 1fr',

                      gap:
                        '16px',

                      marginTop:
                        '18px',
                    }}
                  >
                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Responsible party
                      </span>

                      <input
                        type="text"
                        value={
                          issue.responsibleParty
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'responsibleParty',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Company, trade, person or team"
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Due date
                      </span>

                      <input
                        type="date"
                        value={
                          issue.dueDate
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'dueDate',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        fieldStyle
                      }
                    >
                      <span
                        style={
                          labelStyle
                        }
                      >
                        Resolved at
                      </span>

                      <input
                        type="datetime-local"
                        value={
                          issue.resolvedAt
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'resolvedAt',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly ||
                          ![
                            'resolved',
                            'closed',
                          ].includes(
                            issue.status
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>
                  </div>

                  <label
                    style={{
                      ...fieldStyle,

                      marginTop:
                        '18px',
                    }}
                  >
                    <span
                      style={
                        labelStyle
                      }
                    >
                      Corrective action
                    </span>

                    <textarea
                      rows={3}
                      value={
                        issue.correctiveAction
                      }
                      onChange={(
                        event
                      ) =>
                        updateIssue(
                          issue.localId,
                          'correctiveAction',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Describe the action required or already taken to resolve the issue..."
                      style={{
                        ...inputStyle,

                        minHeight:
                          '84px',

                        padding:
                          '10px 12px',

                        lineHeight:
                          1.5,

                        resize:
                          'vertical',
                      }}
                    />
                  </label>

                  <div
                    style={{
                      marginTop:
                        '18px',

                      padding:
                        '14px',

                      border:
                        issue.createConstraint
                          ? '1px solid #99d9cf'
                          : '1px solid #e2e8f0',

                      borderRadius:
                        '9px',

                      background:
                        issue.createConstraint
                          ? '#f2fbf9'
                          : '#f8fafc',
                    }}
                  >
                    <label
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'flex-start',

                        gap:
                          '10px',

                        cursor:
                          isReadOnly
                            ? 'default'
                            : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          issue.createConstraint
                        }
                        onChange={(
                          event
                        ) =>
                          updateIssue(
                            issue.localId,
                            'createConstraint',
                            event.target.checked
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        style={{
                          marginTop:
                            '2px',
                        }}
                      />

                      <div>
                        <div
                          style={{
                            color:
                              '#061b2f',

                            fontSize:
                              '0.78rem',

                            fontWeight:
                              800,
                          }}
                        >
                          Create constraint from this issue
                        </div>

                        <div
                          style={{
                            marginTop:
                              '4px',

                            color:
                              '#64748b',

                            fontSize:
                              '0.7rem',

                            lineHeight:
                              1.5,
                          }}
                        >
                          Flag this
                          field issue
                          as a candidate
                          for the
                          planning
                          constraint
                          workflow.
                          Automatic
                          Constraint Log
                          creation will
                          remain a future
                          integration.
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              );
            }
          )
        )}

        {issues.length >
          0 &&
          !isReadOnly && (
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'flex-end',

                marginTop:
                  '18px',
              }}
            >
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
                  : 'Save Issues'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
