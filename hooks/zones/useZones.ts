import axios from "axios"
import { useEffect, useState } from "react"

export function useZones() {
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchZones = async () => {
    try {
      const res = await axios.get("/api/zones")
      setZones(res.data)
      setIsError(false)
    } catch (error) {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  return {
    zones,
    isLoading,
    isError,
    mutate: fetchZones,
  }
}

export async function createZone(data: any) {
  const res = await axios.post("/api/zones", data)
  return res.data
}

export async function updateZone(id: string, data: any) {
  const res = await axios.put(`/api/zones/${id}`, data)
  return res.data
}

export async function deleteZone(id: string) {
  await axios.delete(`/api/zones/${id}`)
}

export async function deleteManyZones(ids: string[]) {
  await axios.delete("/api/zones", { data: { ids } })
}