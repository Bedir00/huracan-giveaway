import Link from 'next/link'
import { deleteTask, snoozeTask, toggleTask } from '@/app/actions/tasks'
import { fmtRelativeDay, fmtTime, startOfDay } from '@/lib/dates'
import { IconAlert, IconClock, IconTrash } from './icons'
import { Avatar, StagePill } from './ui'

export type TaskRowData = {
  id: string
  title: string
  dueAt: Date
  hasTime: boolean
  done: boolean
  lead: { id: string; company: string; stage: string } | null
  assignee: { name: string } | null
}

/**
 * One follow-up. Tick, snooze by a day or a week, or open the lead - all
 * without leaving the list, because the list is where the day is worked.
 */
export function TaskRow({
  task,
  showAssignee = false,
}: {
  task: TaskRowData
  showAssignee?: boolean
}) {
  const overdue = !task.done && task.dueAt < startOfDay()

  return (
    <div className="flex items-start gap-3 py-2.5 px-1">
      <form action={toggleTask} className="pt-0.5">
        <input type="hidden" name="taskId" value={task.id} />
        <button
          type="submit"
          className="flex items-center justify-center w-[1.125rem] h-[1.125rem] rounded-[6px] border transition-colors"
          style={{
            borderColor: task.done ? 'var(--success)' : 'var(--border-strong)',
            background: task.done ? 'var(--success)' : 'transparent',
            color: '#fff',
          }}
          aria-label={task.done ? 'Wieder öffnen' : 'Als erledigt markieren'}
          title={task.done ? 'Wieder öffnen' : 'Als erledigt markieren'}
        >
          {task.done ? (
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5 9.5 17 19 6.5" />
            </svg>
          ) : null}
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p className={`text-[0.8125rem] font-medium ${task.done ? 'line-through subtle' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span
            className="inline-flex items-center gap-1 text-[0.6875rem]"
            style={{ color: overdue ? 'var(--danger)' : 'var(--text-subtle)' }}
          >
            {overdue ? <IconAlert /> : <IconClock />}
            {fmtRelativeDay(task.dueAt)}
            {task.hasTime ? `, ${fmtTime(task.dueAt)}` : ''}
          </span>
          {task.lead ? (
            <>
              <Link href={`/leads/${task.lead.id}`} className="text-[0.6875rem] link truncate">
                {task.lead.company}
              </Link>
              <StagePill stage={task.lead.stage} />
            </>
          ) : (
            <span className="text-[0.6875rem] subtle">Ohne Lead</span>
          )}
          {showAssignee && task.assignee ? <Avatar name={task.assignee.name} /> : null}
        </div>
      </div>

      {!task.done ? (
        <div className="flex items-center gap-0.5 shrink-0">
          <form action={snoozeTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="days" value="1" />
            <button type="submit" className="btn btn-ghost btn-sm" title="Auf morgen verschieben">
              +1T
            </button>
          </form>
          <form action={snoozeTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="days" value="7" />
            <button
              type="submit"
              className="btn btn-ghost btn-sm"
              title="Um eine Woche verschieben"
            >
              +7T
            </button>
          </form>
          <form action={deleteTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="btn btn-ghost btn-sm btn-icon"
              title="Follow-up löschen"
            >
              <IconTrash />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
