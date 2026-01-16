const MAX_TIME_HOURS = 6;
const MAX_TIME_MS = MAX_TIME_HOURS * 60 * 60 * 1000;
export function generateTaskTimings(config) {
    const { taskCount, maxTimeMs = MAX_TIME_MS } = config;
    if (taskCount <= 0) {
        throw new Error('taskCount must be greater than 0');
    }
    if (maxTimeMs < 0) {
        throw new Error('maxTimeMs must be non-negative');
    }
    const totalDurationMs = Math.random() * maxTimeMs;
    const intervals = [];
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
    const timings = [];
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
export function getTaskDelay(timings, taskIndex) {
    if (taskIndex < 0 || taskIndex >= timings.length) {
        throw new Error(`Invalid task index: ${taskIndex}`);
    }
    return timings[taskIndex].cumulativeTimeMs;
}
