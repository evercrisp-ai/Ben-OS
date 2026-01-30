// Re-export all hooks for convenient imports

// Areas
export {
  useAreas,
  useArea,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  areaKeys,
} from './use-areas';

// Projects
export {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectKeys,
} from './use-projects';

// Milestones
export {
  useMilestones,
  useMilestone,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  milestoneKeys,
} from './use-milestones';

// Tasks
export {
  useTasks,
  useBoardTasks,
  usePRDTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useMoveTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useLinkTaskToPRD,
  useGenerateTasksFromPRD,
  taskKeys,
} from './use-tasks';

// Subtasks
export {
  useSubtasks,
  useSubtask,
  useCreateSubtask,
  useUpdateSubtask,
  useToggleSubtask,
  useDeleteSubtask,
  useBulkUpdateSubtasks,
  subtaskKeys,
} from './use-subtasks';

// Boards
export {
  useBoards,
  useBoard,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
  useAddColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
  boardKeys,
  DEFAULT_COLUMNS,
} from './use-boards';

// PRDs
export {
  usePRDs,
  useProjectPRDs,
  usePRD,
  usePRDVersions,
  useCreatePRD,
  useUpdatePRD,
  useUpdatePRDStatus,
  useDeletePRD,
  useRestorePRDVersion,
  prdKeys,
} from './use-prds';

// Agents
export {
  useAgents,
  useActiveAgents,
  useAgent,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  agentKeys,
} from './use-agents';

// Activity Logs
export {
  useEntityActivityLogs,
  useTaskActivityLogs,
  useRecentActivityLogs,
  activityLogKeys,
  formatActivityAction,
  formatActivityChanges,
} from './use-activity-logs';

// Keyboard shortcuts
export { useKeyboardShortcuts } from './use-keyboard-shortcuts';
