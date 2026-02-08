/**
 * Cross-window communication for media player synchronization
 * Coordinates player ownership between main app and pop-out window
 */

type PlayerSyncMessage =
  | { type: 'popout-opened' }
  | { type: 'popout-closed' }
  | { type: 'clear-requested' }

const CHANNEL_NAME = 'media-player-sync'

let channel: BroadcastChannel | null = null

/**
 * Get or create the BroadcastChannel instance
 */
function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

/**
 * Notify that the pop-out window has been opened
 */
export function notifyPopoutOpened(): void {
  getChannel().postMessage({ type: 'popout-opened' } satisfies PlayerSyncMessage)
}

/**
 * Notify that the pop-out window has been closed
 */
export function notifyPopoutClosed(): void {
  getChannel().postMessage({ type: 'popout-closed' } satisfies PlayerSyncMessage)
}

/**
 * Notify that media has been cleared (pop-out should close)
 */
export function notifyClearRequested(): void {
  getChannel().postMessage({ type: 'clear-requested' } satisfies PlayerSyncMessage)
}

/**
 * Listen for player sync messages
 * @param handler Callback to handle incoming messages
 * @returns Cleanup function to remove the listener
 */
export function onPlayerSyncMessage(
  handler: (message: PlayerSyncMessage) => void
): () => void {
  const ch = getChannel()
  const listener = (event: MessageEvent<PlayerSyncMessage>) => {
    handler(event.data)
  }
  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}

/**
 * Close the BroadcastChannel (cleanup)
 */
export function closeChannel(): void {
  if (channel) {
    channel.close()
    channel = null
  }
}
