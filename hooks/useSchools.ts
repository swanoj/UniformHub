import { useEffect, useState } from "react"

let cachedSchools: string[] | null = null
let inflight: Promise<string[]> | null = null

async function fetchSchools(): Promise<string[]> {
  if (cachedSchools) return cachedSchools
  if (inflight) return inflight
  inflight = fetch("/schools.json")
    .then((r) => r.json())
    .then((data: string[]) => {
      cachedSchools = data
      return data
    })
    .catch((err) => {
      console.error("Failed to load schools:", err)
      return []
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function useSchools() {
  const [schools, setSchools] = useState<string[]>(cachedSchools || [])
  const [loading, setLoading] = useState<boolean>(!cachedSchools)

  useEffect(() => {
    if (cachedSchools) return
    fetchSchools().then((data) => {
      setSchools(data)
      setLoading(false)
    })
  }, [])

  return { schools, loading }
}
