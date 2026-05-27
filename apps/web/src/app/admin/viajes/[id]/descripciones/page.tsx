"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DescripcionesIndexPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  
  useEffect(() => {
    if (params?.id) {
      router.replace(`/admin/viajes/${params.id}/descripciones/basicas`);
    }
  }, [params?.id, router]);

  return null;
}
