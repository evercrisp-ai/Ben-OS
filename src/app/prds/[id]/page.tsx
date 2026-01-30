"use client";

import { useParams, useRouter } from "next/navigation";
import { PRDEditor } from "@/components/prd/PRDEditor";
import { usePRD } from "@/hooks/use-prds";
import { useBoards } from "@/hooks/use-boards";

export default function PRDDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prdId = params.id as string;

  // Get the PRD to find its project_id for finding associated boards
  const { data: prd } = usePRD(prdId);
  const { data: boards } = useBoards(prd?.project_id);

  // Use the first board for task generation, or undefined if none
  const boardId = boards?.[0]?.id;

  const handleBack = () => {
    router.push("/prds");
  };

  const handleTaskClick = (task: { id: string }) => {
    // Navigate to the board containing the task
    if (task.id) {
      // For now, just go to boards - could be enhanced to go to specific board
      router.push("/boards");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <PRDEditor
        prdId={prdId}
        boardId={boardId}
        onBack={handleBack}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
}
