'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../../lib/supabase/client';
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

function createEmptyEquipment() {
  return {
    localId: createTemporaryId(),
    id: null,
    equipmentName: '',
    equipmentCode: '',
    companyName: '',
    quantity: '1',
    hoursUsed: '',
    idleHours: '',
    operatingStatus: 'operating',
    workDescription: '',
    notes: '',
  };
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatStatus(status) {
  const labels = {
    draft: 'Draft',
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    approved: 'Approved',
  };

  return labels[status] || status || 'Draft';
}

function getStatusClass(status, stylesObject) {
  if (status === 'approved') {
    return stylesObject.statusApproved;
  }

  if (
    status === 'submitted' ||
    status === 'reviewed'
  ) {
    return stylesObject.statusSubmitted;
  }

  return stylesObject.statusDraft;
}

function formatOperatingStatus(status) {
  const labels = {
    operating: 'Operating',
    idle: 'Idle',
    maintenance: 'Maintenance',
    out_of_service: 'Out of Service',
  };

  return labels[status] || status;
}

export default function DailyReportEquipmentPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const params = useParams();
  const router = useRouter();

  const reportId = params?.reportId;

  const [userId, setUserId] = useState(null);
  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);

  const [equipmentRecords, setEquipmentRecords] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  useEffect(() => {
    async function loadEquipment() {
      if (!reportId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

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

      setUserId(userData.user.id);

      const {
        data: reportData,
        error: reportError,
      } = await supabase
        .from('daily_reports')
        .select(`
          id,
          organization_id,
          project_id,
          report_number,
          report_date,
          status
        `)
        .eq('id', reportId)
        .single();

      if (
        reportError ||
        !reportData
      ) {
        setErrorMessage(
          reportError?.message ||
            'Daily Report not found.'
        );

        setIsLoading(false);
        return;
      }

      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          code,
          name,
          client_name,
          organization_id
        `)
        .eq(
          'id',
          reportData.project_id
        )
        .single();

      if (
        projectError ||
        !projectData
      ) {
        setErrorMessage(
          projectError?.message ||
            'Project not found.'
        );

        setIsLoading(false);
        return;
      }

      const {
        data: equipmentData,
        error: equipmentError,
      } = await supabase
        .from('daily_report_equipment')
        .select(`
          id,
          daily_report_id,
          equipment_name,
          equipment_code,
          company_name,
          quantity,
          hours_used,
          idle_hours,
          operating_status,
          work_description,
          notes,
          created_by,
          created_at,
          updated_at
        `)
        .eq(
          'daily_report_id',
          reportId
        )
        .order('created_at', {
          ascending: true,
        });

      if (equipmentError) {
        setErrorMessage(
          equipmentError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedEquipment =
        (equipmentData || []).map(
          (item) => ({
            localId: item.id,
            id: item.id,

            equipmentName:
              item.equipment_name || '',

            equipmentCode:
              item.equipment_code || '',

            companyName:
              item.company_name || '',

            quantity:
              item.quantity !== null &&
              item.quantity !== undefined
                ? String(item.quantity)
                : '1',

            hoursUsed:
              item.hours_used !== null &&
              item.hours_used !== undefined
                ? String(item.hours_used)
                : '',

            idleHours:
              item.idle_hours !== null &&
              item.idle_hours !== undefined
                ? String(item.idle_hours)
                : '',

            operatingStatus:
              item.operating_status ||
              'operating',

            workDescription:
              item.work_description || '',

            notes:
              item.notes || '',
          })
        );

      setReport(reportData);
      setProject(projectData);
      setEquipmentRecords(
        loadedEquipment
      );

      setIsLoading(false);
    }

    loadEquipment();
  }, [
    reportId,
    supabase,
  ]);

  function addEquipment() {
    setEquipmentRecords(
      (currentRecords) => [
        ...currentRecords,
        createEmptyEquipment(),
      ]
    );

    setSuccessMessage('');
  }

  function updateEquipment(
    localId,
    field,
    value
  ) {
    setEquipmentRecords(
      (currentRecords) =>
        currentRecords.map(
          (item) =>
            item.localId === localId
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  async function removeEquipment(
    item
  ) {
    if (
      isSaving ||
      report.status !== 'draft'
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (item.id) {
      const confirmed =
        window.confirm(
          `Remove ${item.equipmentName || 'this equipment record'} from the Daily Report?`
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from(
          'daily_report_equipment'
        )
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        setErrorMessage(
          deleteError.message
        );

        return;
      }
    }

    setEquipmentRecords(
      (currentRecords) =>
        currentRecords.filter(
          (currentItem) =>
            currentItem.localId !==
            item.localId
        )
    );
  }

  async function saveEquipment(
    event
  ) {
    event.preventDefault();

    if (
      !report ||
      !userId ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    for (
      const item
      of equipmentRecords
    ) {
      const equipmentName =
        item.equipmentName.trim();

      if (!equipmentName) {
        setErrorMessage(
          'Equipment name is required for every equipment record.'
        );

        setIsSaving(false);
        return;
      }

      const quantity =
        Number(item.quantity);

      const hoursUsed =
        item.hoursUsed === ''
          ? 0
          : Number(
              item.hoursUsed
            );

      const idleHours =
        item.idleHours === ''
          ? 0
          : Number(
              item.idleHours
            );

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        setErrorMessage(
          `${equipmentName}: quantity must be a whole number greater than zero.`
        );

        setIsSaving(false);
        return;
      }

      if (
        !Number.isFinite(
          hoursUsed
        ) ||
        hoursUsed < 0
      ) {
        setErrorMessage(
          `${equipmentName}: hours used must be zero or greater.`
        );

        setIsSaving(false);
        return;
      }

      if (
        !Number.isFinite(
          idleHours
        ) ||
        idleHours < 0
      ) {
        setErrorMessage(
          `${equipmentName}: idle hours must be zero or greater.`
        );

        setIsSaving(false);
        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        equipment_name:
          equipmentName,

        equipment_code:
          item.equipmentCode.trim() ||
          null,

        company_name:
          item.companyName.trim() ||
          null,

        quantity,

        hours_used:
          hoursUsed,

        idle_hours:
          idleHours,

        operating_status:
          item.operatingStatus,

        work_description:
          item.workDescription.trim() ||
          null,

        notes:
          item.notes.trim() ||
          null,
      };

      let result;

      if (item.id) {
        result = await supabase
          .from(
            'daily_report_equipment'
          )
          .update(payload)
          .eq(
            'id',
            item.id
          )
          .select(`
            id,
            daily_report_id,
            equipment_name,
            equipment_code,
            company_name,
            quantity,
            hours_used,
            idle_hours,
            operating_status,
            work_description,
            notes
          `)
          .single();
      } else {
        result = await supabase
          .from(
            'daily_report_equipment'
          )
          .insert({
            ...payload,
            created_by:
              userId,
          })
          .select(`
            id,
            daily_report_id,
            equipment_name,
            equipment_code,
            company_name,
            quantity,
            hours_used,
            idle_hours,
            operating_status,
            work_description,
            notes
          `)
          .single();
      }

      if (result.error) {
        setErrorMessage(
          result.error.message
        );

        setIsSaving(false);
        return;
      }

      setEquipmentRecords(
        (currentRecords) =>
          currentRecords.map(
            (currentItem) =>
              currentItem.localId ===
              item.localId
                ? {
                    ...currentItem,

                    id:
                      result.data.id,

                    localId:
                      result.data.id,
                  }
                : currentItem
          )
      );
    }

    setSuccessMessage(
      'Equipment information saved successfully.'
    );

    setIsSaving(false);
  }

  const totalUnits =
    equipmentRecords.reduce(
      (total, item) =>
        total +
        (Number(
          item.quantity
        ) || 0),
      0
    );

  const totalOperatingHours =
    equipmentRecords.reduce(
      (total, item) =>
        total +
        (Number(
          item.hoursUsed
        ) || 0) *
          (Number(
            item.quantity
          ) || 0),
      0
    );

  const totalIdleHours =
    equipmentRecords.reduce(
      (total, item) =>
        total +
        (Number(
          item.idleHours
        ) || 0) *
          (Number(
            item.quantity
          ) || 0),
      0
    );

  const unavailableUnits =
    equipmentRecords.reduce(
      (total, item) => {
        if (
          item.operatingStatus ===
            'maintenance' ||
          item.operatingStatus ===
            'out_of_service'
        ) {
          return (
            total +
            (Number(
              item.quantity
            ) || 0)
          );
        }

        return total;
      },
      0
    );

  if (isLoading) {
    return (
      <main className={styles.page}>
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
            DAILY REPORT
          </p>

          <h1
            className={
              styles.sectionTitle
            }
          >
            Loading Equipment...
          </h1>
        </section>
      </main>
    );
  }

  if (
    errorMessage &&
    (!report || !project)
  ) {
    return (
      <main className={styles.page}>
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
            DAILY REPORT
          </p>

          <h1
            className={
              styles.sectionTitle
            }
          >
            Equipment information unavailable
          </h1>

          <p
            className={
              styles.integrationText
            }
          >
            {errorMessage}
          </p>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                '/dashboard/projects/daily-reports'
              )
            }
          >
            ← Daily Report Center
          </button>
        </section>
      </main>
    );
  }

  const isReadOnly =
    report.status !== 'draft';

  return (
    <main className={styles.page}>
      <section
        className={
          styles.pageHeader
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            DAILY REPORT · EQUIPMENT
          </p>

          <h1
            className={
              styles.title
            }
          >
            DR-
            {String(
              report.report_number
            ).padStart(
              4,
              '0'
            )}
          </h1>

          <p
            className={
              styles.description
            }
          >
            {project.code ||
              'Unassigned'}{' '}
            · {project.name} ·{' '}
            {formatDate(
              report.report_date
            )}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              report.status,
              styles
            )}`}
          >
            {formatStatus(
              report.status
            )}
          </span>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                `/dashboard/projects/daily-reports/${report.id}`
              )
            }
          >
            ← Report Workspace
          </button>
        </div>
      </section>

      {errorMessage && (
        <div
          style={{
            padding:
              '12px 14px',
            color: '#9f2929',
            border:
              '1px solid #fecaca',
            borderRadius: '9px',
            background:
              '#fff5f5',
            fontSize: '0.76rem',
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
            color: '#087f73',
            border:
              '1px solid #b7eee6',
            borderRadius: '9px',
            background:
              '#effcf9',
            fontSize: '0.76rem',
            fontWeight: 700,
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
              05 · EQUIPMENT
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily equipment summary
            </h2>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                addEquipment
              }
            >
              + Add Equipment
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              padding: '14px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '9px',
              background: '#f8fafc',
            }}
          >
            <div style={labelStyle}>
              RECORDS
            </div>

            <div
              style={{
                marginTop: '5px',
                color: '#061b2f',
                fontSize: '1.35rem',
                fontWeight: 800,
              }}
            >
              {equipmentRecords.length}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '9px',
              background: '#f8fafc',
            }}
          >
            <div style={labelStyle}>
              UNITS ON SITE
            </div>

            <div
              style={{
                marginTop: '5px',
                color: '#061b2f',
                fontSize: '1.35rem',
                fontWeight: 800,
              }}
            >
              {totalUnits}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '9px',
              background: '#f8fafc',
            }}
          >
            <div style={labelStyle}>
              OPERATING HOURS
            </div>

            <div
              style={{
                marginTop: '5px',
                color: '#087f73',
                fontSize: '1.35rem',
                fontWeight: 800,
              }}
            >
              {totalOperatingHours.toFixed(
                1
              )}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              border:
                '1px solid #e2e8f0',
              borderRadius: '9px',
              background:
                unavailableUnits > 0
                  ? '#fffaf0'
                  : '#f8fafc',
            }}
          >
            <div style={labelStyle}>
              IDLE HOURS
            </div>

            <div
              style={{
                marginTop: '5px',
                color:
                  totalIdleHours > 0
                    ? '#9a6700'
                    : '#061b2f',
                fontSize: '1.35rem',
                fontWeight: 800,
              }}
            >
              {totalIdleHours.toFixed(
                1
              )}
            </div>

            {unavailableUnits > 0 && (
              <div
                style={{
                  marginTop: '3px',
                  color: '#9a6700',
                  fontSize: '0.66rem',
                }}
              >
                {unavailableUnits}{' '}
                unavailable unit
                {unavailableUnits === 1
                  ? ''
                  : 's'}
              </div>
            )}
          </div>
        </div>
      </section>

      <form
        onSubmit={
          saveEquipment
        }
      >
        {equipmentRecords.length === 0 ? (
          <section
            className={
              styles.infoCard
            }
            style={{
              marginTop: '14px',
              textAlign: 'center',
              padding: '38px 24px',
            }}
          >
            <p
              className={
                styles.sectionEyebrow
              }
            >
              NO EQUIPMENT RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Add the first equipment record
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record equipment,
              operating hours, idle
              hours and field status
              for this Daily Report.
            </p>

            {!isReadOnly && (
              <div
                style={{
                  marginTop: '18px',
                }}
              >
                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={
                    addEquipment
                  }
                >
                  + Add Equipment
                </button>
              </div>
            )}
          </section>
        ) : (
          equipmentRecords.map(
            (item, index) => (
              <section
                key={
                  item.localId
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
                      EQUIPMENT{' '}
                      {String(
                        index + 1
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
                      {item.equipmentName ||
                        'New Equipment'}
                    </h2>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      className={`${styles.statusBadge} ${
                        item.operatingStatus ===
                        'operating'
                          ? styles.statusApproved
                          : item.operatingStatus ===
                              'idle'
                            ? styles.statusSubmitted
                            : styles.statusDraft
                      }`}
                    >
                      {formatOperatingStatus(
                        item.operatingStatus
                      )}
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        style={
                          dangerButtonStyle
                        }
                        onClick={() =>
                          removeEquipment(
                            item
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
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Equipment name
                    </span>

                    <input
                      type="text"
                      value={
                        item.equipmentName
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'equipmentName',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="e.g. Excavator"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Equipment code
                    </span>

                    <input
                      type="text"
                      value={
                        item.equipmentCode
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'equipmentCode',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Optional code"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Company / Owner
                    </span>

                    <input
                      type="text"
                      value={
                        item.companyName
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'companyName',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Company name"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Quantity
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        item.quantity
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'quantity',
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

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Hours used
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        item.hoursUsed
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'hoursUsed',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="0.00"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Idle hours
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        item.idleHours
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'idleHours',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="0.00"
                      style={
                        inputStyle
                      }
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={labelStyle}>
                      Operating status
                    </span>

                    <select
                      value={
                        item.operatingStatus
                      }
                      onChange={(event) =>
                        updateEquipment(
                          item.localId,
                          'operatingStatus',
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
                      <option value="operating">
                        Operating
                      </option>

                      <option value="idle">
                        Idle
                      </option>

                      <option value="maintenance">
                        Maintenance
                      </option>

                      <option value="out_of_service">
                        Out of Service
                      </option>
                    </select>
                  </label>
                </div>

                <label
                  style={{
                    ...fieldStyle,
                    marginTop: '18px',
                  }}
                >
                  <span style={labelStyle}>
                    Work description
                  </span>

                  <textarea
                    rows={3}
                    value={
                      item.workDescription
                    }
                    onChange={(event) =>
                      updateEquipment(
                        item.localId,
                        'workDescription',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Describe how the equipment was used during the workday..."
                    style={{
                      ...inputStyle,
                      minHeight: '84px',
                      padding: '10px 12px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </label>

                <label
                  style={{
                    ...fieldStyle,
                    marginTop: '16px',
                  }}
                >
                  <span style={labelStyle}>
                    Equipment notes
                  </span>

                  <textarea
                    rows={3}
                    value={
                      item.notes
                    }
                    onChange={(event) =>
                      updateEquipment(
                        item.localId,
                        'notes',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Breakdowns, maintenance, delays or other equipment observations..."
                    style={{
                      ...inputStyle,
                      minHeight: '84px',
                      padding: '10px 12px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </label>
              </section>
            )
          )
        )}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                `/dashboard/projects/daily-reports/${report.id}/production`
              )
            }
          >
            ← Production
          </button>

          {equipmentRecords.length > 0 && (
            <button
              type="submit"
              className={
                styles.primaryButton
              }
              disabled={
                isReadOnly ||
                isSaving
              }
            >
              {isSaving
                ? 'Saving...'
                : 'Save Equipment'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
