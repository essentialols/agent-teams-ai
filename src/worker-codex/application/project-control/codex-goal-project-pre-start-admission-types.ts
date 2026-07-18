export type ProjectPreStartAdmissionDirtyContinuationMode =
  | "reviewed_dirty_continuation"
  | "terminal_handoff_dependency_recovery"
  | "terminal_handoff_runtime_interrupt_continuation";

export function isProjectPreStartAdmissionDirtyContinuationMode(
  value: unknown,
): value is ProjectPreStartAdmissionDirtyContinuationMode {
  return (
    value === "reviewed_dirty_continuation" ||
    value === "terminal_handoff_dependency_recovery" ||
    value === "terminal_handoff_runtime_interrupt_continuation"
  );
}

export type ProjectPreStartAdmissionLaunchWorkspaceMode =
  | "clean_first_launch"
  | "clean_capacity_continuation"
  | "clean_explicit_continuation"
  | "admitted_input_patch"
  | "admitted_input_patch_continuation"
  | ProjectPreStartAdmissionDirtyContinuationMode;
