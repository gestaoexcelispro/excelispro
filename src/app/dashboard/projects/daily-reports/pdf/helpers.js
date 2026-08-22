export function safeText(
  value,
  fallback = '—'
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const text =
    String(
      value
    ).trim();

  return text ||
    fallback;
}

export function formatDate(
  value,
  fallback = '—'
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }
  ).format(
    date
  );
}

export function formatDateTime(
  value,
  fallback = '—'
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  ).format(
    date
  );
}

export function formatTime(
  value,
  fallback = '—'
) {
  if (!value) {
    return fallback;
  }

  const text =
    String(
      value
    );

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return fallback;
  }

  const hour =
    Number(
      match[1]
    );

  const minute =
    Number(
      match[2]
    );

  if (
    !Number.isInteger(
      hour
    ) ||
    !Number.isInteger(
      minute
    )
  ) {
    return fallback;
  }

  const period =
    hour >= 12
      ? 'PM'
      : 'AM';

  const normalizedHour =
    hour % 12 || 12;

  return `${normalizedHour}:${String(
    minute
  ).padStart(
    2,
    '0'
  )} ${period}`;
}

export function calculateWorkPeriod(
  start,
  end
) {
  if (
    !start ||
    !end
  ) {
    return '—';
  }

  const startMatch =
    String(
      start
    ).match(
      /^(\d{1,2}):(\d{2})/
    );

  const endMatch =
    String(
      end
    ).match(
      /^(\d{1,2}):(\d{2})/
    );

  if (
    !startMatch ||
    !endMatch
  ) {
    return '—';
  }

  const startMinutes =
    Number(
      startMatch[1]
    ) *
      60 +
    Number(
      startMatch[2]
    );

  const endMinutes =
    Number(
      endMatch[1]
    ) *
      60 +
    Number(
      endMatch[2]
    );

  const difference =
    endMinutes -
    startMinutes;

  if (
    difference < 0
  ) {
    return '—';
  }

  const hours =
    Math.floor(
      difference /
        60
    );

  const minutes =
    difference %
    60;

  return `${hours}h ${String(
    minutes
  ).padStart(
    2,
    '0'
  )}m`;
}

export function formatNumber(
  value,
  options = {}
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return '—';
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        options.maximumFractionDigits ??
        2,

      minimumFractionDigits:
        options.minimumFractionDigits ??
        0,
    }
  ).format(
    numeric
  );
}

export function formatQuantity(
  value,
  unit = ''
) {
  const formatted =
    formatNumber(
      value
    );

  if (
    formatted ===
    '—'
  ) {
    return formatted;
  }

  const normalizedUnit =
    String(
      unit || ''
    ).trim();

  return normalizedUnit
    ? `${formatted} ${normalizedUnit}`
    : formatted;
}

export function formatPercentage(
  value,
  decimals = 1
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return '—';
  }

  return `${numeric.toFixed(
    decimals
  )}%`;
}

export function formatReportNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const text =
    String(
      value
    ).trim();

  if (
    /^DR-/i.test(
      text
    )
  ) {
    return text.toUpperCase();
  }

  const numeric =
    Number(
      value
    );

  if (
    Number.isInteger(
      numeric
    )
  ) {
    return `DR-${String(
      numeric
    ).padStart(
      4,
      '0'
    )}`;
  }

  return text;
}

export function formatReportStatus(
  value
) {
  const labels = {
    draft:
      'Draft',

    submitted:
      'Submitted',

    reviewed:
      'Reviewed',

    approved:
      'Approved',
  };

  return (
    labels[value] ||
    safeText(
      value,
      'Draft'
    )
  );
}

