import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-[250px]" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[100px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-[150px]" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
