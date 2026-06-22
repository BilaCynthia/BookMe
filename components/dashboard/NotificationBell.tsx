"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, Circle, Trash2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      clearInterval(interval)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", notificationId: id }),
      })
      
      // Optimistic update
      setNotifications((prev) => 
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read", error)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      })
      
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAll = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    try {
      await fetch("/api/notifications?action=clearAll", { method: "DELETE" })
      setNotifications([])
      setUnreadCount(0)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to clear all", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearNotification = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await fetch(`/api/notifications?action=clear&id=${id}`, { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      const removed = notifications.find((n) => n.id === id)
      if (removed && !removed.isRead) {
         setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to clear notification", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-surface/50 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground hover:shadow-sm"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right overflow-hidden rounded-2xl border border-border/50 bg-surface/95 shadow-xl backdrop-blur-xl z-50">
          <div className="flex items-center justify-between border-b border-border/50 p-4 bg-background/50">
            <h3 className="font-heading text-sm font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); }}
                  disabled={isLoading}
                  className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={isLoading}
                  className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-subtle mt-1">We'll let you know when you get a booking or quote.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notification) => {
                  const Wrapper = notification.link ? Link : "div"
                  return (
                    <Wrapper
                      key={notification.id}
                      href={notification.link || "#"}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "block p-4 transition-colors hover:bg-muted/30",
                        !notification.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3 w-full items-start justify-between">
                        <div className="flex gap-3">
                          <div className="mt-1 flex shrink-0">
                            {!notification.isRead ? (
                              <Circle className="h-2 w-2 fill-primary text-primary" />
                            ) : (
                              <div className="h-2 w-2" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className={cn(
                              "text-sm leading-tight",
                              !notification.isRead ? "font-semibold text-foreground" : "font-medium text-subtle"
                            )}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString("en-NG", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => clearNotification(e, notification.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                          title="Clear notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Wrapper>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
