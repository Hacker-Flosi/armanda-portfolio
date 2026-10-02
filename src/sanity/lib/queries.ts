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
  cvUrl?: string
  impressumCredits?: { role?: string; name?: string }[]
}

export type DesignMedia = {
  image?: SanityImageSource
  videoUrl?: string
  aspectRatio: number | null
  isMobileCover: boolean
}

export type DesignPlay = {
  _id: string
  title?: string
  image?: SanityImageSource
  videoUrl?: string
  aspectRatio: number | null
}

export type DesignWork = {
  _id: string
  title: string
  slug: string
  images: DesignMedia[]
  client?: string
  tags: string[]
  year?: string
  description?: string
  challenge?: string
  approach?: string
  result?: string
  role?: string
  order: number
}

export type DesignTimelineItem = {
  _key: string
  title?: string
  year: number
  note?: string
  image?: SanityImageSource
  videoUrl?: string
  aspectRatio: number | null
}

export type DesignTimeline = {
  _id: string
  title: string
  text?: string
  lanes: { _key: string; name: string; description?: string; items: DesignTimelineItem[] }[]
}

export type DesignInterest = {
  _id: string
  kind: 'foto' | 'platte'
  title?: string
  artist?: string
  year?: string
  note?: string
  spotifyUrl?: string
  image?: SanityImageSource
  aspectRatio: number | null
}

export type DesignAbout = {
  spotifyPlaylistUrl?: string
  loves?: string
  looking?: string
  process?: { title?: string; text?: string }[]
  introText?: string
  introVideoUrl?: string
  bio?: string
  approach?: string
  services?: string[]
  clients?: string[]
  industries?: string[]
}

const artworksQuery = /* groq */ `*[_type == "artwork"] | order(order asc){
  _id, title, "slug": slug.current,
  "images": images[]{ image, isMobileCover, "aspectRatio": image.asset->metadata.dimensions.aspectRatio },
  edition, year, dimensions, medium, status, order
}`

const aboutQuery = /* groq */ `*[_type == "about"][0]{ photo, bio, exhibitions }`

const siteSettingsQuery = /* groq */ `*[_type == "siteSettings"][0]{
  mailAddress, mailSubject, instagramUrl, printsUrl, designUrl, impressumCredits, "cvUrl": cvFile.asset->url
}`

const designWorksQuery = /* groq */ `*[_type == "designWork"] | order(order asc){
  _id, title, "slug": slug.current,
  "images": images[]{ image, isMobileCover, "videoUrl": video.asset->url, "aspectRatio": image.asset->metadata.dimensions.aspectRatio },
  client, "tags": coalesce(tags, select(defined(category) => [category], [])), year, description, challenge, approach, result, role, order
}`

const designPlayQuery = /* groq */ `*[_type == "designPlay"] | order(order asc){
  _id, title, image, "videoUrl": video.asset->url,
  "aspectRatio": image.asset->metadata.dimensions.aspectRatio
}`

const designTimelineQuery = /* groq */ `*[_type == "designTimeline"] | order(order asc){
  _id, title, text,
  "lanes": lanes[]{
    _key, name, description,
    "items": items[]{
      _key, title, year, note, image, "videoUrl": video.asset->url,
      "aspectRatio": image.asset->metadata.dimensions.aspectRatio
    }
  }
}`

const designInterestQuery = /* groq */ `*[_type == "designInterest"] | order(order asc){
  _id, kind, title, artist, year, note, spotifyUrl, image,
  "aspectRatio": image.asset->metadata.dimensions.aspectRatio
}`

const designAboutQuery = /* groq */ `*[_type == "designAbout"][0]{ spotifyPlaylistUrl, loves, looking, process, introText, "introVideoUrl": introVideo.asset->url, bio, approach, services, clients, industries }`

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

export async function getDesignAbout(): Promise<DesignAbout | null> {
  return client.fetch(designAboutQuery)
}

export async function getDesignPlay(): Promise<DesignPlay[]> {
  return client.fetch(designPlayQuery)
}

export async function getDesignTimelines(): Promise<DesignTimeline[]> {
  return client.fetch(designTimelineQuery)
}

export async function getDesignInterests(): Promise<DesignInterest[]> {
  return client.fetch(designInterestQuery)
}
