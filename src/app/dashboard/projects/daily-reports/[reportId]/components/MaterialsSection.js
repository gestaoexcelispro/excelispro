'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

function createEmptyMaterial() {
  return {
    localId: createTemporaryId(),
    id: null,

    movementType: 'received',

    materialName: '',
    materialCode: '',

    quantity: '',
    unit: '',

    supplierName: '',
    deliveryReference: '',
    deliveryTime: '',

    notes: '',
  };
}

function numericValue(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    Number(
      String(value).replace(
        ',',
        '.'
      )
    );

  if (
    !Number.isFinite(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
}

function formatQuantity(
  value,
  unit = ''
) {
  const numeric =
    numericValue(
      value
    );

  if (
    numeric === null
  ) {
    return '—';
  }

  const formatted =
    new Intl.NumberFormat(
      'en-US',
      {
        maximumFractionDigits:
          2,
      }
    ).format(
      numeric
    );

  return unit
    ? `${formatted} ${unit}`
    : formatted;
}

function formatMovementType(
  value
) {
  if (
    value ===
    'received'
  ) {
    return 'Received';
  }

  if (
    value ===
    'used'
  ) {
    return 'Used';
  }

  return value;
}

function SummaryCard({
  label,
  value,
  emphasis,
}) {
  return (
    <div
      style={{
        padding:
          '14px',

        border:
          '1px solid #e2e8f0',

        borderRadius:
          '9px',

        background:
          emphasis ===
          'success'
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
          marginTop:
            '5px',

          color:
            emphasis ===
            'success'
              ? '#087f73'
              : '#061b2f',

          fontSize:
            '1.35rem',

          fontWeight:
            800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function MaterialsSection({
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

  const [
    userId,
    setUserId,
  ] = useState(null);

  const [
    materials,
    setMaterials,
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
    async function loadMaterials() {
      if (!reportId) {
        setIsLoading(
          false
        );

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

      const {
        data:
          materialsData,

        error:
          materialsError,
      } =
        await supabase
          .from(
            'daily_report_materials'
          )
          .select(`
            id,
            daily_report_id,
            movement_type,
            material_name,
            material_code,
            quantity,
            unit,
            supplier_name,
            delivery_reference,
            delivery_time,
            notes,
            created_by,
            created_at,
            updated_at
          `)
          .eq(
            'daily_report_id',
            reportId
          )
          .order(
            'created_at',
            {
              ascending:
                true,
            }
          );

      if (
        materialsError
      ) {
        setErrorMessage(
          materialsError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedMaterials =
        (
          materialsData ||
          []
        ).map(
          (item) => ({
            localId:
              item.id,

            id:
              item.id,

            movementType:
              item.movement_type ||
              'received',

            materialName:
              item.material_name ||
              '',

            materialCode:
              item.material_code ||
              '',

            quantity:
              item.quantity !==
                null &&
              item.quantity !==
                undefined
                ? String(
                    item.quantity
                  )
                : '',

            unit:
              item.unit ||
              '',

            supplierName:
              item.supplier_name ||
              '',

            deliveryReference:
              item.delivery_reference ||
              '',

            deliveryTime:
              item.delivery_time
                ? String(
                    item.delivery_time
                  ).slice(
                    0,
                    5
                  )
                : '',

            notes:
              item.notes ||
              '',
          })
        );

      setMaterials(
        loadedMaterials
      );

      onCountChange?.(
        loadedMaterials.length
      );

      setIsLoading(false);
    }

    loadMaterials();
  }, [
    reportId,
    supabase,
    onCountChange,
  ]);

  function addMaterial() {
    setMaterials(
      (
        currentMaterials
      ) => [
        ...currentMaterials,
        createEmptyMaterial(),
      ]
    );

    setSuccessMessage('');
  }

  function updateMaterial(
    localId,
    field,
    value
  ) {
    setMaterials(
      (
        currentMaterials
      ) =>
        currentMaterials.map(
          (item) =>
            item.localId ===
            localId
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  async function removeMaterial(
    item
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
      item.id
    ) {
      const confirmed =
        window.confirm(
          `Remove ${
            item.materialName ||
            'this material record'
          } from the Daily Report?`
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
            'daily_report_materials'
          )
          .delete()
          .eq(
            'id',
            item.id
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

    setMaterials(
      (
        currentMaterials
      ) => {
        const nextMaterials =
          currentMaterials.filter(
            (
              currentItem
            ) =>
              currentItem.localId !==
              item.localId
          );

        onCountChange?.(
          nextMaterials.length
        );

        return nextMaterials;
      }
    );
  }

  async function saveMaterials(
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
      const item
      of materials
    ) {
      const materialName =
        item.materialName.trim();

      if (
        !materialName
      ) {
        setErrorMessage(
          'Material name is required for every material record.'
        );

        setIsSaving(false);
        return;
      }

      const quantity =
        numericValue(
          item.quantity
        );

      if (
        quantity ===
          null ||
        quantity < 0
      ) {
        setErrorMessage(
          `${materialName}: quantity must be zero or greater.`
        );

        setIsSaving(false);
        return;
      }

      if (
        ![
          'received',
          'used',
        ].includes(
          item.movementType
        )
      ) {
        setErrorMessage(
          `${materialName}: invalid movement type.`
        );

        setIsSaving(false);
        return;
      }

      const payload = {
        daily_report_id:
          report.id,

        movement_type:
          item.movementType,

        material_name:
          materialName,

        material_code:
          item.materialCode.trim() ||
          null,

        quantity,

        unit:
          item.unit.trim() ||
          null,

        supplier_name:
          item.supplierName.trim() ||
          null,

        delivery_reference:
          item.deliveryReference.trim() ||
          null,

        delivery_time:
          item.deliveryTime ||
          null,

        notes:
          item.notes.trim() ||
          null,
      };

      let result;

      if (
        item.id
      ) {
        result =
          await supabase
            .from(
              'daily_report_materials'
            )
            .update(
              payload
            )
            .eq(
              'id',
              item.id
            )
            .select(`
              id,
              daily_report_id,
              movement_type,
              material_name,
              material_code,
              quantity,
              unit,
              supplier_name,
              delivery_reference,
              delivery_time,
              notes
            `)
            .single();
      } else {
        result =
          await supabase
            .from(
              'daily_report_materials'
            )
            .insert({
              ...payload,

              created_by:
                userId,
            })
            .select(`
              id,
              daily_report_id,
              movement_type,
              material_name,
              material_code,
              quantity,
              unit,
              supplier_name,
              delivery_reference,
              delivery_time,
              notes
            `)
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

      setMaterials(
        (
          currentMaterials
        ) =>
          currentMaterials.map(
            (
              currentItem
            ) =>
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

    onCountChange?.(
      materials.length
    );

    setSuccessMessage(
      'Materials information saved successfully.'
    );

    setIsSaving(false);
  }

  const receivedRecords =
    materials.filter(
      (item) =>
        item.movementType ===
        'received'
    );

  const usedRecords =
    materials.filter(
      (item) =>
        item.movementType ===
        'used'
    );

  const uniqueSuppliers =
    new Set(
      materials
        .map(
          (item) =>
            item.supplierName
              .trim()
              .toLowerCase()
        )
        .filter(
          Boolean
        )
    ).size;

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
          06 · MATERIALS
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Materials...
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
              06 · MATERIALS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Daily materials summary
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              {project?.name ||
                'Project'} material
              receipts and daily
              consumption records.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                addMaterial
              }
            >
              + Add Material
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
            label="RECORDS"
            value={
              materials.length
            }
          />

          <SummaryCard
            label="RECEIVED"
            value={
              receivedRecords.length
            }
            emphasis="success"
          />

          <SummaryCard
            label="USED"
            value={
              usedRecords.length
            }
          />

          <SummaryCard
            label="SUPPLIERS"
            value={
              uniqueSuppliers
            }
          />
        </div>
      </section>

      <form
        onSubmit={
          saveMaterials
        }
      >
        {materials.length ===
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
              NO MATERIALS RECORDED
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Add the first material movement
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Record materials
              received or used
              during this reporting
              period.
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
                    addMaterial
                  }
                >
                  + Add Material
                </button>
              </div>
            )}
          </section>
        ) : (
          materials.map(
            (
              item,
              index
            ) => (
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
                      MATERIAL{' '}
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
                      {item.materialName ||
                        'New Material'}
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
                        item.movementType ===
                        'received'
                          ? styles.statusApproved
                          : styles.statusSubmitted
                      }`}
                    >
                      {formatMovementType(
                        item.movementType
                      )}
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        style={
                          dangerButtonStyle
                        }
                        onClick={() =>
                          removeMaterial(
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
                    display:
                      'grid',

                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',

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
                      Movement type
                    </span>

                    <select
                      value={
                        item.movementType
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'movementType',
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
                      <option value="received">
                        Received
                      </option>

                      <option value="used">
                        Used
                      </option>
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
                      Material name
                    </span>

                    <input
                      type="text"
                      value={
                        item.materialName
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'materialName',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="e.g. Concrete"
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
                      Material code
                    </span>

                    <input
                      type="text"
                      value={
                        item.materialCode
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'materialCode',
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
                      Quantity
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={
                        item.quantity
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'quantity',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="0"
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
                      Unit
                    </span>

                    <input
                      type="text"
                      value={
                        item.unit
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'unit',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="m², m³, ea, kg..."
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
                      Supplier
                    </span>

                    <input
                      type="text"
                      value={
                        item.supplierName
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'supplierName',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Supplier name"
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
                      Delivery reference
                    </span>

                    <input
                      type="text"
                      value={
                        item.deliveryReference
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'deliveryReference',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="PO, ticket, invoice..."
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
                      Delivery time
                    </span>

                    <input
                      type="time"
                      value={
                        item.deliveryTime
                      }
                      onChange={(
                        event
                      ) =>
                        updateMaterial(
                          item.localId,
                          'deliveryTime',
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

                  <div
                    style={{
                      padding:
                        '11px 12px',

                      border:
                        '1px solid #e2e8f0',

                      borderRadius:
                        '8px',

                      background:
                        '#f8fafc',
                    }}
                  >
                    <div
                      style={
                        labelStyle
                      }
                    >
                      MOVEMENT
                    </div>

                    <div
                      style={{
                        marginTop:
                          '5px',

                        color:
                          item.movementType ===
                          'received'
                            ? '#087f73'
                            : '#0b5fa5',

                        fontSize:
                          '0.9rem',

                        fontWeight:
                          800,
                      }}
                    >
                      {formatQuantity(
                        item.quantity,
                        item.unit
                      )}{' '}
                      {formatMovementType(
                        item.movementType
                      ).toLowerCase()}
                    </div>
                  </div>
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
                    Material notes
                  </span>

                  <textarea
                    rows={3}
                    value={
                      item.notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateMaterial(
                        item.localId,
                        'notes',
                        event.target.value
                      )
                    }
                    disabled={
                      isReadOnly
                    }
                    placeholder="Delivery conditions, shortages, damaged material or other observations..."
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
              </section>
            )
          )
        )}

        {materials.length >
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
                  : 'Save Materials'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
