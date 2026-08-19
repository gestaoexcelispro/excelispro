'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import styles from './project-setup.module.css'

function nullableValue(value) {
  const normalizedValue = value.trim()

  return normalizedValue === ''
    ? null
    : normalizedValue
}

function createInitialFormData(
  project,
  suggestedCode
) {
  return {
    code: project?.code || suggestedCode,
    name: project?.name || '',
    client_name: project?.client_name || '',
    status: project?.status || 'planning',
    proposal_number:
      project?.proposal_number || '',
    contract_number:
      project?.contract_number || '',
    contract_value:
      project?.contract_value ?? '',
    currency_code:
      project?.currency_code || 'USD',
    planned_start_date:
      project?.planned_start_date || '',
    planned_finish_date:
      project?.planned_finish_date || '',
    address_line:
      project?.address_line || '',
    neighborhood:
      project?.neighborhood || '',
    city: project?.city || '',
    state_region:
      project?.state_region || '',
    postal_code:
      project?.postal_code || '',
    country_code:
      project?.country_code || 'US',
  }
}

export default function ProjectForm({
  organizationId,
  organizationName,
  userId,
  project,
  suggestedCode,
}) {
  const router = useRouter()
  const isEditing = Boolean(project?.id)

  const [formData, setFormData] =
    useState(() =>
      createInitialFormData(
        project,
        suggestedCode
      )
    )

  const [isSaving, setIsSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSaving(true)

    const supabase = createClient()

    const contractValue =
      formData.contract_value === ''
        ? null
        : Number(formData.contract_value)

    if (
      contractValue !== null &&
      (
        Number.isNaN(contractValue) ||
        contractValue < 0
      )
    ) {
      setErrorMessage(
        'Contract value must be a valid non-negative number.'
      )
      setIsSaving(false)
      return
    }

    if (
      formData.planned_start_date &&
      formData.planned_finish_date &&
      formData.planned_finish_date <
        formData.planned_start_date
    ) {
      setErrorMessage(
        'Planned finish date cannot be earlier than the planned start date.'
      )
      setIsSaving(false)
      return
    }

    const projectPayload = {
      code: formData.code
        .trim()
        .toUpperCase(),

      name: formData.name.trim(),

      client_name: nullableValue(
        formData.client_name
      ),

      status: formData.status,

      proposal_number: nullableValue(
        formData.proposal_number
      ),

      contract_number: nullableValue(
        formData.contract_number
      ),

      contract_value: contractValue,

      currency_code: formData.currency_code
        .trim()
        .toUpperCase(),

      planned_start_date:
        formData.planned_start_date || null,

      planned_finish_date:
        formData.planned_finish_date || null,

      address_line: nullableValue(
        formData.address_line
      ),

      neighborhood: nullableValue(
        formData.neighborhood
      ),

      city: nullableValue(
        formData.city
      ),

      state_region: nullableValue(
        formData.state_region
      ),

      postal_code: nullableValue(
        formData.postal_code
      ),

      country_code: formData.country_code
        .trim()
        .toUpperCase(),
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', project.id)

        if (error) {
          throw error
        }
      } else {
        const {
          data: createdProject,
          error: createError,
        } = await supabase
          .from('projects')
          .insert({
            ...projectPayload,
            organization_id: organizationId,
            created_by: userId,
          })
          .select('id')
          .single()

        if (createError) {
          throw createError
        }

        const {
          error: membershipError,
        } = await supabase
          .from('project_members')
          .upsert(
            {
              project_id: createdProject.id,
              user_id: userId,
              role: 'manager',
            },
            {
              onConflict:
                'project_id,user_id',
            }
          )

        if (membershipError) {
          console.error(
            'Project membership could not be created.',
            membershipError
          )
        }
      }

      router.push(
        '/dashboard/projetos/lista'
      )
      router.refresh()
    } catch (error) {
      if (
        error?.code === '23505'
      ) {
        setErrorMessage(
          'This project code is already in use. Choose another code.'
        )
      } else {
        setErrorMessage(
          error?.message ||
            'The project could not be saved.'
        )
      }

      setIsSaving(false)
    }
  }

  return (
    <>
      <div className={styles.contextBar}>
        <div
          className={
            styles.contextIdentity
          }
        >
          <span
            className={styles.contextIcon}
          >
            OR
          </span>

          <div>
            <p
              className={
                styles.contextLabel
              }
            >
              Organization
            </p>

            <p
              className={
                styles.contextValue
              }
            >
              {organizationName}
            </p>
          </div>
        </div>

        <span
          className={styles.contextMode}
        >
          {isEditing
            ? 'Editing project'
            : 'New project'}
        </span>
      </div>

      <article className={styles.formPanel}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditing
              ? 'Project information'
              : 'Create project'}
          </h2>

          <p
            className={
              styles.formDescription
            }
          >
            Define the project identity,
            commercial references, planned
            dates, and geographic information.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <section className={styles.section}>
            <div
              className={
                styles.sectionHeading
              }
            >
              <h3
                className={
                  styles.sectionTitle
                }
              >
                Project identity
              </h3>

              <p
                className={
                  styles.sectionDescription
                }
              >
                Core information used throughout
                the planning workflow.
              </p>
            </div>

            <div className={styles.grid}>
              <div
                className={`${styles.field} ${styles.span4}`}
              >
                <label
                  className={styles.label}
                  htmlFor="code"
                >
                  Project code
                  <span
                    className={
                      styles.required
                    }
                  >
                    *
                  </span>
                </label>

                <input
                  className={styles.input}
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="RF-0002"
                  required
                />

                <p
                  className={styles.helpText}
                >
                  Unique code within the
                  organization.
                </p>
              </div>

              <div
                className={`${styles.field} ${styles.span8}`}
              >
                <label
                  className={styles.label}
                  htmlFor="name"
                >
                  Project name
                  <span
                    className={
                      styles.required
                    }
                  >
                    *
                  </span>
                </label>

                <input
                  className={styles.input}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Project name"
                  required
                />
              </div>

              <div
                className={`${styles.field} ${styles.span8}`}
              >
                <label
                  className={styles.label}
                  htmlFor="client_name"
                >
                  Client
                </label>

                <input
                  className={styles.input}
                  id="client_name"
                  name="client_name"
                  value={
                    formData.client_name
                  }
                  onChange={handleChange}
                  placeholder="Client or owner"
                />
              </div>

              <div
                className={`${styles.field} ${styles.span4}`}
              >
                <label
                  className={styles.label}
                  htmlFor="status"
                >
                  Project status
                </label>

                <select
                  className={styles.select}
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="planning">
                    Planning
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="on_hold">
                    On hold
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div
              className={
                styles.sectionHeading
              }
            >
              <h3
                className={
                  styles.sectionTitle
                }
              >
                Contract and schedule
              </h3>

              <p
                className={
                  styles.sectionDescription
                }
              >
                Optional project references and
                planned boundaries.
              </p>
            </div>

            <div className={styles.grid}>
              <div
                className={`${styles.field} ${styles.span3}`}
              >
                <label
                  className={styles.label}
                  htmlFor="proposal_number"
                >
                  Proposal number
                </label>

                <input
                  className={styles.input}
                  id="proposal_number"
                  name="proposal_number"
                  value={
                    formData.proposal_number
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span3}`}
              >
                <label
                  className={styles.label}
                  htmlFor="contract_number"
                >
                  Contract number
                </label>

                <input
                  className={styles.input}
                  id="contract_number"
                  name="contract_number"
                  value={
                    formData.contract_number
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span3}`}
              >
                <label
                  className={styles.label}
                  htmlFor="contract_value"
                >
                  Contract value
                </label>

                <input
                  className={styles.input}
                  id="contract_value"
                  name="contract_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formData.contract_value
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span3}`}
              >
                <label
                  className={styles.label}
                  htmlFor="currency_code"
                >
                  Currency
                </label>

                <select
                  className={styles.select}
                  id="currency_code"
                  name="currency_code"
                  value={
                    formData.currency_code
                  }
                  onChange={handleChange}
                >
                  <option value="USD">
                    USD
                  </option>

                  <option value="BRL">
                    BRL
                  </option>

                  <option value="CAD">
                    CAD
                  </option>

                  <option value="EUR">
                    EUR
                  </option>

                  <option value="GBP">
                    GBP
                  </option>
                </select>
              </div>

              <div
                className={`${styles.field} ${styles.span6}`}
              >
                <label
                  className={styles.label}
                  htmlFor="planned_start_date"
                >
                  Planned start date
                </label>

                <input
                  className={styles.input}
                  id="planned_start_date"
                  name="planned_start_date"
                  type="date"
                  value={
                    formData.planned_start_date
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span6}`}
              >
                <label
                  className={styles.label}
                  htmlFor="planned_finish_date"
                >
                  Planned finish date
                </label>

                <input
                  className={styles.input}
                  id="planned_finish_date"
                  name="planned_finish_date"
                  type="date"
                  value={
                    formData.planned_finish_date
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div
              className={
                styles.sectionHeading
              }
            >
              <h3
                className={
                  styles.sectionTitle
                }
              >
                Project location
              </h3>

              <p
                className={
                  styles.sectionDescription
                }
              >
                Geographic information used for
                project identification and
                reporting.
              </p>
            </div>

            <div className={styles.grid}>
              <div
                className={`${styles.field} ${styles.span12}`}
              >
                <label
                  className={styles.label}
                  htmlFor="address_line"
                >
                  Address
                </label>

                <input
                  className={styles.input}
                  id="address_line"
                  name="address_line"
                  value={
                    formData.address_line
                  }
                  onChange={handleChange}
                  placeholder="Street and number"
                />
              </div>

              <div
                className={`${styles.field} ${styles.span6}`}
              >
                <label
                  className={styles.label}
                  htmlFor="neighborhood"
                >
                  Neighborhood or district
                </label>

                <input
                  className={styles.input}
                  id="neighborhood"
                  name="neighborhood"
                  value={
                    formData.neighborhood
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span6}`}
              >
                <label
                  className={styles.label}
                  htmlFor="city"
                >
                  City
                </label>

                <input
                  className={styles.input}
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span4}`}
              >
                <label
                  className={styles.label}
                  htmlFor="state_region"
                >
                  State or region
                </label>

                <input
                  className={styles.input}
                  id="state_region"
                  name="state_region"
                  value={
                    formData.state_region
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span4}`}
              >
                <label
                  className={styles.label}
                  htmlFor="postal_code"
                >
                  Postal code
                </label>

                <input
                  className={styles.input}
                  id="postal_code"
                  name="postal_code"
                  value={
                    formData.postal_code
                  }
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.span4}`}
              >
                <label
                  className={styles.label}
                  htmlFor="country_code"
                >
                  Country code
                </label>

                <input
                  className={styles.input}
                  id="country_code"
                  name="country_code"
                  maxLength="2"
                  value={
                    formData.country_code
                  }
                  onChange={handleChange}
                  placeholder="US"
                  required
                />

                <p
                  className={styles.helpText}
                >
                  Use the two-letter ISO country
                  code.
                </p>
              </div>
            </div>
          </section>

          {errorMessage && (
            <p
              className={styles.errorMessage}
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className={styles.actions}>
            <Link
              href="/dashboard/projetos/lista"
              className={
                styles.secondaryButton
              }
            >
              Cancel
            </Link>

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving project...'
                : isEditing
                  ? 'Save changes'
                  : 'Create project'}
            </button>
          </div>
        </form>
      </article>
    </>
  )
}
