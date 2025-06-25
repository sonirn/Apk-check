import { QueryClient, type QueryFunction } from "@tanstack/react-query"
import type { T } from "some-module" // Assuming T is imported from a module

/**
 * Throw an error if the response is not OK (status ≥ 400).
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText
    throw new Error(`${res.status}: ${text}`)
  }
}

/**
 * Generic helper for making JSON fetch requests.
 *
 * @param method  HTTP verb
 * @param url     Target endpoint
 * @param data    Optional request body
 */
export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  })

  await throwIfResNotOk(res)
  return res
}

type UnauthorizedBehavior = "returnNull" | "throw"

/**
 * Factory that returns a query-fn compatible with TanStack Query
 * and handles 401 responses according to the provided strategy.
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    })

    if (on401 === "returnNull" && res.status === 401) {
      return null as unknown as T
    }

    await throwIfResNotOk(res)
    return (await res.json()) as T
  }

/**
 * Shared QueryClient instance with sensible defaults.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