export function formatWeatherCondition(
  value
) {
  const labels = {
    clear:
      'Clear',

    partly_cloudy:
      'Partly Cloudy',

    cloudy:
      'Cloudy',

    light_rain:
      'Light Rain',

    rain:
      'Rain',

    heavy_rain:
      'Heavy Rain',

    storm:
      'Storm',

    snow:
      'Snow',

    fog:
      'Fog',

    other:
      'Other',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatWindCondition(
  value
) {
  const labels = {
    calm:
      'Calm',

    light:
      'Light',

    moderate:
      'Moderate',

    strong:
      'Strong',

    severe:
      'Severe',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatSiteCondition(
  value
) {
  const labels = {
    dry:
      'Dry',

    damp:
      'Damp',

    wet:
      'Wet',

    muddy:
      'Muddy',

    frozen:
      'Frozen',

    restricted:
      'Restricted',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatProductionImpact(
  value
) {
  const labels = {
    none:
      'None',

    minor:
      'Minor',

    moderate:
      'Moderate',

    severe:
      'Severe',

    stopped:
      'Production Stopped',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatProductionStatus(
  value
) {
  const labels = {
    not_started:
      'Not Started',

    in_progress:
      'In Progress',

    completed:
      'Completed',

    behind_plan:
      'Behind Plan',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatOperatingStatus(
  value
) {
  const labels = {
    operating:
      'Operating',

    idle:
      'Idle',

    maintenance:
      'Maintenance',

    out_of_service:
      'Out of Service',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatMovementType(
  value
) {
  const labels = {
    received:
      'Received',

    used:
      'Used',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatIssueType(
  value
) {
  const labels = {
    general:
      'General',

    production:
      'Production',

    material:
      'Material',

    equipment:
      'Equipment',

    design:
      'Design',

    quality:
      'Quality',

    safety:
      'Safety',

    coordination:
      'Coordination',

    weather:
      'Weather',

    other:
      'Other',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatSeverity(
  value
) {
  const labels = {
    low:
      'Low',

    medium:
      'Medium',

    high:
      'High',

    critical:
      'Critical',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatIssueStatus(
  value
) {
  const labels = {
    open:
      'Open',

    in_progress:
      'In Progress',

    resolved:
      'Resolved',

    closed:
      'Closed',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatNoteCategory(
  value
) {
  const labels = {
    general:
      'General',

    safety:
      'Safety',

    quality:
      'Quality',

    coordination:
      'Coordination',

    inspection:
      'Inspection',

    visitor:
      'Visitor',

    other:
      'Other',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatSafetyStatus(
  value
) {
  const labels = {
    normal:
      'Normal',

    attention:
      'Attention',

    critical:
      'Critical',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatPpeCompliance(
  value
) {
  const labels = {
    compliant:
      'Compliant',

    minor_issues:
      'Minor Issues',

    non_compliant:
      'Non-Compliant',

    not_applicable:
      'Not Applicable',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatApprovalAction(
  value
) {
  const labels = {
    created:
      'Created',

    submitted:
      'Submitted',

    reviewed:
      'Reviewed',

    approved:
      'Approved',

    returned:
      'Returned',

    reopened:
      'Reopened',
  };

  return (
    labels[value] ||
    formatEnumLabel(
      value
    )
  );
}

export function formatEnumLabel(
  value
) {
  if (!value) {
    return '—';
  }

  return String(
    value
  )
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

export function getTemperatureLabel(
  min,
  max,
  unit = 'F'
) {
  const normalizedUnit =
    unit === 'C'
      ? 'C'
      : 'F';

  const minValue =
    min === null ||
    min === undefined ||
    min === ''
      ? null
      : Number(
          min
        );

  const maxValue =
    max === null ||
    max === undefined ||
    max === ''
      ? null
      : Number(
          max
        );

  const validMin =
    Number.isFinite(
      minValue
    );

  const validMax =
    Number.isFinite(
      maxValue
    );

  if (
    !validMin &&
    !validMax
  ) {
    return '—';
  }

  if (
    validMin &&
    validMax
  ) {
    return `${formatNumber(
      minValue,
      {
        maximumFractionDigits:
          1,
      }
    )}–${formatNumber(
      maxValue,
      {
        maximumFractionDigits:
          1,
      }
    )} °${normalizedUnit}`;
  }

  const singleValue =
    validMin
      ? minValue
      : maxValue;

  return `${formatNumber(
    singleValue,
    {
      maximumFractionDigits:
        1,
    }
  )} °${normalizedUnit}`;
}

export function getProductionProgress(
  cumulativeQuantity,
  scopeQuantity
) {
  const cumulative =
    Number(
      cumulativeQuantity
    );

  const scope =
    Number(
      scopeQuantity
    );

  if (
    !Number.isFinite(
      cumulative
    ) ||
    !Number.isFinite(
      scope
    ) ||
    scope <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (
        cumulative /
        scope
      ) *
        100
    )
  );
}

export function getVariance(
  planned,
  actual
) {
  const plannedValue =
    Number(
      planned
    );

  const actualValue =
    Number(
      actual
    );

  if (
    !Number.isFinite(
      plannedValue
    ) ||
    !Number.isFinite(
      actualValue
    )
  ) {
    return null;
  }

  return (
    actualValue -
    plannedValue
  );
}

export function calculateWorkforceTotals(
  workforce = []
) {
  return workforce.reduce(
    (
      totals,
      crew
    ) => {
      const roles =
        crew.roles ||
        crew.workforce_roles ||
        [];

      const workers =
        roles.reduce(
          (
            workerTotal,
            role
          ) =>
            workerTotal +
            (
              Number(
                role.worker_count
              ) ||
              0
            ),
          0
        );

      const regularHours =
        Number(
          crew.regular_hours
        ) ||
        0;

      const overtimeHours =
        Number(
          crew.overtime_hours
        ) ||
        0;

      totals.crews +=
        1;

      totals.workers +=
        workers;

      totals.regularLaborHours +=
        workers *
        regularHours;

      totals.overtimeLaborHours +=
        workers *
        overtimeHours;

      totals.totalLaborHours +=
        workers *
        (
          regularHours +
          overtimeHours
        );

      return totals;
    },
    {
      crews: 0,
      workers: 0,
      regularLaborHours: 0,
      overtimeLaborHours: 0,
      totalLaborHours: 0,
    }
  );
}

export function calculateEquipmentTotals(
  equipment = []
) {
  return equipment.reduce(
    (
      totals,
      item
    ) => {
      const quantity =
        Number(
          item.quantity
        ) ||
        0;

      const hoursUsed =
        Number(
          item.hours_used
        ) ||
        0;

      const idleHours =
        Number(
          item.idle_hours
        ) ||
        0;

      totals.records +=
        1;

      totals.units +=
        quantity;

      totals.operatingHours +=
        quantity *
        hoursUsed;

      totals.idleHours +=
        quantity *
        idleHours;

      if (
        item.operating_status ===
          'maintenance' ||
        item.operating_status ===
          'out_of_service'
      ) {
        totals.unavailableUnits +=
          quantity;
      }

      return totals;
    },
    {
      records: 0,
      units: 0,
      operatingHours: 0,
      idleHours: 0,
      unavailableUnits: 0,
    }
  );
}

export function calculateMaterialTotals(
  materials = []
) {
  const suppliers =
    new Set();

  let received =
    0;

  let used =
    0;

  materials.forEach(
    (item) => {
      if (
        item.movement_type ===
        'received'
      ) {
        received +=
          1;
      }

      if (
        item.movement_type ===
        'used'
      ) {
        used +=
          1;
      }

      const supplier =
        String(
          item.supplier_name ||
          ''
        )
          .trim()
          .toLowerCase();

      if (
        supplier
      ) {
        suppliers.add(
          supplier
        );
      }
    }
  );

  return {
    records:
      materials.length,

    received,

    used,

    suppliers:
      suppliers.size,
  };
}

export function calculateIssueTotals(
  issues = []
) {
  return {
    total:
      issues.length,

    open:
      issues.filter(
        (item) =>
          item.status ===
            'open' ||
          item.status ===
            'in_progress'
      ).length,

    critical:
      issues.filter(
        (item) =>
          item.severity ===
          'critical'
      ).length,

    impacted:
      issues.filter(
        (item) =>
          item.production_impact &&
          item.production_impact !==
            'none'
      ).length,

    constraintCandidates:
      issues.filter(
        (item) =>
          Boolean(
            item.create_constraint
          )
      ).length,
  };
}

export function calculateAttachmentTotals(
  attachments = []
) {
  return {
    total:
      attachments.length,

    photos:
      attachments.filter(
        (item) =>
          item.attachment_type ===
          'photo'
      ).length,

    videos:
      attachments.filter(
        (item) =>
          item.attachment_type ===
          'video'
      ).length,

    documents:
      attachments.filter(
        (item) =>
          item.attachment_type ===
          'document'
      ).length,

    others:
      attachments.filter(
        (item) =>
          ![
            'photo',
            'video',
            'document',
          ].includes(
            item.attachment_type
          )
      ).length,
  };
}

export function sortWeatherPeriods(
  weather = []
) {
  const order = {
    morning: 1,
    afternoon: 2,
    evening: 3,
  };

  return [
    ...weather,
  ].sort(
    (
      a,
      b
    ) =>
      (
        order[
          a.period
        ] ||
        99
      ) -
      (
        order[
          b.period
        ] ||
        99
      )
  );
}

export function sortAttachments(
  attachments = []
) {
  return [
    ...attachments,
  ].sort(
    (
      a,
      b
    ) => {
      const dateA =
        new Date(
          a.captured_at ||
          a.created_at ||
          0
        ).getTime();

      const dateB =
        new Date(
          b.captured_at ||
          b.created_at ||
          0
        ).getTime();

      return (
        dateA -
        dateB
      );
    }
  );
}

export function splitAttachments(
  attachments = []
) {
  const ordered =
    sortAttachments(
      attachments
    );

  return {
    photos:
      ordered.filter(
        (item) =>
          item.attachment_type ===
          'photo'
      ),

    otherAttachments:
      ordered.filter(
        (item) =>
          item.attachment_type !==
          'photo'
      ),
  };
}

export function formatFileSize(
  bytes
) {
  const value =
    Number(
      bytes
    );

  if (
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {
    return '—';
  }

  if (
    value <
    1024
  ) {
    return `${value} B`;
  }

  const kb =
    value /
    1024;

  if (
    kb <
    1024
  ) {
    return `${kb.toFixed(
      1
    )} KB`;
  }

  const mb =
    kb /
    1024;

  if (
    mb <
    1024
  ) {
    return `${mb.toFixed(
      1
    )} MB`;
  }

  const gb =
    mb /
    1024;

  return `${gb.toFixed(
    2
  )} GB`;
}

export function buildPhotoCaption(
  attachment
) {
  const parts =
    [];

  if (
    attachment.location_name
  ) {
    parts.push(
      attachment.location_name
    );
  }

  if (
    attachment.service_name
  ) {
    parts.push(
      attachment.service_name
    );
  }

  if (
    attachment.captured_at
  ) {
    parts.push(
      formatDateTime(
        attachment.captured_at
      )
    );
  }

  return parts.length
    ? parts.join(
        ' · '
      )
    : 'No linked context';
}

export function buildPdfFileName({
  project,
  report,
}) {
  const projectCode =
    sanitizeFileSegment(
      project?.code ||
      'Project'
    );

  const reportNumber =
    sanitizeFileSegment(
      formatReportNumber(
        report?.report_number
      )
    );

  const reportDate =
    report?.report_date
      ? String(
          report.report_date
        ).slice(
          0,
          10
        )
      : 'undated';

  return `${projectCode}_Daily-Report_${reportNumber}_${reportDate}.pdf`;
}

export function sanitizeFileSegment(
  value
) {
  return String(
    value ||
    ''
  )
    .normalize(
      'NFD'
    )
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
    ) ||
    'file';
}

export function getPhotoSource(
  attachment
) {
  return (
    attachment.pdf_image_url ||
    attachment.signed_url ||
    attachment.signedUrl ||
    attachment.image_url ||
    null
  );
}

export function getPhotoTitle(
  attachment,
  index
) {
  return (
    attachment.title ||
    attachment.file_name ||
    `Photo ${String(
      index + 1
    ).padStart(
      2,
      '0'
    )}`
  );
}

export function shortUserId(
  value
) {
  if (!value) {
    return 'System';
  }

  const text =
    String(
      value
    );

  if (
    text.length <=
    12
  ) {
    return text;
  }

  return `${text.slice(
    0,
    8
  )}…`;
}
