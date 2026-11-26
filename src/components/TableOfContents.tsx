import { useEffect, useState } from 'react'
import { Text, UnstyledButton } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router'
import { findPage } from '../content/pages'
import { sectionPath } from '../lib/links'

export default function TableOfContents() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = findPage(pathname)
  const [active, setActive] = useState<string | null>(null)
  const sectionKey = page?.sections.map((section) => section.id).join('|') ?? ''

  useEffect(() => {
    if (!sectionKey) return
    const ids = sectionKey.split('|')
    let observer: IntersectionObserver | undefined
    let attempts = 0

    // Pages are lazy-loaded, so wait until their sections exist in the DOM.
    const timer = window.setInterval(() => {
      const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
      attempts += 1
      if (elements.length === 0 && attempts < 40) return
      window.clearInterval(timer)
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting)
          if (visible.length > 0) {
            visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
            setActive(visible[0].target.id)
          }
        },
        { rootMargin: '-72px 0px -65% 0px' },
      )
      elements.forEach((element) => observer!.observe(element))
    }, 50)

    return () => {
      window.clearInterval(timer)
      observer?.disconnect()
      setActive(null)
    }
  }, [sectionKey])

  if (!page || page.sections.length === 0) return null

  return (
    <nav aria-label="On this page" className="toc">
      <Text size="xs" fw={600} tt="uppercase" lts="0.08em" c="dimmed" mb="sm">
        On this page
      </Text>
      {page.sections.map((section, index) => (
        <UnstyledButton
          key={section.id}
          className="toc__link"
          data-active={active === section.id || undefined}
          data-group={section.group || undefined}
          data-nested={(!section.group && page.sections.slice(0, index).some((item) => item.group)) || undefined}
          onClick={() => navigate(sectionPath(pathname, section.id), { replace: true })}
        >
          {section.title}
        </UnstyledButton>
      ))}
    </nav>
  )
}
