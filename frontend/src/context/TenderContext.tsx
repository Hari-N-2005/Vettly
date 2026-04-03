import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react'
import { ComplianceResult, Requirement, RiskFlag } from '@/types'

export type TenderStep = 'upload' | 'review' | 'validate' | 'compare' | 'report'

export interface VendorResult {
  id: string
  vendorName: string
  complianceResults: ComplianceResult[]
  overallScore: number
  metCount: number
  partialCount: number
  missingCount: number
  riskFlags?: RiskFlag[]
  overallToneScore?: number
}

export interface TenderState {
  projectName: string
  rfpDocument: File | null
  requirements: Requirement[]
  vendors: VendorResult[]
  currentStep: TenderStep
}

export type TenderAction =
  | {
      type: 'SET_RFP'
      payload: {
        projectName: string
        rfpDocument: File | null
      }
    }
  | {
      type: 'SET_REQUIREMENTS'
      payload: Requirement[]
    }
  | {
      type: 'ADD_VENDOR_RESULT'
      payload: VendorResult
    }
  | {
      type: 'SET_STEP'
      payload: TenderStep
    }
  | {
      type: 'RESET'
    }

export const initialTenderState: TenderState = {
  projectName: '',
  rfpDocument: null,
  requirements: [],
  vendors: [],
  currentStep: 'upload',
}

export function tenderReducer(state: TenderState, action: TenderAction): TenderState {
  switch (action.type) {
    case 'SET_RFP':
      return {
        ...state,
        projectName: action.payload.projectName,
        rfpDocument: action.payload.rfpDocument,
      }

    case 'SET_REQUIREMENTS':
      return {
        ...state,
        requirements: action.payload,
      }

    case 'ADD_VENDOR_RESULT': {
      const nextVendors = state.vendors.some(vendor => vendor.id === action.payload.id)
        ? state.vendors.map(vendor =>
            vendor.id === action.payload.id
              ? action.payload
              : vendor
          )
        : [...state.vendors, action.payload]

      return {
        ...state,
        vendors: nextVendors,
      }
    }

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      }

    case 'RESET':
      return initialTenderState

    default:
      return state
  }
}

interface TenderContextValue {
  state: TenderState
  dispatch: React.Dispatch<TenderAction>
}

const TenderContext = createContext<TenderContextValue | undefined>(undefined)

interface TenderProviderProps {
  children: ReactNode
}

export function TenderProvider({ children }: TenderProviderProps) {
  const [state, dispatch] = useReducer(tenderReducer, initialTenderState)

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <TenderContext.Provider value={value}>{children}</TenderContext.Provider>
}

export function useTender() {
  const context = useContext(TenderContext)

  if (!context) {
    throw new Error('useTender must be used within a TenderProvider')
  }

  return context
}
