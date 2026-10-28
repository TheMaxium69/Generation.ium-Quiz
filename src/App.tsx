import { useEffect, useState } from 'react'
import { Footer, Nav } from './components/Layout'
import { loadState, newState, saveState, type QuizState } from './lib/state'
import { href, navigate, useRoute } from './lib/router'
import { syncSave } from './lib/saves'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import ResultsPage, { SharedResults } from './pages/Results'
import Methodology from './pages/Methodology'

export default function App() {
  const route = useRoute()
  const [state, setState] = useState<QuizState | null>(() => loadState())

  useEffect(() => {
    saveState(state)
    if (state) syncSave(state)
  }, [state])

  const start = () => {
    setState(newState())
    navigate(href.quiz)
  }

  const load = (s: QuizState) => {
    setState(s)
    navigate(s.finishedAt ? href.results : href.quiz)
  }

  let page
  switch (route.name) {
    case 'quiz':
      page = state ? <Quiz state={state} setState={setState} /> : <Home state={null} onStart={start} onLoad={load} />
      break
    case 'results':
      page = state?.finishedAt ? (
        <ResultsPage state={state} setState={setState} onRestart={start} />
      ) : (
        <Home state={state} onStart={start} onLoad={load} />
      )
      break
    case 'shared':
      page = <SharedResults code={route.code} />
      break
    case 'method':
      page = <Methodology />
      break
    default:
      page = <Home state={state} onStart={start} onLoad={load} />
  }

  return (
    <>
      <Nav route={route} />
      <main>{page}</main>
      {route.name !== 'quiz' && <Footer />}
    </>
  )
}
