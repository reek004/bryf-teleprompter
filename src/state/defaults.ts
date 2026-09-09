import type { ScriptDoc, Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 30,
  margin: 24,
  speed: 50,
  align: 'center',
  flipX: false,
  flipY: false,
  bgColor: '#000000',
  textColor: '#ffffff',
  lineHeight: 1.4,
  toolbarSide: 'top',
}

export const SETTING_LIMITS = {
  fontSize: { min: 20, max: 140, step: 1 },
  margin: { min: 0, max: 40, step: 1 },
  speed: { min: 1, max: 100, step: 1 },
} as const

export const SAMPLE_SCRIPT: ScriptDoc = {
  name: 'Sample script',
  html: [
    '<h2>1914 translation by H. Rackham</h2>',
    '<p>"On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain.</p>',
    '<p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided.</p>',
    '<p>But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."</p>',
    '<p><strong>Import a .docx</strong> or tap the pencil to write your own script.</p>',
  ].join(''),
}
