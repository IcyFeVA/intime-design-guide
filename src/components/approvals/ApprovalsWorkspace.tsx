import { useState } from 'react'
import { Splitter } from '@mantine/core'
import type { SplitterPaneSize } from '@mantine/hooks'
import { ApprovalActionsPane, ApprovalDetailPane, ApprovalListPane, VisibilityModal } from './Approvals'
import type { ApprovalsState } from './useApprovals'
import classes from './Approvals.module.css'

type Px = `${number}px`
const px = (size: SplitterPaneSize | undefined, fallback: Px): Px => typeof size === 'string' && size.endsWith('px') ? size as Px : fallback

/**
 * Desktop body below the filters: list, detail and action panel in a Mantine Splitter.
 * Drag a handle (or focus it and use the arrow keys) to change a width; double-click to reset.
 * While several requests are selected the detail pane is hidden and the list takes its space.
 */
export default function ApprovalsWorkspace({ state }: { state: ApprovalsState }) {
  const [listWidth, setListWidth] = useState<Px>('440px')
  const [panelWidth, setPanelWidth] = useState<Px>('360px')
  const [visibility, setVisibility] = useState(false)
  const selecting = state.selection.length > 0

  return (
    <>
      <Splitter
        key={selecting ? 'selecting' : 'single'}
        className={classes.workspace}
        classNames={{ handle: classes.splitHandle }}
        withHandle={false}
        lineSize={1}
        handleColor="var(--border-default)"
        step="16px"
        shiftStep="64px"
        onResizeEnd={(_, sizes) => {
          if (!selecting) setListWidth((value) => px(sizes[0], value))
          setPanelWidth((value) => px(sizes[sizes.length - 1], value))
        }}
        aria-label="Approvals"
      >
        {selecting ? (
          <Splitter.Pane defaultSize={100} min={40}>
            <ApprovalListPane state={state} onVisibility={() => setVisibility(true)} />
          </Splitter.Pane>
        ) : (
          <Splitter.Pane defaultSize={listWidth} min="320px" max="640px">
            <ApprovalListPane state={state} onVisibility={() => setVisibility(true)} />
          </Splitter.Pane>
        )}
        {!selecting && (
          <Splitter.Pane defaultSize={100} min={30}>
            <ApprovalDetailPane state={state} />
          </Splitter.Pane>
        )}
        <Splitter.Pane defaultSize={panelWidth} min="280px" max="520px">
          <ApprovalActionsPane state={state} />
        </Splitter.Pane>
      </Splitter>
      <VisibilityModal
        key={String(visibility)}
        opened={visibility}
        kind={state.kind}
        visible={state.visible}
        onClose={() => setVisibility(false)}
        onApply={state.setVisible}
      />
    </>
  )
}
