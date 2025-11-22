/**
 * API Route: Complete Coaching Task
 *
 * POST /api/coaching/tasks/complete
 *
 * Marks a task as completed
 */

import { NextResponse } from 'next/server'
import { markTaskCompleted } from '@/lib/fzth/coaching/repository'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { taskId, matchId } = body

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid taskId' },
        { status: 400 },
      )
    }

    await markTaskCompleted(taskId, matchId ? Number(matchId) : undefined)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[API/COACHING/TASKS/COMPLETE] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to complete task' },
      { status: 500 },
    )
  }
}
