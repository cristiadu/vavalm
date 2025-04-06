import React, { useEffect, useState, useMemo } from 'react'
import Image, { ImageProps } from 'next/image'
import { objectURLOrDefault } from '@/api/models/helpers';

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageBlob?: Blob | null;
  fallbackSrc?: string;
  src?: string;
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  const { imageBlob, fallbackSrc, src, width, height, style, ...rest } = props
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageBlob) {
      const url = objectURLOrDefault(imageBlob, null)
      setObjectUrl(url)

      // Clean up the object URL when the component unmounts or when imageBlob changes
      return (): void => {
        if (url) {
          URL.revokeObjectURL(url)
        }
      }
    } else {
      setObjectUrl(null)
    }
  }, [imageBlob])

  // Memoize the image source to prevent unnecessary re-renders
  const imageSrc = useMemo(() => objectUrl || src || fallbackSrc || '', [objectUrl, src, fallbackSrc])

  return (
    <Image
      {...rest}
      alt={props.alt || 'Image'}
      src={imageSrc}
      width={width}
      height={height}
      style={{ maxWidth: width, maxHeight: height, width: width, height: height, ...style }}
    />
  )
}

// Use React.memo to prevent unnecessary re-renders of this component
export default React.memo(ImageAutoSize)