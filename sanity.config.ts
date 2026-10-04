import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { projectId, dataset, apiVersion } from './src/sanity/env'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'
import { RecordImportTool } from './src/sanity/components/RecordImportTool'

export default defineConfig({
  name: 'default',
  title: 'Portfolio Armanda Asani',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  tools: (prev) => [
    ...prev,
    { name: 'platten-import', title: 'Platten-Import', component: RecordImportTool },
  ],
  schema: {
    types: schemaTypes,
  },
})
