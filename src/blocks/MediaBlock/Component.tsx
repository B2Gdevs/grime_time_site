import type { StaticImageData } from 'next/image'

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  blockIndex?: number
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
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
  } = props

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
        (media && typeof media === 'object' && typeof blockIndex === 'number' ? (
          <InlinePageMediaEditor relationPath={`layout.${blockIndex}.media`}>
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
