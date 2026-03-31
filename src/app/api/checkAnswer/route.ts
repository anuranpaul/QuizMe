import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import stringSimilarity from "string-similarity";
import { getAuthSession } from "@/lib/nextauth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, userInput } = checkAnswerSchema.parse(body);
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in" },
        { status: 401 }
      );
    }
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { game: true },
    });
    if (!question) {
      return NextResponse.json(
        {
          message: "Question not found",
        },
        {
          status: 404,
        }
      );
    }
    if (question.game.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to answer this question" },
        { status: 403 }
      );
    }
    await prisma.question.update({
      where: { id: questionId },
      data: { userAnswer: userInput },
    });
    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
      await prisma.question.update({
        where: { id: questionId },
        data: { isCorrect },
      });
      return NextResponse.json({
        isCorrect,
      });
    } else if (question.questionType === "open_ended") {
      let percentageSimilar = stringSimilarity.compareTwoStrings(
        question.answer.toLowerCase().trim(),
        userInput.toLowerCase().trim()
      );
      percentageSimilar = Math.round(percentageSimilar * 100);
      await prisma.question.update({
        where: { id: questionId },
        data: { percentageCorrect: percentageSimilar },
      });
      return NextResponse.json({
        percentageSimilar,
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.issues,
        },
        {
          status: 400,
        }
      );
    }
  }
}