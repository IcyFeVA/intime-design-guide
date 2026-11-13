import { Tooltip, UnstyledButton } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import type { SwatchDef, ThemeToken } from '../../tokens/themes'
import classes from './Colors.module.css'

export type CopyFormat = 'var' | 'hex'

interface TokenSwatchProps {
  def: SwatchDef
  token?: ThemeToken
  /** `fill` (surface chip), `text` (rounded chip) or `border` (ring on canvas) */
  variant?: 'fill' | 'text' | 'border'
  /** Theme background used behind border chips */
  canvas: string
  copyFormat: CopyFormat
}

/** "SG Swatch" from the Figma colors frame. Click to copy the token. */
export default function TokenSwatch({ def, token, variant = 'fill', canvas, copyFormat }: TokenSwatchProps) {
  const clipboard = useClipboard({ timeout: 1500 })
  const cssVar = `var(--${def.token})`
  const copyValue = copyFormat === 'var' || !token ? cssVar : token.value
  const chipStyle =
    variant === 'border'
      ? { background: canvas, borderColor: token?.value ?? 'transparent' }
      : { background: token?.value ?? 'transparent' }

  return (
    <Tooltip
      multiline
      w={260}
      label={
        token
          ? `--${def.token}${token.alias ? ` → ${token.alias}` : ''}${token.assumed ? ' (assumed primitive)' : ''}. Click to copy ${copyFormat === 'var' ? 'CSS variable' : 'value'}.`
          : `--${def.token} is not defined in this theme.`
      }
    >
      <UnstyledButton
        className={classes.swatch}
        onClick={() => clipboard.copy(copyValue)}
        data-missing={!token || undefined}
        aria-label={`${def.label}, ${token?.value ?? 'not defined'}. Copy ${copyValue}`}
      >
        <div className={classes.chip} data-variant={variant} style={chipStyle}>
          {clipboard.copied && <span className={classes.chipCopied}>Copied</span>}
        </div>
        <div className={classes.swatchMeta}>
          <span className={classes.swatchName}>{def.label}</span>
          <span className={classes.swatchValue}>{token?.value ?? '—'}</span>
          {token?.alias && <span className={classes.swatchAlias}>{token.alias}</span>}
        </div>
      </UnstyledButton>
    </Tooltip>
  )
}
