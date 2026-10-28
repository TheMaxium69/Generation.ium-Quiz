import type { ReactNode } from 'react'
import { SITE } from '../config'
import { href, type Route } from '../lib/router'
import { GithubIcon } from './Icons'

export function Nav({ route }: { route: Route }) {
  return (
    <header className="nav">
      <div className="tricolor" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="container nav-inner">
        <a className="brand" href={href.home}>
          <img className="brand-logo" src={SITE.logo} alt={SITE.association} width={237} height={144} />
          {SITE.shortName}
        </a>
        <nav className="nav-links">
          <a className="nav-link" href={href.method} aria-current={route.name === 'method' ? 'page' : undefined}>
            Méthodologie
          </a>
          <a className="icon-btn" href={SITE.githubUrl} target="_blank" rel="noreferrer" aria-label="Code source sur GitHub">
            <GithubIcon />
          </a>
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div>
            &copy; {new Date().getFullYear()} <strong>{SITE.association}</strong> · Tous droits réservés
          </div>
          <div className="footer-credits">
            Développé par{' '}
            <a href={SITE.developerUrl} target="_blank" rel="noreferrer">
              {SITE.developer}
            </a>{' '}
            · Hébergé par{' '}
            <a href={SITE.hostUrl} target="_blank" rel="noreferrer">
              {SITE.host}
            </a>
          </div>
        </div>
        <nav className="footer-links" aria-label="Liens du pied de page">
          <a href={SITE.associationUrl}>Site {SITE.association}</a>
          <a href={href.method}>Méthodologie</a>
          <a href={SITE.githubUrl} target="_blank" rel="noreferrer">
            Code source
          </a>
        </nav>
      </div>
    </footer>
  )
}

export function Dialog({
  title,
  children,
  confirmLabel,
  confirmDisabled,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <form
        className="dialog card"
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') onCancel()
        }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!confirmDisabled) onConfirm()
        }}
      >
        <h2>{title}</h2>
        <div className="muted">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={confirmDisabled} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
