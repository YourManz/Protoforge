import Dexie, { type Table } from 'dexie'
import type { ProtoforgeProject } from '@/types/project'

class ProtoforgeDB extends Dexie {
  projects!: Table<ProtoforgeProject>

  constructor() {
    super('ProtoforgeDB')
    this.version(1).stores({
      projects: 'id, createdAt, title',
    })
  }
}

export const db = new ProtoforgeDB()

export async function saveProject(project: ProtoforgeProject) {
  await db.projects.put(project)
}

export async function getAllProjects(): Promise<ProtoforgeProject[]> {
  return db.projects.orderBy('createdAt').reverse().toArray()
}

export async function deleteProject(id: string) {
  await db.projects.delete(id)
}
