import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'quiz' }
  | { name: 'results' }
  | { name: 'shared'; code: string }
  | { name: 'method' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  if (path === 'questionnaire') return { name: 'quiz' }
  if (path === 'resultats') return { name: 'results' }
  if (path === 'methodologie') return { name: 'method' }
  if (path.startsWith('r/')) return { name: 'shared', code: path.slice(2) }
  return { name: 'home' }
}

export const href = {
  home: '#/',
  quiz: '#/questionnaire',
  results: '#/resultats',
  method: '#/methodologie',
}

export function navigate(to: string) {
  if (window.location.hash === to) return
  window.location.hash = to
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
