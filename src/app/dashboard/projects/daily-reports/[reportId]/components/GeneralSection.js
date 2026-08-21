'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../../../lib/supabase/client';

export default function GeneralSection({ report, project, onReportChange, onCountChange }) {
  const supabase = useMemo(() => createClient(), []);
  const [reportDate, setReportDate] = useState('');
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!report) return;
    setReportDate(report.report_date || '');
    setWorkStartTime(report.work_start_time ? String(report.work_start_time).slice(0, 5) : '');
    setWorkEndTime(report.work_end_time ? String(report.work_end_time).slice(0, 5) : '');
    setGeneralNotes(report.general_notes || '');
    onCountChange?.(1);
  }, [report, onCountChange]);

  async function handleSave(event) {
    event.preventDefault();
    if (!report?.id || report.status !== 'draft') return;

    setIsSaving(true);
    setMessage('');

    const payload = {
      report_date: reportDate,
      work_start_time: workStartTime || null,
      work_end_time: workEndTime || null,
      general_notes: generalNotes.trim() || null,
    };

    const { data, error } = await supabase
      .from('daily_reports')
      .update(payload)
      .eq('id', report.id)
      .select('*')
      .single();

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    onReportChange?.(data);
    onCountChange?.(1);
    setMessage('General information saved successfully.');
    setIsSaving(false);
  }

  if (!report) return null;

  const readOnly = report.status !== 'draft';

  return (
    <section>
      <div>
        <p>01 · GENERAL INFORMATION</p>
        <h2>Report basics</h2>
        <p>Project, reporting date, work period and general notes for the day.</p>
      </div>

      {message && <p>{message}</p>}

      <form onSubmit={handleSave}>
        <div>
          <label>
            Project
            <input
              type="text"
              value={`${project?.code || 'Unassigned'} · ${project?.name || 'Project'}`}
              disabled
            />
          </label>

          <label>
            Report Date
            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label>
            Work Start
            <input
              type="time"
              value={workStartTime}
              onChange={(event) => setWorkStartTime(event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label>
            Work End
            <input
              type="time"
              value={workEndTime}
              onChange={(event) => setWorkEndTime(event.target.value)}
              disabled={readOnly}
            />
          </label>
        </div>

        <label>
          General Notes
          <textarea
            rows={6}
            maxLength={500}
            value={generalNotes}
            onChange={(event) => setGeneralNotes(event.target.value)}
            disabled={readOnly}
            placeholder="Enter general notes about the day..."
          />
        </label>

        {!readOnly && (
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save General Information'}
          </button>
        )}
      </form>
    </section>
  );
}
