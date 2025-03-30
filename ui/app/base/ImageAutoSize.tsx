import React, { useEffect, useState, useMemo } from 'react'
import Image, { ImageProps } from 'next/image'

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageBlob?: Blob | null;
  fallbackSrc?: string;
  src?: string;
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  const { imageBlob, fallbackSrc, src, width, height, style, ...rest } = props
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageBlob && imageBlob instanceof Blob) {
      const url = URL.createObjectURL(imageBlob)
      setObjectUrl(url)

      // Clean up the object URL when the component unmounts or when imageBlob changes
      return () => {
        URL.revokeObjectURL(url)
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
      alt={props.alt}
      src={imageSrc}
      width={width}
      height={height}
      style={{ maxWidth: width, maxHeight: height, width: width, height: height, ...style }}
      // Remove lazy loading and priority attributes as they may be causing issues
    />
  )
}

// Use React.memo to prevent unnecessary re-renders of this component
export default React.memo(ImageAutoSize)