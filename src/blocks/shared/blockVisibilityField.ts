import type { Field } from 'payload'

export const blockVisibilityField: Field = {
  name: 'isHidden',
  type: 'checkbox',
  defaultValue: false,
  label: 'Hide this block',
  admin: {
    description:
      'Keep this block in the page draft and composer, but omit it from the rendered page until it is shown again.',
  },
}
