import { useTender } from '@/context/TenderContext'
import UploadView from './views/UploadView'
import ReviewView from './views/ReviewView'
import ValidateView from './views/ValidateView'
import CompareView from './views/CompareView'
import ReportView from './views/ReportView'

const steps = ['upload', 'review', 'validate', 'compare', 'report'] as const

export default function TenderWorkflow() {
  const { state, dispatch } = useTender()

  const renderStep = () => {
    switch (state.currentStep) {
      case 'upload':
        return <UploadView />
      case 'review':
        return <ReviewView />
      case 'validate':
        return <ValidateView />
      case 'compare':
        return <CompareView />
      case 'report':
        return <ReportView />
      default:
        return <UploadView />
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
        <h2 className="text-2xl font-bold text-gray-100">Tender Workflow Context Demo</h2>
        <p className="mt-1 text-sm text-gray-400">
          Current step: <span className="font-semibold text-gray-200">{state.currentStep}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map(step => (
            <button
              key={step}
              type="button"
              onClick={() => dispatch({ type: 'SET_STEP', payload: step })}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                state.currentStep === step
                  ? 'bg-legal-accent text-white'
                  : 'border border-legal-blue/40 bg-legal-dark text-gray-300'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </header>

      {renderStep()}
    </div>
  )
}
