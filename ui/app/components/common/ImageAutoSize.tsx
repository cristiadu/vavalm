import React, { useEffect, useState, useMemo } from 'react'
import Image, { ImageProps } from 'next/image'
import { objectURLOrDefault } from '@/api/models/helpers'
import { resolveApiAssetUrl } from '@/api/models/constants'

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageFile?: File | null;
  fallbackSrc?: string;
  src?: string;
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  const { imageFile, fallbackSrc, src, width, height, style, unoptimized, className, ...rest } = props
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageFile) {
      const url = objectURLOrDefault(imageFile, null)
      setObjectUrl(url)

      return (): void => {
        if (url) {
          URL.revokeObjectURL(url)
        }
      }
    } else {
      setObjectUrl(null)
    }
  }, [imageFile])

  // No Image fallback
  const NoImageFallback = () => (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-yellow-100">
      <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-15h-2v6h2V7zm0 8h-2v2h2v-2z" />
      </svg>
    </span>

  )

  // Memoize the image source to prevent unnecessary re-renders
  const imageSrc = useMemo(
    () => resolveApiAssetUrl(src || objectUrl || fallbackSrc || ''),
    [src, objectUrl, fallbackSrc],
  )
  const isApiAsset = Boolean(src?.startsWith('/api/'))

  return (
    <span
      className={className}
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        flexShrink: 0,
        height,
        justifyContent: 'center',
        overflow: 'hidden',
        width,
      }}
    >
      {imageSrc ? (
        <Image
          {...rest}
          alt={props.alt || 'Image'}
          src={imageSrc}
          width={width}
          height={height}
          unoptimized={unoptimized || isApiAsset}
          style={{ ...style, height: '100%', objectFit: style?.objectFit || 'contain', width: '100%' }}
        />
      ) : (
        <NoImageFallback />
      )}
    </span>
  )
}

// Use React.memo to prevent unnecessary re-renders of this component
export default React.memo(ImageAutoSize)
