// Bounded, in-memory rolling list of "lessons" extracted from prior swarm
// runs in the current browser tab. Cleared on page reload — we do not
// persist these to localStorage to avoid storing inferred legal advice.

const MAX_LESSONS = 5
const lessons: string[] = []

export function addLesson(lesson: string | undefined): void {
  if (!lesson) return
  const trimmed = lesson.trim()
  if (!trimmed) return
  // De-dupe consecutive identical lessons.
  if (lessons[lessons.length - 1] === trimmed) return
  lessons.push(trimmed)
  if (lessons.length > MAX_LESSONS) lessons.splice(0, lessons.length - MAX_LESSONS)
}

export function getLessons(): string[] {
  return [...lessons]
}

export function clearLessons(): void {
  lessons.length = 0
}

/**
 * True if the current page should render swarm-related debug UI. Gated by
 * `?debug=swarm` in the URL so it never appears in the parent-facing build
 * accidentally.
 */
export function isSwarmDebug(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('debug') === 'swarm'
  } catch {
    return false
  }
}
