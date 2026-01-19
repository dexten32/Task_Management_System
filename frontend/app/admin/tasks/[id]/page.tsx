import ClientTaskDetail from "@/components/ClientTaskDetail";

export default async function AdminTaskDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-600 mb-6">
        Task Details (Admin View)
      </h1>
      <ClientTaskDetail taskId={params.id} />
    </div>
  );
}
