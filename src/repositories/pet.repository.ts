import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import type { SQL } from 'drizzle-orm';
import { eq, and, or, ilike, isNull, sql, asc, desc } from 'drizzle-orm';

import { petTable } from '../schema/pet.js';
import type { PetRow, NewPetRow } from '../schema/pet.js';

export interface PetSearchParams {
  query?: string;
  species?: string;
  status?: string;
  breed?: string;
  ownerId?: string;
  tags?: string[];
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface CountResult {
  label: string;
  count: number;
}

export class PetRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<PetRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(petTable).where(isNull(petTable.deleted_at)));
  }

  async getById({ id }: { id: string }): Promise<PetRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(petTable).where(eq(petTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewPetRow }): Promise<PetRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      status: data.status ?? 'active',
      is_active: data.is_active ?? true,
    };
    return this.db.ormQuery((tx) => tx.insert(petTable).values(row).returning());
  }

  async update({ id, data }: { id: string; data: Partial<NewPetRow> }): Promise<PetRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(petTable).set(data).where(eq(petTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(petTable).where(eq(petTable.id, id)));
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  async softDelete({ id }: { id: string }): Promise<PetRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) =>
      tx
        .update(petTable)
        .set({ deleted_at: now, updated_at: now } as Partial<PetRow>)
        .where(eq(petTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<PetRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(petTable)
        .set({ deleted_at: null, updated_at: new Date().toISOString() } as Partial<PetRow>)
        .where(eq(petTable.id, id))
        .returning()
    );
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search({
    query,
    species,
    status,
    breed,
    ownerId,
    tags,
    isActive,
    includeDeleted,
    limit,
    offset,
    orderBy: orderByField,
    orderDir = 'asc',
  }: PetSearchParams): Promise<PetRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [];

      if (!includeDeleted) {
        conditions.push(isNull(petTable.deleted_at));
      }

      if (query) {
        const pattern = `%${query}%`;
        conditions.push(
          or(
            ilike(petTable.name, pattern),
            ilike(petTable.breed, pattern),
            ilike(petTable.microchip_number, pattern),
            ilike(petTable.notes, pattern)
          )
        );
      }

      if (species) {
        conditions.push(eq(petTable.species, species));
      }

      if (status) {
        conditions.push(eq(petTable.status, status));
      }

      if (breed) {
        conditions.push(ilike(petTable.breed, `%${breed}%`));
      }

      if (ownerId) {
        conditions.push(eq(petTable.owner_id, ownerId));
      }

      if (isActive !== undefined) {
        conditions.push(eq(petTable.is_active, isActive));
      }

      if (tags && tags.length > 0) {
        conditions.push(
          sql`${petTable.tags} ?| array[${sql.join(
            tags.map((t) => sql`${t}`),
            sql`, `
          )}]`
        );
      }

      let q = tx.select().from(petTable);

      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as typeof q;
      }

      // Ordenamiento
      const sortableColumns: Record<string, () => typeof q> = {
        name: () => q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.name)) as typeof q,
        species: () => q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.species)) as typeof q,
        breed: () => q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.breed)) as typeof q,
        status: () => q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.status)) as typeof q,
        birth_date: () =>
          q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.birth_date)) as typeof q,
        created_at: () =>
          q.orderBy((orderDir === 'desc' ? desc : asc)(petTable.created_at)) as typeof q,
      };

      const applySorting = orderByField ? sortableColumns[orderByField] : undefined;
      if (applySorting) {
        q = applySorting();
      } else {
        q = q.orderBy(desc(petTable.created_at)) as typeof q;
      }

      if (limit) {
        q = q.limit(limit) as typeof q;
      }

      if (offset) {
        q = q.offset(offset) as typeof q;
      }

      return q;
    });
  }

  // ---------------------------------------------------------------------------
  // Por dueño
  // ---------------------------------------------------------------------------

  async listByOwner({ ownerId }: { ownerId: string }): Promise<PetRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(petTable)
        .where(and(eq(petTable.owner_id, ownerId), isNull(petTable.deleted_at)))
        .orderBy(asc(petTable.name))
    );
  }

  // ---------------------------------------------------------------------------
  // Especializados
  // ---------------------------------------------------------------------------

  async findByMicrochip({
    microchipNumber,
  }: {
    microchipNumber: string;
  }): Promise<PetRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(petTable)
        .where(and(eq(petTable.microchip_number, microchipNumber), isNull(petTable.deleted_at)))
        .limit(1)
    );
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async countBySpecies(): Promise<CountResult[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(sql`
        SELECT species AS label, COUNT(*)::int AS count
        FROM ${petTable}
        WHERE deleted_at IS NULL
        GROUP BY species
        ORDER BY count DESC
      `)
    );
    return rows as unknown as CountResult[];
  }

  async countByStatus(): Promise<CountResult[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(sql`
        SELECT status AS label, COUNT(*)::int AS count
        FROM ${petTable}
        WHERE deleted_at IS NULL
        GROUP BY status
        ORDER BY count DESC
      `)
    );
    return rows as unknown as CountResult[];
  }
}
