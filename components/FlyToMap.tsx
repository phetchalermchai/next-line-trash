import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function FlyToMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center.toString()]);

  return null;
}
