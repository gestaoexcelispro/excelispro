'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createClient } from '../../../../../../../lib/supabase/client';

import styles from '../../daily-reports.module.css';

const STORAGE_BUCKET =
  'daily-report-attachments';

const MAX_PHOTO_SIZE =
  50 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
  100 * 1024 * 1024;

const MAX_VIDEO_SIZE =
  500 * 1024 * 1024;

const MAX_OTHER_SIZE =
  100 * 1024 * 1024;

const SIGNED_URL_DURATION =
  60 * 60;

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

function getAttachmentType(file) {
  const mimeType =
    file?.type || '';

  if (
    mimeType.startsWith(
      'image/'
    )
  ) {
    return 'photo';
  }

  if (
    mimeType.startsWith(
      'video/'
    )
  ) {
    return 'video';
  }

  const documentMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (
    documentMimeTypes.includes(
      mimeType
    )
  ) {
    return 'document';
  }

  return 'other';
}

function getMaximumFileSize(
  type
) {
  if (
    type ===
    'photo'
  ) {
    return MAX_PHOTO_SIZE;
  }

  if (
    type ===
    'video'
  ) {
    return MAX_VIDEO_SIZE;
  }

  if (
    type ===
    'document'
  ) {
    return MAX_DOCUMENT_SIZE;
  }

  return MAX_OTHER_SIZE;
}

function getMaximumFileSizeLabel(
  type
) {
  if (
    type ===
    'photo'
  ) {
    return '50 MB';
  }

  if (
    type ===
    'video'
  ) {
    return '500 MB';
  }

  return '100 MB';
}

function formatAttachmentType(
  type
) {
  const labels = {
    photo: 'Photo',
    video: 'Video',
    document: 'Document',
    other: 'Other',
  };

  return (
    labels[type] ||
    type
  );
}

