import { create } from 'zustand'
import type { AgentOutput, AgentRole, ProductionPlan } from '../models/production'
import { AgentLabels } from '../models/production'
import { TaskFlow, DEFAULT_PRODUCTION_FLOW, STREAMLINED_PRODUCTION_FLOW } from '../models/workflow'

interface LogEntry {
  agent: AgentRole
  message: string
  timestamp: number
}

interface AgentConfig {
  systemPrompt?: string
}

interface ProductionState {
  // 输入
  userInput: string

  // 制作计划
  plan: ProductionPlan | null

  // 工作流
  flow: TaskFlow
  setFlow: (flow: TaskFlow) => void
  flowMode: 'default' | 'streamlined'
  setFlowMode: (mode: 'default' | 'streamlined') => void

  // Agent 配置
  agentConfigs: Partial<Record<AgentRole, AgentConfig>>
  setAgentConfig: (role: AgentRole, config: AgentConfig) => void

  // Agent 产出
  outputs: Record<AgentRole, AgentOutput | null>

  // 日志
  logs: LogEntry[]

  // 运行状态
  isRunning: boolean
  currentAgent: AgentRole | null

  // 通知
  notification: string | null

  // Actions
  setUserInput: (input: string) => void
  setPlan: (plan: ProductionPlan) => void
  setAgentOutput: (role: AgentRole, output: AgentOutput) => void
  addLog: (agent: AgentRole, message: string) => void
  setRunning: (running: boolean) => void
  setCurrentAgent: (agent: AgentRole | null) => void
  setNotification: (msg: string | null) => void
  reset: () => void

  // 人工干预
  editingOutput: AgentOutput | null
  setEditingOutput: (output: AgentOutput | null) => void
  updateEditingData: (data: string) => void
  clearDownstreamOutputs: (fromRole: AgentRole) => void
}

function sortFlowTopologically(flow: TaskFlow): TaskFlow {
  const sorted: TaskFlow = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(role: AgentRole) {
    if (visited.has(role)) return
    if (visiting.has(role)) return // Break simple dependency cycles
    visiting.add(role)

    const task = flow.find(f => f.role === role)
    if (task) {
      task.dependsOn.forEach((dep) => {
        visit(dep)
      })
      sorted.push(task)
    }
    visiting.delete(role)
    visited.add(role)
  }

  flow.forEach((f) => visit(f.role))
  return sorted
}

export const useProductionStore = create<ProductionState>((set) => ({
  userInput: '',
  plan: null,
  flow: DEFAULT_PRODUCTION_FLOW,
  flowMode: 'default',
  agentConfigs: {},
  outputs: {} as Record<AgentRole, AgentOutput | null>,
  logs: [],
  isRunning: false,
  currentAgent: null,
  notification: null,

  setFlow: (flow) => set({ flow: sortFlowTopologically(flow) }),
  setFlowMode: (mode) => set({
    flowMode: mode,
    flow: mode === 'streamlined' ? STREAMLINED_PRODUCTION_FLOW : DEFAULT_PRODUCTION_FLOW
  }),
  setAgentConfig: (role, config) => set((state) => ({
    agentConfigs: { ...state.agentConfigs, [role]: { ...state.agentConfigs[role], ...config } }
  })),

  setUserInput: (input) => set({ userInput: input }),

  setPlan: (plan) => set({ plan }),

  setAgentOutput: (role, output) =>
    set((state) => ({
      outputs: { ...state.outputs, [role]: output },
    })),

  addLog: (agent, message) =>
    set((state) => ({
      logs: [...state.logs, { agent, message, timestamp: Date.now() }],
    })),

  setRunning: (running) => set({ isRunning: running }),

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  setNotification: (msg) => set({ notification: msg }),

  reset: () =>
    set({
      plan: null,
      outputs: {} as Record<AgentRole, AgentOutput | null>,
      logs: [],
      isRunning: false,
      currentAgent: null,
      notification: null,
      editingOutput: null,
    }),

  editingOutput: null,
  setEditingOutput: (output) => set({ editingOutput: output }),
  updateEditingData: (data) =>
    set((state) => {
      if (!state.editingOutput) return state
      try {
        const parsed = JSON.parse(data)
        return { editingOutput: { ...state.editingOutput, data: parsed } }
      } catch {
        return state
      }
    }),
  clearDownstreamOutputs: (fromRole) =>
    set((state) => {
      const idx = state.flow.findIndex(f => f.role === fromRole)
      if (idx === -1) return state
      const newOutputs = { ...state.outputs }
      for (let i = idx; i < state.flow.length; i++) {
        delete newOutputs[state.flow[i].role]
      }
      return { outputs: newOutputs }
    }),
}))

// Helper hooks
export function useAgentOutput<T>(role: AgentRole): T | null {
  return useProductionStore((s) => (s.outputs[role]?.data as T) ?? null)
}

export const agentName = (role: AgentRole) => AgentLabels[role]
