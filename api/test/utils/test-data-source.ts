import path from 'path'
import { AppDataSource } from '../../src/config'
import { DataSourceOptions } from 'typeorm'

export async function initializeTestDataSource() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }

  const options: DataSourceOptions = {
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    entities: [path.join(__dirname, '../../src/entities/*.{ts,js}')],
  }

  AppDataSource.setOptions(options)
  await AppDataSource.initialize()
  return AppDataSource
}

export async function closeTestDataSource() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
}
