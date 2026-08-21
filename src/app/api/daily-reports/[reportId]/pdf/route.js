import React from 'react';

import {
  NextResponse,
} from 'next/server';

import {
  pdf,
} from '@react-pdf/renderer';

import {
  createServerClient,
} from '@supabase/ssr';

import {
  cookies,
} from 'next/headers';

import DailyReportPdfDocument from '../../../../dashboard/projects/daily-reports/pdf/DailyReportPdfDocument';

import {
  buildPdfFileName,
} from '../../../../dashboard/projects/daily-reports/pdf/helpers';

const STORAGE_BUCKET =
  'daily-report-attachments';

const SIGNED_URL_DURATION =
  60 * 60;

function createSupabaseServerClient() {
  const cookieStore =
    cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet
        ) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            // Route Handler read-only fallback.
          }
        },
      },
    }
  );
}

async function getWorkforceWithRoles(
  supabase,
  reportId
) {
  const {
    data:
      workforceData,

    error:
      workforceError,
  } =
    await supabase
      .from(
        'daily_report_workforce'
      )
      .select(`
        id,
        daily_report_id,
        company_name,
        crew_name,
        supervisor_name,
        work_description,
        regular_hours,
        overtime_hours,
        notes,
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
          ascending: true,
        }
      );

  if (
    workforceError
  ) {
    throw workforceError;
  }

  const workforce =
    workforceData ||
    [];

  const workforceIds =
    workforce.map(
      (item) =>
        item.id
    );

  if (
    workforceIds.length ===
    0
  ) {
    return [];
  }

  const {
    data:
      rolesData,

    error:
      rolesError,
  } =
    await supabase
      .from(
        'daily_report_workforce_roles'
      )
      .select(`
        id,
        workforce_id,
        role_name,
        worker_count,
        created_at,
        updated_at
      `)
      .in(
        'workforce_id',
        workforceIds
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

  if (
    rolesError
  ) {
    throw rolesError;
  }

  const roles =
    rolesData ||
    [];

  return workforce.map(
    (crew) => ({
      ...crew,

      roles:
        roles.filter(
          (role) =>
            role.workforce_id ===
            crew.id
        ),
    })
  );
}

async function getAttachmentsWithSignedUrls(
  supabase,
  reportId
) {
  const {
    data,
    error,
  } =
    await supabase
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
          ascending: true,
        }
      );

  if (error) {
    throw error;
  }

  const attachments =
    data ||
    [];

  return Promise.all(
    attachments.map(
      async (
        attachment
      ) => {
        const bucket =
          attachment.storage_bucket ||
          STORAGE_BUCKET;

        const {
          data:
            signedData,

          error:
            signedError,
        } =
          await supabase.storage
            .from(
              bucket
            )
            .createSignedUrl(
              attachment.storage_path,
              SIGNED_URL_DURATION
            );

        if (
          signedError
        ) {
          return {
            ...attachment,

            signed_url:
              null,

            pdf_image_url:
              null,
          };
        }

        return {
          ...attachment,

          signed_url:
            signedData
              ?.signedUrl ||
            null,

          pdf_image_url:
            attachment.attachment_type ===
            'photo'
              ? signedData
                  ?.signedUrl ||
                null
              : null,
        };
      }
    )
  );
}

export async function GET(
  request,
  {
    params,
  }
) {
  try {
    const reportId =
      params?.reportId;

    if (
      !reportId
    ) {
      return NextResponse.json(
        {
          error:
            'Daily Report ID is required.',
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createSupabaseServerClient();

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
      return NextResponse.json(
        {
          error:
            'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    const {
      data:
        report,

      error:
        reportError,
    } =
      await supabase
        .from(
          'daily_reports'
        )
        .select(`
          id,
          organization_id,
          project_id,
          report_number,
          report_date,
          status,
          work_start_time,
          work_end_time,
          general_notes,
          submitted_by,
          submitted_at,
          reviewed_by,
          reviewed_at,
          approved_by,
          approved_at,
          created_at,
          updated_at
        `)
        .eq(
          'id',
          reportId
        )
        .single();

    if (
      reportError ||
      !report
    ) {
      return NextResponse.json(
        {
          error:
            reportError
              ?.message ||
            'Daily Report not found.',
        },
        {
          status: 404,
        }
      );
    }

    const [
      projectResult,
      weatherResult,
      productionResult,
      equipmentResult,
      materialsResult,
      issuesResult,
      notesResult,
      safetyResult,
      approvalHistoryResult,
      workforce,
      attachments,
    ] =
      await Promise.all([
        supabase
          .from(
            'projects'
          )
          .select(`
            id,
            organization_id,
            code,
            name,
            client_name
          `)
          .eq(
            'id',
            report.project_id
          )
          .single(),

        supabase
          .from(
            'daily_report_weather'
          )
          .select(`
            id,
            daily_report_id,
            period,
            weather_condition,
            temperature,
            temperature_unit,
            site_condition,
            production_impact,
            impact_notes,
            condition,
            organization_id,
            project_id,
            temperature_min,
            temperature_max,
            rainfall,
            wind_condition,
            impact_hours,
            notes
          `)
          .eq(
            'daily_report_id',
            reportId
          ),

        supabase
          .from(
            'daily_report_production'
          )
          .select(`
            id,
            daily_report_id,
            location_id,
            project_service_id,
            location_service_quantity_id,
            location_name,
            service_code,
            service_name,
            unit,
            planned_quantity,
            actual_quantity,
            cumulative_quantity,
            production_status,
            variance_reason,
            variance_notes,
            notes,
            source,
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
              ascending: true,
            }
          ),

        supabase
          .from(
            'daily_report_equipment'
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
              ascending: true,
            }
          ),

        supabase
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
              ascending: true,
            }
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

        supabase
          .from(
            'daily_report_notes'
          )
          .select(`
            id,
            daily_report_id,
            category,
            title,
            content,
            location_name,
            service_name,
            location_id,
            project_service_id,
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
              ascending: true,
            }
          ),

        supabase
          .from(
            'daily_report_safety'
          )
          .select(`
            id,
            daily_report_id,
            overall_status,
            toolbox_talk_held,
            toolbox_talk_topic,
            toolbox_talk_attendees,
            safety_inspection_completed,
            inspector_name,
            ppe_compliance,
            incidents_count,
            near_misses_count,
            unsafe_conditions_count,
            stop_work_event,
            stop_work_description,
            corrective_actions_summary,
            general_notes,
            created_by,
            created_at,
            updated_at
          `)
          .eq(
            'daily_report_id',
            reportId
          )
          .maybeSingle(),

        supabase
          .from(
            'daily_report_approval_history'
          )
          .select(`
            id,
            daily_report_id,
            action,
            from_status,
            to_status,
            comments,
            performed_by,
            performed_at
          `)
          .eq(
            'daily_report_id',
            reportId
          )
          .order(
            'performed_at',
            {
              ascending: true,
            }
          ),

        getWorkforceWithRoles(
          supabase,
          reportId
        ),

        getAttachmentsWithSignedUrls(
          supabase,
          reportId
        ),
      ]);

    const queryError =
      projectResult.error ||
      weatherResult.error ||
      productionResult.error ||
      equipmentResult.error ||
      materialsResult.error ||
      issuesResult.error ||
      notesResult.error ||
      safetyResult.error ||
      approvalHistoryResult.error;

    if (
      queryError
    ) {
      throw queryError;
    }

    const project =
      projectResult.data;

    if (
      !project
    ) {
      return NextResponse.json(
        {
          error:
            'Project not found.',
        },
        {
          status: 404,
        }
      );
    }

    const document =
      React.createElement(
        DailyReportPdfDocument,
        {
          report,

          project,

          weather:
            weatherResult.data ||
            [],

          workforce,

          production:
            productionResult.data ||
            [],

          equipment:
            equipmentResult.data ||
            [],

          materials:
            materialsResult.data ||
            [],

          issues:
            issuesResult.data ||
            [],

          notes:
            notesResult.data ||
            [],

          attachments,

          safety:
            safetyResult.data ||
            null,

          approvalHistory:
            approvalHistoryResult.data ||
            [],
        }
      );

    const pdfInstance =
      pdf(
        document
      );

    const blob =
      await pdfInstance.toBlob();

    const arrayBuffer =
      await blob.arrayBuffer();

    const fileName =
      buildPdfFileName({
        project,
        report,
      });

    return new Response(
      arrayBuffer,
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="${fileName}"`,

          'Cache-Control':
            'no-store, max-age=0',
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      'Daily Report PDF generation error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'The Daily Report PDF could not be generated.',
      },
      {
        status: 500,
      }
    );
  }
}
