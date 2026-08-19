'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../../contexts/LanguageContext'
import LogoutButton from '../../components/LogoutButton'
import styles from './dashboard.module.css'

const translations = {
  'en-US': {
    workspace: 'Workspace',
    planning: 'Planning',
    control: 'Control',
    overview: 'Overview',
    projects: 'Projects',
    projectSetup: 'Project Setup',
    masterPlan: 'Master Plan',
    lookahead: 'Lookahead Planning',
    weeklyPlan: 'Weekly Planning',
    productionMap: 'Production Map',
    statusMatrix: 'Status Matrix',
    privateDevelopment: 'Private development',
    activeBuild: 'RitsuFlow is currently under active development.',
    initialData: 'Initial Data',
    locationBreakdown: 'Location Breakdown',
    logout: 'Logout',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
  },
  'pt-BR': {
    workspace: 'Área de trabalho',
    planning: 'Planejamento',
    control: 'Controle',
    overview: 'Visão geral',
    projects: 'Projetos',
    projectSetup: 'Estrutura do projeto',
    masterPlan: 'Master Plan',
    lookahead: 'Planejamento Lookahead',
    weeklyPlan: 'Planejamento Semanal',
    productionMap: 'Mapa de Produção',
    statusMatrix: 'Matriz de Status',
    privateDevelopment: 'Desenvolvimento privado',
    activeBuild: 'O RitsuFlow está atualmente em desenvolvimento.',
    initialData: 'Dados Iniciais',
    locationBreakdown: 'Estrutura de Localizações',
    logout: 'Sair',
    openMenu: 'Abrir navegação',
    closeMenu: 'Fechar navegação',
  },
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const { lang, toggleLanguage } = useLanguage()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const t = translations[lang] || translations['en-US']

  const navigationGroups = [
    {
      label: t.workspace,
      items: [
        {
          label: t.overview,
          href: '/dashboard',
          icon: 'OV',
        },
        {
          label: t.projects,
          href: '/dashboard/projetos/lista',
          icon: 'PR',
        },
        {
          label: t.projectSetup,
          href: '/dashboard/projetos/coleta',
          icon: 'PS',
        },
      ],
    },
    {
      label: t.planning,
      items: [
        {
          label: t.masterPlan,
          href: '/dashboard/projetos/masterplan',
          icon: 'MP',
        },
        {
          label: t.lookahead,
          href: '/dashboard/projetos/lookahead',
          icon: 'LA',
        },
        {
          label: t.weeklyPlan,
          href: '/dashboard/projetos/semanal',
          icon: 'WP',
        },
      ],
    },
    {
      label: t.control,
      items: [
        {
          label: t.productionMap,
          href: '/dashboard/diretoria/mapa',
          icon: 'PM',
        },
        {
          label: t.statusMatrix,
          href: '/dashboard/projetos/matriz-status',
          icon: 'SM',
        },
      ],
    },
  ]

  function isActive(href) {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/'
    }

    return pathname.startsWith(href)
  }

  const currentNavigationGroup = navigationGroups.find((group) =>
    group.items.some((item) => isActive(item.href))
  )

  const currentNavigationItem = navigationGroups
    .flatMap((group) => group.items)
    .find((item) => isActive(item.href))

  const currentCategory =
    currentNavigationGroup?.label || t.workspace

  const currentTitle =
    currentNavigationItem?.label || t.overview

  const isProjectSetupPage =
    pathname === '/dashboard/projetos/coleta'

  function changeLanguage(targetLanguage) {
    if (lang !== targetLanguage) {
      toggleLanguage()
    }
  }

  function toggleNavigation() {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 980px)').matches
    ) {
      setIsMobileOpen((currentState) => !currentState)
      return
    }

    setIsCollapsed((currentState) => !currentState)
  }

  function closeMobileNavigation() {
    setIsMobileOpen(false)
  }

  function openInitialData() {
    window.dispatchEvent(
      new CustomEvent('abrir-modal-coleta')
    )
  }

  function openLocationBreakdown() {
    window.dispatchEvent(
      new CustomEvent('abrir-modal-setorizacao')
    )
  }

  const sidebarClassName = [
    styles.sidebar,
    isCollapsed ? styles.sidebarCollapsed : '',
    isMobileOpen ? styles.sidebarMobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.shell}>
      {isMobileOpen && (
        <button
          type="button"
          className={styles.mobileOverlay}
          onClick={closeMobileNavigation}
          aria-label={t.closeMenu}
        />
      )}

      <aside className={sidebarClassName}>
        <div className={styles.sidebarHeader}>
          <Link
            href="/"
            className={styles.brand}
            onClick={closeMobileNavigation}
            aria-label="RitsuFlow home"
          >
            <span
              className={styles.brandMark}
              aria-hidden="true"
            />

            <span className={styles.brandText}>
              RitsuFlow
            </span>
          </Link>
        </div>

        <nav
          className={styles.navigation}
          aria-label="RitsuFlow navigation"
        >
          {navigationGroups.map((group) => (
            <div
              className={styles.navigationGroup}
              key={group.label}
            >
              <p className={styles.navigationLabel}>
                {group.label}
              </p>

              {group.items.map((item) => {
                const active = isActive(item.href)

                const linkClassName = [
                  styles.navigationLink,
                  active
                    ? styles.navigationLinkActive
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <Link
                    href={item.href}
                    className={linkClassName}
                    onClick={closeMobileNavigation}
                    key={item.href}
                  >
                    <span className={styles.navigationIcon}>
                      {item.icon}
                    </span>

                    <span className={styles.navigationText}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.developmentStatus}>
            <div className={styles.statusTitle}>
              <span className={styles.statusDot} />
              {t.privateDevelopment}
            </div>

            <p className={styles.statusText}>
              {t.activeBuild}
            </p>
          </div>

          <div className={styles.logoutArea}>
            <LogoutButton
              label={isCollapsed ? '' : t.logout}
            />
          </div>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={toggleNavigation}
              aria-label={
                isCollapsed || !isMobileOpen
                  ? t.openMenu
                  : t.closeMenu
              }
            >
              ☰
            </button>

            <div className={styles.pageIdentity}>
              <p className={styles.pageCategory}>
                {currentCategory}
              </p>

              <h1 className={styles.pageTitle}>
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className={styles.topbarRight}>
            {isProjectSetupPage && (
              <div className={styles.pageActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={openInitialData}
                >
                  {t.initialData}
                </button>

                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                  onClick={openLocationBreakdown}
                >
                  {t.locationBreakdown}
                </button>
              </div>
            )}

            <div
              className={styles.languageSelector}
              aria-label="Language selector"
            >
              <button
                type="button"
                className={`${styles.languageButton} ${
                  lang === 'en-US'
                    ? styles.languageButtonActive
                    : ''
                }`}
                onClick={() => changeLanguage('en-US')}
              >
                EN
              </button>

              <button
                type="button"
                className={`${styles.languageButton} ${
                  lang === 'pt-BR'
                    ? styles.languageButtonActive
                    : ''
                }`}
                onClick={() => changeLanguage('pt-BR')}
              >
                PT
              </button>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
