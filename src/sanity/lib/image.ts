import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { projectId, dataset } from '../env'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
