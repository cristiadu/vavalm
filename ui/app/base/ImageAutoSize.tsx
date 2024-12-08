
import React from 'react'
import Image, { ImageProps } from 'next/image'

const ImageAutoSize: React.FC<ImageProps> = (props) => {
  return (
    <Image
      {...props}
      alt={props.alt}
      style={{ maxWidth: props.width, maxHeight: props.height,  width: props.width || 'auto', height: props.height || 'auto', ...props.style }}
    />
  )
}

export default ImageAutoSize
