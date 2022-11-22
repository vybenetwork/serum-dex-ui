import { LazyLoadImage } from 'react-lazy-load-image-component'

import empty_logo from 'assets/images/emptyLogo/emptyLogo.png'

export default function Logo({ alt, src, ...rest }: { alt: string; src: string }) {
  return (
    <LazyLoadImage
      alt={alt}
      src={src}
      {...rest}
      onError={({ currentTarget }: { currentTarget: any; }) => {
        currentTarget.onerror = null
        currentTarget.src = empty_logo
      }}
    />
  )
}