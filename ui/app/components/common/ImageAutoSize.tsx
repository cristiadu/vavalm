import React, { useEffect, useState, useMemo } from 'react'
import Image, { ImageProps } from 'next/image'
import { objectURLOrDefault } from '@/api/models/helpers';

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageFile?: File | null;
  fallbackSrc?: string;
  src?: string;
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  const { imageFile: imageFile, fallbackSrc, src, width, height, style, ...rest } = props
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