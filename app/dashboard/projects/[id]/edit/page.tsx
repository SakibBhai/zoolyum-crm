import { EditProjectModule } from "@/components/projects/edit-project-module";

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <EditProjectModule projectId={params.id} />;
}