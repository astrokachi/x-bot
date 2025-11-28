const MAX_TIME_HOURS = 6;
const MAX_TIME_MS = MAX_TIME_HOURS * 60 * 60 * 1000;

export interface TimeRandomizerConfig {
  taskCount: number;
}

export interface TaskTiming {
  taskIndex: number;
  delayMs: number;
  cumulativeTimeMs: number;
}


export function generateTaskTimings(config: TimeRandomizerConfig): TaskTiming[] {
  const { taskCount } = config;
  const maxTimeMs = MAX_TIME_MS;

  if (taskCount <= 0) {
    throw new Error('taskCount must be greater than 0');
  }

  if (maxTimeMs < 0) {
    throw new Error('maxTimeMs must be non-negative');
  }

  const totalDurationMs = Math.random() * maxTimeMs;

  const intervals: number[] = [];
  let remainingTime = totalDurationMs;

  for (let i = 0; i < taskCount - 1; i++) {
    const tasksRemaining = taskCount - i;
    const averageInterval = remainingTime / tasksRemaining;

    const minInterval = Math.max(0, averageInterval * 0.5);
    const maxInterval = averageInterval * 1.5;
    const interval = Math.random() * (maxInterval - minInterval) + minInterval;

    intervals.push(interval);
    remainingTime -= interval;
  }

  intervals.push(Math.max(0, remainingTime));

  const timings: TaskTiming[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < taskCount; i++) {
    const delayMs = Math.round(intervals[i]);
    cumulativeTime += delayMs;

    timings.push({
      taskIndex: i,
      delayMs,
      cumulativeTimeMs: cumulativeTime
    });
  }

  return timings;
}

export function getTaskDelay(timings: TaskTiming[], taskIndex: number): number {
  if (taskIndex < 0 || taskIndex >= timings.length) {
    throw new Error(`Invalid task index: ${taskIndex}`);
  }

  if (taskIndex === 0) {
    return 0;
  }

  const previousCumulativeTime = timings[taskIndex - 1].cumulativeTimeMs;
  const currentCumulativeTime = timings[taskIndex].cumulativeTimeMs;

  return currentCumulativeTime - previousCumulativeTime;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
