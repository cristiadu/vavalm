import React, { useEffect, useState } from 'react'
import Image, { ImageProps } from 'next/image'

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageBlob?: Blob;
  fallbackSrc?: string;
  src?: string;
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  const { imageBlob, fallbackSrc, src, width, height, style, ...rest } = props
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageBlob) {
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

  const imageSrc = objectUrl || src || fallbackSrc || ''

  return (
    <Image
      {...rest}
      alt={props.alt}
      src={imageSrc}
      width={width}
      height={height}
      style={{ maxWidth: width, maxHeight: height, width: width, height: height, ...style }}
    />
  )
}

export default ImageAutoSize