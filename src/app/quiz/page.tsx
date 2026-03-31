import React from "react";

import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import QuizCreation from "@/components/forms/QuizCreation";

export const metadata = {
  title: "Quiz | QuizMe!",
  description: "Quiz yourself on anything!",
};

interface Props {
  searchParams: Promise<{
    topic?: string;
  }>;
}

const Quiz = async (props: Props) => {
  const searchParams = await props.searchParams;
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }
  return <QuizCreation topic={searchParams.topic ?? ""} />;
};

export default Quiz;