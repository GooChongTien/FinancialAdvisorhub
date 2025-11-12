export interface TopicTransition {
  fromTopic: string | null;
  toTopic: string;
  shouldSwitch: boolean;
  message?: string;
}

export function detectTopicSwitch(
  previousTopic: string | null,
  currentTopic: string,
  confidence: number,
): TopicTransition {
  if (!previousTopic || previousTopic === currentTopic) {
    return { fromTopic: previousTopic, toTopic: currentTopic, shouldSwitch: false };
  }

  const shouldSwitch = confidence >= 0.5;
  const message = shouldSwitch
    ? `Switching from ${previousTopic} to ${currentTopic}.`
    : `Possible switch from ${previousTopic} to ${currentTopic}, awaiting confirmation.`;
  return { fromTopic: previousTopic, toTopic: currentTopic, shouldSwitch, message };
}

export function generateTransitionMessage(fromTopic: string, toTopic: string): string {
  if (fromTopic === toTopic) {
    return `Continuing in ${toTopic}.`;
  }
  return `It looks like you want to switch from ${fromTopic} to ${toTopic}. Would you like me to continue with ${toTopic}?`;
}

export function updateTopicHistory(history: string[] | undefined, topic: string): string[] {
  const next = Array.isArray(history) ? [...history] : [];
  if (next[next.length - 1] !== topic) {
    next.push(topic);
  }
  return next.slice(-10);
}

export function shouldPromptForSwitch(transition: TopicTransition): boolean {
  return Boolean(transition.shouldSwitch && transition.fromTopic && transition.fromTopic !== transition.toTopic);
}
