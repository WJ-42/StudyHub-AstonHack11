let permissionGranted = false

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    permissionGranted = permission === 'granted'
    return permissionGranted
  } catch (err) {
    console.error('Error requesting notification permission:', err)
    return false
  }
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (!permissionGranted || !('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  } catch (err) {
    console.error('Error showing notification:', err)
  }
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null
  return Notification.permission
}
