import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ValidationErrorsProps {
  errors: Record<string, string[]>
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (Object.keys(errors).length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2">
          {Object.entries(errors).map(([field, messages]) =>
            messages.map((message, index) => <li key={`${field}-${index}`}>{message}</li>),
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
