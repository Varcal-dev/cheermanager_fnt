import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel izquierdo: Búsqueda y selección de productos */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-24 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-full mb-2" />
                        <div className="flex justify-between items-center mt-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-8 w-full mt-2" />
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Carrito y finalización de venta */}
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-5 w-6" />
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-7" />
                      </div>
                    </div>
                  ))}

                <div className="pt-4">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>

                  <div className="flex items-center space-x-2 mb-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>

                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>

                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
