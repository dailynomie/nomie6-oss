export type ProfileName = 'insight' | 'data' | 'advice' | 'journal' | 'alert' | 'narrative' | 'chat'

export interface AIRequest {
  profile: ProfileName
  prompt: string
  contextHints?: {
    metrics?: string[]
    dateRange?: {
      from: string
      to: string
    }
    component?: string
  }
}

export interface AIResponse<T = string> {
  profile: ProfileName
  content: T
  raw: string
}

export interface Profile {
  name: ProfileName
  temperature: number
  maxTokens: number
  systemPrompt: (context: UserContext) => string
  parseResponse: (raw: string) => unknown
}

export interface UserContext {
  recentMetrics: Record<string, unknown>
  goals: string[]
  summary: string
  people?: Record<string, {
    count: number
    recent: (string | number)[]
    correlations?: string[]
  }>
  notes?: string
}

export interface ChartDataset {
  chartType: 'line' | 'bar' | 'scatter'
  title: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
}

export interface AdviceItem {
  headline: string
  detail: string
  priority: 'high' | 'medium' | 'low'
  relatedMetrics: string[]
}

export interface AlertItem {
  metric: string
  message: string
  severity: 'warning' | 'critical'
  trend: 'up' | 'down' | 'flat'
}

export interface JournalPrompt {
  opening_question: string
  follow_up_questions: string[]
  mood_scale_label: string
}
