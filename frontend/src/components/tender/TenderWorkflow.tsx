import { useTender } from '@/context/TenderContext'
import UploadView from './views/UploadView'
import ReviewView from './views/ReviewView'
import ValidateView from './views/ValidateView'
import CompareView from './views/CompareView'
import ReportView from './views/ReportView'

export default function TenderWorkflow() {
  const { state } = useTender()

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
    <div>{renderStep()}</div>
  )
}
