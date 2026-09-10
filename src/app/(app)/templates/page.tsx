import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TemplateList } from './TemplateList'

export const metadata = { title: 'Vorlagen' }

export default async function TemplatesPage() {
  const user = await requireUser()
  const templates = await prisma.template.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Vorlagen"
        subtitle={
          user.role === 'ADMIN'
            ? 'Skripte und Nachrichten für das Team verwalten.'
            : 'Skripte und Nachrichten kopieren und direkt verwenden.'
        }
      />
      <TemplateList
        templates={templates.map((template) => ({
          id: template.id,
          title: template.title,
          category: template.category,
          body: template.body,
        }))}
        isAdmin={user.role === 'ADMIN'}
      />
    </div>
  )
}
