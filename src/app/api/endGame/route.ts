import { prisma } from "@/lib/db";
import { endGameSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/nextauth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId } = endGameSchema.parse(body);
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in" },
        { status: 401 }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      return NextResponse.json(
        {
          message: "Game not found",
        },
        {
          status: 404,
        }
      );
    }
    if (game.userId !== session.user.id) {
      return NextResponse.json(
        { message: "You are not authorized to end this game" },
        { status: 403 }
      );
    }
    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        timeEnded: new Date(),
      },
    });
    return NextResponse.json({
      message: "Game ended",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}