import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import type { SQL } from 'drizzle-orm';
import { and, eq, ilike, or, desc } from 'drizzle-orm';

import { vetOwnerTable } from '../schema/vet-owner.js';
import type { VetOwnerRow, NewVetOwnerRow } from '../schema/vet-owner.js';

export interface VetOwnerSearchParams {
  query?: string;
  referralSource?: string;
  limit?: number;
  offset?: number;
}

export class VetOwnerRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<VetOwnerRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(vetOwnerTable).orderBy(desc(vetOwnerTable.created_at))
    );
  }

  async getById({ id }: { id: string }): Promise<VetOwnerRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(vetOwnerTable).where(eq(vetOwnerTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async getByContactId({ contactId }: { contactId: string }): Promise<VetOwnerRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(vetOwnerTable).where(eq(vetOwnerTable.contact_id, contactId)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewVetOwnerRow }): Promise<VetOwnerRow[]> {
    const row = { ...data, id: data.id ?? crypto.randomUUID() };
    return this.db.ormQuery((tx) => tx.insert(vetOwnerTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewVetOwnerRow>;
  }): Promise<VetOwnerRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(vetOwnerTable).set(data).where(eq(vetOwnerTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(vetOwnerTable).where(eq(vetOwnerTable.id, id)));
  }

  // ---------------------------------------------------------------------------
  // Búsqueda
  // ---------------------------------------------------------------------------

  async search({
    query,
    referralSource,
    limit,
    offset,
  }: VetOwnerSearchParams): Promise<VetOwnerRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [];

      if (query) {
        const pattern = `%${query}%`;
        const searchCond = or(
          ilike(vetOwnerTable.emergency_phone, pattern),
          ilike(vetOwnerTable.notes, pattern)
        );
        if (searchCond) conditions.push(searchCond);
      }

      if (referralSource) {
        conditions.push(eq(vetOwnerTable.referral_source, referralSource));
      }

      let q = tx.select().from(vetOwnerTable);

      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as typeof q;
      }

      q = q.orderBy(desc(vetOwnerTable.created_at)) as typeof q;

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
  // Vínculo
  // ---------------------------------------------------------------------------

  async ensureOwner({
    contactId,
    data,
  }: {
    contactId: string;
    data?: Partial<NewVetOwnerRow>;
  }): Promise<VetOwnerRow> {
    const existing = await this.getByContactId({ contactId });
    if (existing) return existing;

    const rows = await this.create({
      data: { ...data, contact_id: contactId } as NewVetOwnerRow,
    });
    return rows[0];
  }
}
