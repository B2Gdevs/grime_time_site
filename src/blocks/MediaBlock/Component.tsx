import type { StaticImageData } from 'next/image'

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import { useResolvedComposerBlockIndex } from '@/components/page-composer/useResolvedComposerBlockIndex'
import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  blockIndex?: number
  sectionIdentity?: string
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    blockIndex,
    captionClassName,
    className,
    sectionIdentity,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
  } = props
  const { resolvedBlockIndex } = useResolvedComposerBlockIndex({
    blockIndex,
    sectionIdentity,
  })

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div
      className={cn(
        '',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) &&
        (media && typeof media === 'object' && typeof resolvedBlockIndex === 'number' ? (
          <InlinePageMediaEditor relationPath={`layout.${resolvedBlockIndex}.media`}>
            <Media
              imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
              resource={media}
              src={staticImage}
            />
          </InlinePageMediaEditor>
        ) : (
          <Media
            imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
            resource={media}
            src={staticImage}
          />
        ))}
      {caption && (
        <div
          className={cn(
            'mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )}
    </div>
  )
}
