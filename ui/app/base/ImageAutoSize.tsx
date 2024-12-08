import React from 'react'
import Image, { ImageProps } from 'next/image'

type ImageAutoSizeProps = Omit<ImageProps, 'src'> & {
  imageBlob?: Blob;
  fallbackSrc?: string;
  src?: string;
}

const getImageSrc = (props: ImageAutoSizeProps) => {
  if (props.imageBlob) {
    return URL.createObjectURL(props.imageBlob)
  }

  return props.fallbackSrc || props.src || ''
}

const ImageAutoSize: React.FC<ImageAutoSizeProps> = (props) => {
  return (
    <Image
      {...props}
      alt={props.alt}
      src={getImageSrc(props)}
      width={props.width}
      height={props.height}
      style={{ maxWidth: props.width, maxHeight: props.height, width: props.width, height: props.height, ...props.style }}
    />
  )
}

export default ImageAutoSize
