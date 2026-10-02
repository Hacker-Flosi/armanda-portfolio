import type { DesignWork } from '@/sanity/lib/queries'
import { worksToTiles } from '@/lib/designMedia'
import { Reveal } from '@/components/Reveal'
import { ProjectHeader } from '@/components/ProjectHeader'
import { ProjectMedia } from '@/components/ProjectMedia'
import { StackSection } from '@/components/StackSection'

export function DesignProjects({ works }: { works: DesignWork[] }) {
  return (
    <>
      {works.map((work, projectIndex) => (
        <StackSection key={work._id} index={projectIndex} className="border-t border-[var(--line)]">
          <Reveal className="reveal-soft shrink-0">
            <ProjectHeader
              title={work.title}
              tags={work.tags}
              client={work.client}
              year={work.year}
              description={work.description}
              challenge={work.challenge}
              approach={work.approach}
              result={work.result}
              role={work.role}
            />
          </Reveal>

          <Reveal className="reveal-soft flex-1 min-h-0">
            <ProjectMedia
              title={work.title}
              lane={work.tags.join(' · ') || 'Projekt'}
              year={work.year}
              note={work.description}
              tiles={worksToTiles([work])}
            />
          </Reveal>
        </StackSection>
      ))}
    </>
  )
}