function formatFileSize(
  bytes
) {
  if (
    bytes === null ||
    bytes === undefined
  ) {
    return '—';
  }

  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      1
    )} KB`;
  }

  const megabytes =
    kilobytes /
    1024;

  if (
    megabytes <
    1024
  ) {
    return `${megabytes.toFixed(
      1
    )} MB`;
  }

  const gigabytes =
    megabytes /
    1024;

  return `${gigabytes.toFixed(
    2
  )} GB`;
}

function sanitizeFileName(
  fileName
) {
  const lastDot =
    fileName.lastIndexOf(
      '.'
    );

  const extension =
    lastDot >= 0
      ? fileName
          .slice(
            lastDot
          )
          .toLowerCase()
      : '';

  const baseName =
    lastDot >= 0
      ? fileName.slice(
          0,
          lastDot
        )
      : fileName;

  const safeBaseName =
    baseName
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      )
      .replace(
        /^-|-$/g,
        ''
      )
      .slice(
        0,
        80
      );

  return `${
    safeBaseName ||
    'file'
  }${extension}`;
}

function createStoragePath({
  projectId,
  reportId,
  fileName,
}) {
  const safeFileName =
    sanitizeFileName(
      fileName
    );

  const uniquePart =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  return `${projectId}/${reportId}/${uniquePart}-${safeFileName}`;
}

function formatCapturedAt(
  value
) {
  if (!value) {
    return '';
  }

  try {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    const offset =
      date.getTimezoneOffset();

    const localDate =
      new Date(
        date.getTime() -
          offset *
            60 *
            1000
      );

    return localDate
      .toISOString()
      .slice(
        0,
        16
      );
  } catch {
    return '';
  }
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

export default function AttachmentsSection({
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

  const fileInputRef =
    useRef(null);

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
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    dragActive,
    setDragActive,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    async function loadAttachments() {
      if (
        !reportId ||
        !projectId
      ) {
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

      const [
        locationsResult,
        servicesResult,
        quantitiesResult,
        attachmentsResult,
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
              'daily_report_attachments'
            )
            .select(`
              id,
              daily_report_id,
              attachment_type,
              file_name,
              storage_bucket,
              storage_path,
              mime_type,
              file_size_bytes,
              title,
              description,
              captured_at,
              location_name,
              service_name,
              location_id,
              project_service_id,
              production_id,
              issue_id,
              uploaded_by,
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
                  false,
              }
            ),
        ]);

      const loadError =
        locationsResult.error ||
        servicesResult.error ||
        quantitiesResult.error ||
        attachmentsResult.error;

      if (
        loadError
      ) {
        setErrorMessage(
          loadError.message
        );

        setIsLoading(false);
        return;
      }

      const loadedAttachments =
        await Promise.all(
          (
            attachmentsResult.data ||
            []
          ).map(
            async (
              item
            ) => {
              let signedUrl =
                '';

              const {
                data:
                  signedData,

                error:
                  signedError,
              } =
                await supabase.storage
                  .from(
                    item.storage_bucket ||
                      STORAGE_BUCKET
                  )
                  .createSignedUrl(
                    item.storage_path,
                    SIGNED_URL_DURATION
                  );

              if (
                !signedError &&
                signedData
                  ?.signedUrl
              ) {
                signedUrl =
                  signedData.signedUrl;
              }

              return {
                ...item,

                title:
                  item.title ||
                  '',

                description:
                  item.description ||
                  '',

                location_id:
                  item.location_id ||
                  '',

                location_name:
                  item.location_name ||
                  '',

                project_service_id:
                  item.project_service_id ||
                  '',

                service_name:
                  item.service_name ||
                  '',

                captured_at:
                  formatCapturedAt(
                    item.captured_at
                  ),

                signedUrl,
              };
            }
          )
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

      setAttachments(
        loadedAttachments
      );

      onCountChange?.(
        loadedAttachments.length
      );

      setIsLoading(false);
    }

    loadAttachments();
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
            (
              location
            ) => [
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

        const names =
          [];

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
        (
          location
        ) => {
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

  const sortedLocations =
    useMemo(
      () =>
        [
          ...locations,
        ].sort(
          (
            a,
            b
          ) => {
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
            (item) =>
              item.location_id ===
              locationId
          )
          .map(
            (item) =>
              item.service_id
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

  function updateAttachment(
    attachmentId,
    field,
    value
  ) {
    setAttachments(
      (
        current
      ) =>
        current.map(
          (item) =>
            item.id ===
            attachmentId
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

  function selectLocation(
    attachment,
    locationId
  ) {
    const location =
      locationMap.get(
        locationId
      );

    setAttachments(
      (
        current
      ) =>
        current.map(
          (item) =>
            item.id ===
            attachment.id
              ? {
                  ...item,

                  location_id:
                    locationId,

                  location_name:
                    location
                      ? locationPathMap.get(
                          location.id
                        ) ||
                        location.name
                      : '',

                  project_service_id:
                    '',

                  service_name:
                    '',
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  function selectService(
    attachment,
    serviceId
  ) {
    const service =
      projectServices.find(
        (item) =>
          item.id ===
          serviceId
      );

    setAttachments(
      (
        current
      ) =>
        current.map(
          (item) =>
            item.id ===
            attachment.id
              ? {
                  ...item,

                  project_service_id:
                    serviceId,

                  service_name:
                    service
                      ?.service_name ||
                    '',
                }
              : item
        )
    );

    setSuccessMessage('');
  }

  async function uploadFiles(
    fileList
  ) {
    if (
      !fileList ||
      fileList.length ===
        0 ||
      !report ||
      !project ||
      !userId
    ) {
      return;
    }

    if (
      report.status !==
      'draft'
    ) {
      setErrorMessage(
        'Attachments cannot be added after the Daily Report leaves Draft status.'
      );

      return;
    }

    const files =
      Array.from(
        fileList
      );

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const uploadedItems =
      [];

    try {
      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];

        const attachmentType =
          getAttachmentType(
            file
          );

        const maximumSize =
          getMaximumFileSize(
            attachmentType
          );

        if (
          file.size >
          maximumSize
        ) {
          throw new Error(
            `${file.name} exceeds the ${getMaximumFileSizeLabel(
              attachmentType
            )} limit for ${formatAttachmentType(
              attachmentType
            ).toLowerCase()} files.`
          );
        }

        setUploadProgress(
          `Uploading ${
            index + 1
          } of ${
            files.length
          }: ${file.name}`
        );

        const storagePath =
          createStoragePath({
            projectId:
              project.id,

            reportId:
              report.id,

            fileName:
              file.name,
          });

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              STORAGE_BUCKET
            )
            .upload(
              storagePath,
              file,
              {
                cacheControl:
                  '3600',

                upsert:
                  false,

                contentType:
                  file.type ||
                  undefined,
              }
            );

        if (
          uploadError
        ) {
          throw new Error(
            `Upload failed for ${file.name}: ${uploadError.message}`
          );
        }

        const {
          data:
            insertedAttachment,

          error:
            insertError,
        } =
          await supabase
            .from(
              'daily_report_attachments'
            )
            .insert({
              daily_report_id:
                report.id,

              attachment_type:
                attachmentType,

              file_name:
                file.name,

              storage_bucket:
                STORAGE_BUCKET,

              storage_path:
                storagePath,

              mime_type:
                file.type ||
                null,

              file_size_bytes:
                file.size,

              title:
                null,

              description:
                null,

              captured_at:
                null,

              location_name:
                null,

              service_name:
                null,

              location_id:
                null,

              project_service_id:
                null,

              production_id:
                null,

              issue_id:
                null,

              uploaded_by:
                userId,
            })
            .select(`
              id,
              daily_report_id,
              attachment_type,
              file_name,
              storage_bucket,
              storage_path,
              mime_type,
              file_size_bytes,
              title,
              description,
              captured_at,
              location_name,
              service_name,
              location_id,
              project_service_id,
              production_id,
              issue_id,
              uploaded_by,
              created_at,
              updated_at
            `)
            .single();

        if (
          insertError
        ) {
          await supabase.storage
            .from(
              STORAGE_BUCKET
            )
            .remove([
              storagePath,
            ]);

          throw new Error(
            `The file was uploaded but its Daily Report record could not be created: ${insertError.message}`
          );
        }

        const {
          data:
            signedData,
        } =
          await supabase.storage
            .from(
              STORAGE_BUCKET
            )
            .createSignedUrl(
              storagePath,
              SIGNED_URL_DURATION
            );

        uploadedItems.push({
          ...insertedAttachment,

          title:
            '',

          description:
            '',

          location_id:
            '',

          location_name:
            '',

          project_service_id:
            '',

          service_name:
            '',

          captured_at:
            '',

          signedUrl:
            signedData
              ?.signedUrl ||
            '',
        });
      }

      setAttachments(
        (
          current
        ) => {
          const next =
            [
              ...uploadedItems.reverse(),
              ...current,
            ];

          onCountChange?.(
            next.length
          );

          return next;
        }
      );

      setSuccessMessage(
        files.length ===
        1
          ? 'File uploaded successfully.'
          : `${files.length} files uploaded successfully.`
      );
    } catch (
      error
    ) {
      setErrorMessage(
        error?.message ||
          'An error occurred while uploading the files.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress('');

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          '';
      }
    }
  }

  async function saveMetadata(
    event
  ) {
    event.preventDefault();

    if (
      isSaving ||
      !report ||
      report.status !==
        'draft'
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      for (
        const attachment
        of attachments
      ) {
        const payload = {
          title:
            attachment.title
              ?.trim() ||
            null,

          description:
            attachment.description
              ?.trim() ||
            null,

          captured_at:
            attachment.captured_at
              ? new Date(
                  attachment.captured_at
                ).toISOString()
              : null,

          location_name:
            attachment.location_name ||
            null,

          service_name:
            attachment.service_name ||
            null,

          location_id:
            attachment.location_id ||
            null,

          project_service_id:
            attachment.project_service_id ||
            null,
        };

        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              'daily_report_attachments'
            )
            .update(
              payload
            )
            .eq(
              'id',
              attachment.id
            );

        if (
          updateError
        ) {
          throw updateError;
        }
      }

      setSuccessMessage(
        'Attachment information saved successfully.'
      );
    } catch (
      error
    ) {
      setErrorMessage(
        error?.message ||
          'Attachment information could not be saved.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAttachment(
    attachment
  ) {
    if (
      isSaving ||
      isUploading ||
      report?.status !==
        'draft'
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${attachment.file_name}" from this Daily Report?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    const {
      error:
        storageError,
    } =
      await supabase.storage
        .from(
          attachment.storage_bucket ||
            STORAGE_BUCKET
        )
        .remove([
          attachment.storage_path,
        ]);

    if (
      storageError
    ) {
      setErrorMessage(
        `The file could not be removed from Storage: ${storageError.message}`
      );

      return;
    }

    const {
      error:
        databaseError,
    } =
      await supabase
        .from(
          'daily_report_attachments'
        )
        .delete()
        .eq(
          'id',
          attachment.id
        );

    if (
      databaseError
    ) {
      setErrorMessage(
        `The file was removed from Storage, but the attachment record could not be deleted: ${databaseError.message}`
      );

      return;
    }

    setAttachments(
      (
        current
      ) => {
        const next =
          current.filter(
            (item) =>
              item.id !==
              attachment.id
          );

        onCountChange?.(
          next.length
        );

        return next;
      }
    );

    setSuccessMessage(
      'Attachment removed successfully.'
    );
  }

  async function openAttachment(
    attachment
  ) {
    setErrorMessage('');

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          attachment.storage_bucket ||
            STORAGE_BUCKET
        )
        .createSignedUrl(
          attachment.storage_path,
          SIGNED_URL_DURATION
        );

    if (
      error ||
      !data?.signedUrl
    ) {
      setErrorMessage(
        error?.message ||
          'The file could not be opened.'
      );

      return;
    }

    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function handleDragOver(
    event
  ) {
    event.preventDefault();

    if (
      report?.status ===
      'draft'
    ) {
      setDragActive(
        true
      );
    }
  }

  function handleDragLeave(
    event
  ) {
    event.preventDefault();

    setDragActive(
      false
    );
  }

  function handleDrop(
    event
  ) {
    event.preventDefault();

    setDragActive(
      false
    );

    if (
      report?.status !==
      'draft'
    ) {
      return;
    }

    uploadFiles(
      event.dataTransfer.files
    );
  }

  const photoCount =
    attachments.filter(
      (item) =>
        item.attachment_type ===
        'photo'
    ).length;

  const videoCount =
    attachments.filter(
      (item) =>
        item.attachment_type ===
        'video'
    ).length;

  const documentCount =
    attachments.filter(
      (item) =>
        item.attachment_type ===
        'document'
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
          09 · PHOTOS & ATTACHMENTS
        </p>

        <h2
          className={
            styles.sectionTitle
          }
        >
          Loading Attachments...
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
              09 · PHOTOS & ATTACHMENTS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              Field documentation
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Photos, videos and
              documents associated
              with {project?.name ||
                'this project'}.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              className={
                styles.primaryButton
              }
              disabled={
                isUploading
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              {isUploading
                ? 'Uploading...'
                : '+ Upload Files'}
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
            label="FILES"
            value={
              attachments.length
            }
            emphasis="success"
          />

          <SummaryCard
            label="PHOTOS"
            value={
              photoCount
            }
          />

          <SummaryCard
            label="VIDEOS"
            value={
              videoCount
            }
          />

          <SummaryCard
            label="DOCUMENTS"
            value={
              documentCount
            }
          />
        </div>
      </section>

      {!isReadOnly && (
        <section
          className={
            styles.infoCard
          }
          style={{
            marginTop:
              '14px',
          }}
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(
              event
            ) =>
              uploadFiles(
                event.target.files
              )
            }
            style={{
              display:
                'none',
            }}
          />

          <div
            role="button"
            tabIndex={
              0
            }
            onClick={() =>
              fileInputRef.current?.click()
            }
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                  'Enter' ||
                event.key ===
                  ' '
              ) {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={
              handleDragOver
            }
            onDragLeave={
              handleDragLeave
            }
            onDrop={
              handleDrop
            }
            style={{
              padding:
                '34px 24px',

              textAlign:
                'center',

              border:
                dragActive
                  ? '2px dashed #0f8f83'
                  : '2px dashed #cbd5e1',

              borderRadius:
                '12px',

              background:
                dragActive
                  ? '#effcf9'
                  : '#f8fafc',

              cursor:
                isUploading
                  ? 'wait'
                  : 'pointer',
            }}
          >
            <div
              style={{
                color:
                  '#061b2f',

                fontSize:
                  '0.9rem',

                fontWeight:
                  800,
              }}
            >
              Drag & drop files here
            </div>

            <div
              style={{
                marginTop:
                  '6px',

                color:
                  '#64748b',

                fontSize:
                  '0.74rem',

                lineHeight:
                  1.6,
              }}
            >
              or click to select files
              <br />
              Photos up to 50 MB · Documents up to 100 MB · Videos up to 500 MB
            </div>

            {uploadProgress && (
              <div
                style={{
                  marginTop:
                    '14px',

                  color:
                    '#087f73',

                  fontSize:
                    '0.74rem',

                  fontWeight:
                    800,
                }}
              >
                {
                  uploadProgress
                }
              </div>
            )}
          </div>
        </section>
      )}

      <form
        onSubmit={
          saveMetadata
        }
      >
        {attachments.length ===
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
              NO ATTACHMENTS
            </p>

            <h2
              className={
                styles.sectionTitle
              }
            >
              No field documentation uploaded
            </h2>

            <p
              className={
                styles.integrationText
              }
            >
              Photos, videos
              and documents
              associated with
              this Daily Report
              will appear here.
            </p>
          </section>
        ) : (
          attachments.map(
            (
              attachment,
              index
            ) => {
              const availableServices =
                getAvailableServices(
                  attachment.location_id
                );

              return (
                <section
                  key={
                    attachment.id
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
                        ATTACHMENT{' '}
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
                        {attachment.title ||
                          attachment.file_name}
                      </h2>

                      <p
                        className={
                          styles.integrationText
                        }
                        style={{
                          marginTop:
                            '4px',
                        }}
                      >
                        {formatAttachmentType(
                          attachment.attachment_type
                        )}{' '}
                        ·{' '}
                        {formatFileSize(
                          attachment.file_size_bytes
                        )}
                      </p>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',

                        gap:
                          '8px',
                      }}
                    >
                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          openAttachment(
                            attachment
                          )
                        }
                      >
                        Open
                      </button>

                      {!isReadOnly && (
                        <button
                          type="button"
                          style={
                            dangerButtonStyle
                          }
                          onClick={() =>
                            removeAttachment(
                              attachment
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {attachment.attachment_type ===
                    'photo' &&
                    attachment.signedUrl && (
                      <div
                        style={{
                          marginBottom:
                            '18px',

                          overflow:
                            'hidden',

                          border:
                            '1px solid #e2e8f0',

                          borderRadius:
                            '10px',

                          background:
                            '#f8fafc',
                        }}
                      >
                        <img
                          src={
                            attachment.signedUrl
                          }
                          alt={
                            attachment.title ||
                            attachment.file_name
                          }
                          style={{
                            display:
                              'block',

                            width:
                              '100%',

                            maxHeight:
                              '520px',

                            objectFit:
                              'contain',
                          }}
                        />
                      </div>
                    )}

                  {attachment.attachment_type ===
                    'video' &&
                    attachment.signedUrl && (
                      <div
                        style={{
                          marginBottom:
                            '18px',

                          overflow:
                            'hidden',

                          border:
                            '1px solid #e2e8f0',

                          borderRadius:
                            '10px',

                          background:
                            '#000000',
                        }}
                      >
                        <video
                          controls
                          preload="metadata"
                          src={
                            attachment.signedUrl
                          }
                          style={{
                            display:
                              'block',

                            width:
                              '100%',

                            maxHeight:
                              '520px',
                          }}
                        />
                      </div>
                    )}

                  {[
                    'document',
                    'other',
                  ].includes(
                    attachment.attachment_type
                  ) && (
                    <div
                      style={{
                        marginBottom:
                          '18px',

                        padding:
                          '18px',

                        border:
                          '1px solid #e2e8f0',

                        borderRadius:
                          '10px',

                        background:
                          '#f8fafc',
                      }}
                    >
                      <div
                        style={{
                          color:
                            '#061b2f',

                          fontSize:
                            '0.8rem',

                          fontWeight:
                            800,

                          wordBreak:
                            'break-word',
                        }}
                      >
                        {
                          attachment.file_name
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            '5px',

                          color:
                            '#64748b',

                          fontSize:
                            '0.7rem',
                        }}
                      >
                        {attachment.mime_type ||
                          formatAttachmentType(
                            attachment.attachment_type
                          )}
                        {' · '}
                        {formatFileSize(
                          attachment.file_size_bytes
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '2fr 1fr',

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
                        Title
                      </span>

                      <input
                        type="text"
                        value={
                          attachment.title
                        }
                        onChange={(
                          event
                        ) =>
                          updateAttachment(
                            attachment.id,
                            'title',
                            event.target.value
                          )
                        }
                        disabled={
                          isReadOnly
                        }
                        placeholder="Optional title"
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
                        Captured at
                      </span>

                      <input
                        type="datetime-local"
                        value={
                          attachment.captured_at
                        }
                        onChange={(
                          event
                        ) =>
                          updateAttachment(
                            attachment.id,
                            'captured_at',
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
                  </div>

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
                          attachment.location_id
                        }
                        onChange={(
                          event
                        ) =>
                          selectLocation(
                            attachment,
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

                        {sortedLocations.map(
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
                          attachment.project_service_id
                        }
                        onChange={(
                          event
                        ) =>
                          selectService(
                            attachment,
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
                      Description
                    </span>

                    <textarea
                      rows={
                        4
                      }
                      value={
                        attachment.description
                      }
                      onChange={(
                        event
                      ) =>
                        updateAttachment(
                          attachment.id,
                          'description',
                          event.target.value
                        )
                      }
                      disabled={
                        isReadOnly
                      }
                      placeholder="Describe what this photo, video or document records..."
                      style={{
                        ...inputStyle,

                        minHeight:
                          '100px',

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
              );
            }
          )
        )}

        {attachments.length >
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
                  isSaving ||
                  isUploading
                }
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save Attachment Information'}
              </button>
            </div>
          )}
      </form>
    </div>
  );
}
