import Joi from "joi";

export function validateTimeString(value: string, helpers: Joi.CustomHelpers) {
  const timePattern = /^(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;
  const match = value.match(timePattern);

  if (!match) {
    return helpers.error('any.invalid')
  }

  const formattedValue = Number(parseTimeString(match));

  return formattedValue;
}

export function parseTimeString(match: string[]): number {
  const value = parseFloat(match[1]);
  const unit = match[2];

  if (value <= 0) {
    throw new Error('Time value must be greater than 0');
  }

  switch (unit) {
    case 'hour':
    case 'hours':
    case 'hr':
    case 'hrs':
    case 'h':
      return value * 60 * 60 * 1000;

    case 'minute':
    case 'minutes':
    case 'min':
    case 'mins':
    case 'm':
      return value * 60 * 1000;

    case 'second':
    case 'seconds':
    case 'sec':
    case 'secs':
    case 's':
      return value * 1000;
  }

  return value;
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ') || '0 seconds';
}
