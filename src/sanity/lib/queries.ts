import { client } from './client'
import type { SanityImageSource } from '@sanity/image-url'

export type ArtworkImage = {
  image: SanityImageSource
  aspectRatio: number | null
  isMobileCover: boolean
}

export type Artwork = {
  _id: string
  title: string
  slug: string
  images: ArtworkImage[]
  edition?: string
  year?: string
  dimensions?: string
  medium?: string
  status?: 'verfuegbar' | 'verkauft' | 'none'
  order: number
}

export type Exhibition = {
  year?: string
  type?: string
  title?: string
  location?: string
}

export type About = {
  photo?: SanityImageSource
  bio?: string
  exhibitions?: Exhibition[]
}

export type SiteSettings = {
  mailAddress?: string
  mailSubject?: string
  instagramUrl?: string
  printsUrl?: string
  designUrl?: string
  impressumCredits?: { role?: string; name?: string }[]
}

export type DesignImage = {
  image: SanityImageSource
  aspectRatio: number | null
  isMobileCover: boolean
}

export type DesignWork = {
  _id: string
  title: string
  slug: string
  images: DesignImage[]
  client?: string
  category?: string
  year?: string
  description?: string
  order: number
}

const artworksQuery = /* groq */ `*[_type == "artwork"] | order(order asc){
  _id, title, "slug": slug.current,
  "images": images[]{ image, isMobileCover, "aspectRatio": image.asset->metadata.dimensions.aspectRatio },
  edition, year, dimensions, medium, status, order
}`

const aboutQuery = /* groq */ `*[_type == "about"][0]{ photo, bio, exhibitions }`

const siteSettingsQuery = /* groq */ `*[_type == "siteSettings"][0]{
  mailAddress, mailSubject, instagramUrl, printsUrl, designUrl, impressumCredits
}`

const designWorksQuery = /* groq */ `*[_type == "designWork"] | order(order asc){
  _id, title, "slug": slug.current,
  "images": images[]{ image, isMobileCover, "aspectRatio": image.asset->metadata.dimensions.aspectRatio },
  client, category, year, description, order
}`

export async function getArtworks(): Promise<Artwork[]> {
  return client.fetch(artworksQuery)
}

export async function getAbout(): Promise<About | null> {
  return client.fetch(aboutQuery)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(siteSettingsQuery)
}

export async function getDesignWorks(): Promise<DesignWork[]> {
  return client.fetch(designWorksQuery)
}
