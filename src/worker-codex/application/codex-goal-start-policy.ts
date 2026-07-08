export function isSafeStartAction(action: string): boolean {
  return action === "start_worker" ||
    action === "continue_after_capacity" ||
    action === "continue_after_timeout" ||
    action === "continue_after_provider_output";
}
