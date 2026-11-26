# Details panel: UI review session

> Agenda for reviewing the Work Scheduling details panel. The scenarios it must cover, the assignment rules and the
> decisions already made are in `plans/workforce-scheduling.md` ("Details panel scenarios"). Each item below has what we
> see today, the options and a recommendation, so the session can decide instead of discover. Write the outcome under
> each item and move the decisions into the living plan.

**Inputs**
- The live demo: `/#/patterns/workforce-scheduling`. Click B. Haddad on Fri, Jun 5, the open shift on Tue, Jun 2, and an empty cell.
- Prototype screenshots in `public/figma/`:
  - `workforce-scheduling-panel-blocks.png`: J. Anderson, PatD + Spe OT, three segments.
  - `-panel-live.png`: a live post, "2 of 4 still needed".
  - `-panel-bulk.png`: two cells selected.
  - `-panel-attachments.png`: Tags, Assets, Tasks. Its free-text inputs are wrong; see "Attachments tab" in the living plan.
  - `-add-task.png`: the calendar's Add task modal.
- More screenshots, matched to scenarios 1–8 as they arrive.

**Already decided (don't reopen)**
- The panel shows the whole day as blocks.
- Non-touching times split into a new block at once, with a note and Undo.
- A partial leave is a segment inside the block.
- Out of unit is editable; out of branch is read-only.
- Notes go into the Attachments tab.

---

## 1. Tabs

**Today**: Details · Attachments (0) · Notes. Notes is a whole tab for one short text. Decided: Notes moves into Attachments, which then holds Tags, Assets, Tasks and Notes.

**Options**
- A. Two tabs: "Details · Attachments (3)". The count covers all four sections.
- B. No tabs. Attachments go in a collapsible section at the end of Details.
- C. Option A, plus the latest note shown read-only at the end of Details.

**Recommendation**: C. With four sections, Attachments is too big to collapse into Details (so not B). A note like "Court case moved to 14:00" changes how the shift is run, so it should be visible without switching tabs.
**Also decide**: the tab name ("Attachments" is now a stretch for notes and tasks; maybe "Extras" or "Tags & tasks"), and whether the tab shows a dot or a count.

**Outcome** (2026-11-25):
- **Two tabs: "Details · Attachments (3)"**. The name stays "Attachments". The count covers tags, assets, tasks and notes.
- The **latest note** also shows read-only at the end of Details, with a link to the Attachments tab.

## 2. Segment list vs Times card

**Today**: each segment row shows its times read-only. The selected segment's times are edited in a separate card below (Scheduled, Start, End, Hours), so the same value shows twice and the link between them is only a highlight.

**Options**
- A. Edit times **inline in the segment row** (code, start, end, hours). The card keeps only Scheduled date and Set actual.
- B. Keep the card, but give it a heading for the segment it edits ("Spe · 20:00–18:00") and connect it to the row visually.

**Recommendation**: A. Typing times is the main task (it's how blocks get split), and doing it in the row makes the touching/non-touching result show up in place.

**Reversed after trying it (2026-11-25, user):** one form below the segment list, with the Times card back (Scheduled, Start, End, Hours, Set actual). See "Step 1 as built" in the living plan.

~~**Outcome** (2026-11-25): **the Times card goes away.**~~
- **Times are edited in the row**: the expanded segment's row turns into inputs (code, start, end, hours).
- **The date belongs to the block**: "Move to another day" (block header or ⋯) moves all its segments. Segments show "+1 day" past midnight.
- **Set actual is per segment**: "+ Set actual" in the expanded segment reveals Actual start/end. The row then shows the actual times, with the scheduled ones dimmed.

## 3. Field scope

**Today**: Activity, Location, Hours modifier, Bank this time, Unit, Rank (acting) and Customer sit under the segments without saying whether they belong to the selected segment, the block or the whole day. In the screenshot, Activity is "On-Call" while the selected segment is Spe.

**Questions**
- Which fields are per segment? Likely Activity, Location, Hours modifier, Customer.
- Which are per block or per day? Likely Employee, Branch, Unit.
- Do per-segment fields belong inside the expanded segment row?

**Recommendation**: group the fields under the thing they belong to. Per-segment fields go in the expanded segment and per-day fields go at the top. No free-floating form.

**Outcome** (2026-11-25):
- **Almost every field is per segment**: times, Activity, Location, Hours modifier, Bank this time, Customer, Unit and Rank (acting). Shared at the top: Employee and Branch.
- **Layout: fields inside the segment.** The selected segment expands like an accordion and holds its times and fields. The other segments stay one-line rows (code, times, hours, ⋯).
- **Bank this time** (new, user): checking it reveals two fields:
  - a **Time bank** `Select`: Overtime, Comp Time, Holiday;
  - an **Amount** number input labelled "Amount (h) · 16 avail.", where the available hours depend on the bank chosen.
- Not decided: is Branch per day or per block? It's assumed per day; out of branch makes the whole block read-only. And what does "avail." count: the bank's balance, or how much more it can take?

## 4. Blocks UI

**To design**
- How a block looks: a card per block, its segments chained (touching ends joined), and a total ("08:00–17:00 · 9h").
- How a collapsed block summarises: codes, times, hours and flags (OT, leave).
- Where the "Doesn't touch 08:00–16:00. It shows on its own line." note sits (under the new block?), and how long Undo stays.
- How partial leave is drawn inside a block: an indented leave segment with "5h worked · 3h leave".
- Whether "+ Add segment" adds to the block or to the day.

**Recommendation**: one card per block, with "+ Add segment" inside each card and "+ Add assignment" at the bottom of the day.

**Replaced after trying it (2026-11-25, user):** no cards. One list, each block's first segment as the root with the touching segments indented; a non-touching assignment starts a new root. The root row shows the block total.

~~**Outcome** (2026-11-25):~~
- **A card per block**, the same as one grid cell. The header shows the times and the total ("08:00–17:00 · 9h"), and its touching segments are joined rows inside. A collapsed block shrinks to its header ("18:00–19:00 · 1h · Spe ▸").
- **One "+ Add segment"** at the end of the day, not one per block. The new segment starts where the last one ends, so it touches. Typing other times decides which block it lands in, and a split-off shows the note with Undo.
- **Partial leave is nested under the segment it overlaps**: an indented row with a leave fill. The block header splits the hours ("5h worked · 3h leave").

## 5. Per-segment icon buttons

**Today**: every segment row has four icons: Post as live, Find an employee, Cancel segment, and ⋯. With three segments that's 12 icons, and their meanings aren't obvious.

**Options**
- A. Show them only on the selected segment.
- B. Keep only ⋯ (with the actions inside) and show the most used one as a labeled button on the selected segment.
- C. Leave them as they are.

**Recommendation**: B. First confirm which action is most used.

**Outcome** (2026-11-25): **icons only on the expanded segment.** Collapsed rows show only ⋯. The expanded one shows Post as live, Find an employee, Cancel segment and ⋯, all with tooltips.

## 6. Hours format and overnight

**Today**: Hours shows "22:00", which reads like a time of day. "20:00–18:00" doesn't say that it ends the next day.

**Recommendation**: show durations as "22h" / "7h 30m". Add a "+1 day" mark on overnight ends, and a warning when an overnight segment is unlikely (> 16h, say).

**Outcome** (2026-11-25):
- Durations are shown as **"8h" / "7h 30m"**.
- An end time past midnight shows **"04:00 +1"**.
- A span over 16h gets a field warning: "22h · ends the next day. Is that right?"

## 7. Warnings

**Today (prototype)**: a yellow "Over weekly hours cap · Week of Feb 15 · 74h of 50h ›" banner under the employee row.

**Questions**
- Which warnings exist? Hours cap, minimum rest between shifts, overlapping segments, missing certification, out of unit/branch.
- Where do they go: one stack under the header, or next to the field that causes them?
- Do any of them block saving, or ask for a reason (override)?
- Where does "›" lead?

**Recommendation**: a single warnings stack under the header, collapsed to "2 warnings" when there are several. Field-specific errors (times) sit on the field.

**Outcome** (2026-11-25):
- **Four warnings**:
  - hours cap ("Over weekly hours cap · 74h of 50h");
  - minimum rest ("Only 6h rest after Tuesday's night shift · 8h minimum");
  - missing qualification ("Not certified for Special Event");
  - double booked / on leave ("Already on Vac this day", or booked in another unit or branch at the same time).
- **One stack under the employee row**, collapsed to "2 warnings ›" when there are several. Each warning names the block or segment it's about, and that block's header gets a ⚠ mark.
- **Warnings never block**: the change is saved, then the warning appears, and the grid cell gets a small ⚠ mark. Only invalid times (item 9) aren't saved.
- **Assign mode**: clicking a filled cell replaces its assignment (Undo reverts), and dragging assigns every cell in the range.

## 8. Employee row

**Today**: the employee picker, then Hours, Crosshair and Chevron, whose meanings are guesses. Employee details lost their entry point when names started selecting rows.

**Questions**: what each button does. Can the chevron open employee details (`EmployeeDetailsModal`)?

**Outcome** (2026-11-25, user):
- **Hours**: a popover with the person's hours summary: this week and this period, overtime, and bank balances. That's where "16 avail." for Bank this time comes from.
- **Crosshair**: "Find in schedule". It scrolls the grid to the person's row and highlights it.
- **Chevron**: a menu of actions for the person: Message, Call, View profile (opens `EmployeeDetailsModal`, so employee details are back) and View schedule.

## 9. Footer and save model

**Today**: "Assign" is the primary button even when the cell is already assigned. Edits aren't saved anywhere and there's no dirty state.

**Options**
- A. Save / Discard. They appear (or enable) once something has changed, and leaving with changes asks first.
- B. Autosave each field, with Undo in the toolbar.

**Also**: what "Leave" does on a multi-block day (one block or the whole day), and what the footer shows for a leave, an open shift and an out-of-branch assignment (read-only, so no footer?).

**Recommendation**: A for the panel. Batch edits across segments are common, and Undo across many fields is hard to follow.

**Outcome** (2026-11-25):
- **Autosave** (user, against my recommendation). Each field saves when you leave it, and the toolbar's Undo reverts. There are no Save or Discard buttons.
- **Leave adds a leave entry**: a small inline form with the leave type and "All day" or from–to. The times default to the expanded block. Part of a block becomes a partial leave (nested row); the whole block becomes a full leave.
- **Footers**:
  - Open shift / live post: **Assign**.
  - **Every state gets the same footer: Assign + Leave + ⋯** (History, Delete). Buttons that don't apply are disabled (e.g. out of branch, which is read-only).
- **Assign** on a filled cell **copies the shift and enters an assign mode**: each cell you then click gets the shift, until Escape cancels. On an open shift it assigns the picked employee.
- **Invalid times aren't saved**. The field shows an error ("Overlaps PatD 08:00–16:00") and the last valid value stays saved. Leaving the panel drops the invalid edit.
- **The demo's grid updates for real** (user). This replaces the old rule "the grid data never changes": the demo keeps an editable copy of the mock data, edits re-split cells and lines live, Undo works, and Reset demo restores the data.

## 10. Out of unit and out of branch

**To design**
- Banner copy: "Working for Special Ops · out of unit" and "Working at 84th Precinct - Brooklyn · read-only here".
- What read-only looks like: plain text values instead of disabled inputs.
- The **grid mark** for out of branch. Today only out of unit is hatched (with an OU arrow). Options: the same hatching with a different tag ("OB"), or a muted cell with a precinct tag.

**Outcome** (2026-11-25):
- **Grid**: an out-of-branch cell is **muted** (greyed fill) with a **branch tag** ("↗ 84th"). Out of unit keeps its hatching and OU arrow. Neither counts toward this unit's bodies.
- **Read-only panel**: fields become plain label + value pairs ("Activity · Patrol"), and segment rows have no inputs. Footer buttons are disabled (item 9).
- **Banner copy (short)**:
  - OU: "Working for Special Ops (out of unit)".
  - OB: "Working at 84th Precinct. Only 84th Precinct can change this." with an "Open in 84th Precinct" link (preview only).

## 11. Consistency

- Branch has its label inline on the left; every other field has its label on top.
- The header is long ("Editing: Wed, Feb 18, 2026 · J. Anderson"). Option: name as the title, with "Wed, Feb 18 · Day watch" as the subtitle.
- The leave panel and the open-shift panel should share the same skeleton (header, day summary, blocks, fields, footer).

**Outcome** (2026-11-25):
- **The name is the title** ("J. Anderson", or "Open shift · Swing Patrol"). The subtitle is "Wed, Feb 18, 2026 · Day watch". "Editing:" goes away.
- **Branch gets its label on top**, like every other field.

## 12. Bulk panel

**Today (demo)**: "N cells selected · N activities, N empty", a list of the selected cells, "Apply to all" fields (Activity, Location, Hours modifier, Unit), then Assign, Leave and ⋯.
**Prototype** (`-panel-bulk.png`):
- A help line: "Shift+click extends the range, Ctrl+click adds…".
- A Shift `Select` with "Assign to 2".
- Load from template, Paste (disabled) and Delete all.

**Questions**
- Is the main bulk job "put this shift code on all of them" (prototype) or "change a field on all of them" (demo)? Probably both, with the code first.
- Keep the list of selected cells? It helps with Ctrl+click selections that aren't on screen, but it is long for a month-wide drag.
- The help line teaches selection every time. Show it once, or move it into an empty state.
- The bulk actions should match the context menu (Copy, Paste, Load from template, Pre-fill, Leave, Post, Fill).

**Recommendation**:
- A shift code `Select` + "Assign to N" at the top.
- The selected cells collapsed to a summary ("4 people · Jun 1–5 · 2 empty") that expands into the list.
- "Change fields" as a secondary section.
- Context-menu actions in the footer ⋯. Delete all goes there in red, and confirms first.

**Outcome** (2026-11-25):
- Title "6 cells selected". **No list of the selected cells** (the grid shows them).
- At the top: a **shift code picker + "Assign to 6"**. Below it, a collapsed **"Change fields"** section (Activity, Location, Hours modifier, Unit). With autosave, a field applies to all the selected cells when you leave it, and Undo reverts.
- **Footer as for one cell**: Assign + Leave + ⋯. The ⋯ holds Load from template, Paste, History and Delete all (red, asks first).
- The **selection help line** moves to the empty state (Blank): "Shift+click extends the range, Ctrl+click adds or removes cells. Right-click for more."

## 13. Attachments tab layout

**Prototype** (`-panel-attachments.png`): three stacked sections with uppercase eyebrows, counts, "None yet." and an input + Add per section. The inputs will become two dropdowns, category → value (Custom = free text, tags only).

**Questions**
- With two dropdowns plus a button, the row is crowded at 380px. Options:
  - A. Both dropdowns and Add on one row.
  - B. The category on its own row, then the value.
  - C. One grouped `Select` ("Vehicle › Lambo 05") with search, plus Custom as the last group.
- Empty sections: show all four with "None yet.", or only the ones that have content plus an "+ Add tag / asset / task / note" menu?
- How added tags and assets look (chips vs rows), and how tasks show (name, time, reminders) with edit/delete.
- Tasks open the calendar's Add task modal, which is large. Keep the modal, or use a shorter inline form?

**Recommendation**:
- C for tags and assets: one searchable grouped picker, so the row fits and typing "lambo" finds it. Picking Custom turns the field into a text input.
- Show only sections with content, plus an "Add" menu.
- Keep the calendar modal for tasks, so both pages share one task form.

**Outcome** (2026-11-25):
- **Tags and assets: one grouped, searchable picker** ("Search tags…"). Values are grouped by category, so typing "lambo" finds "Vehicle › Lambo 05". For tags only, "Custom…" is the last option and turns the field into a text input. Added items show as removable chips ("Vehicle · Lambo 05 ✕").
- **All four sections are always shown** (Tags, Assets, Tasks, Notes), each with its count, "None yet." and its own add control.
- **Tasks**: "+ Add task" opens the calendar's task modal (as specified by the user earlier).

---

## After the session

- [x] All 13 items decided on 2026-11-25. Move each outcome into `plans/workforce-scheduling.md` ("Details panel scenarios") and tick off the items here.
- Then build: mock data for scenarios 5–8, `groupBlocks`, the panel modes and the validation states.
