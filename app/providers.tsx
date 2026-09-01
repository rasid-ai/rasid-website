'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from '@posthog/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            defaults: '2026-05-30',
            // Session recording (rrweb) and heatmaps are both OFF: on a page that
            // restyles DOM nodes every scroll frame their observers competed with
            // the WebGL render loop, and we don't need either signal. With them off
            // init is lightweight, so there's no need to defer it.
            enable_heatmaps: false,
            disable_session_recording: true,
            loaded: (posthog) => {
                // Tag every event with the environment to filter out local events
                posthog.register({ environment: process.env.NODE_ENV })

                // Show debug logs in browser console when local
                if (process.env.NODE_ENV === 'development') {
                    posthog.debug()
                }
            }
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
