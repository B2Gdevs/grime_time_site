import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
  type?: string
}

export function createLexicalParagraph(text: string): DefaultTypedEditorState {
  return {
    root: {
      children: [
        {
          children: text.trim()
            ? [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text,
                  type: 'text',
                  version: 1,
                },
              ]
            : [],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as DefaultTypedEditorState
}

function collectLexicalText(node: LexicalNode | null | undefined, lines: string[]) {
  if (!node) return

  if (typeof node.text === 'string') {
    lines.push(node.text)
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => collectLexicalText(child, lines))

    if (node.type === 'paragraph' || node.type === 'heading') {
      lines.push('\n')
    }
  }
}

export function lexicalToPlainText(value: null | DefaultTypedEditorState | undefined): string {
  if (!value?.root) {
    return ''
  }

  const lines: string[] = []
  collectLexicalText(value.root as LexicalNode, lines)

  return lines.join('').replace(/\n{3,}/g, '\n\n').trim()
}
