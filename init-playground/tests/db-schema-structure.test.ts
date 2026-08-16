import { type Column } from 'drizzle-orm/column';
import { getTableName } from 'drizzle-orm/table';
import { getTableColumns } from 'drizzle-orm/utils';
import { describe, expect, it } from 'vitest';

import { features, techs, visitCounters } from '../src/server/db/schema';
///
/// The behaviour tests in `db.test.ts` address the schema *through* Drizzle, so
/// a mutant that silently renames a table/column or drops a constraint stays
/// green (the query API follows whatever name the mutated schema declares).
/// That is exactly what the low mutation score was reporting: every surviving
/// mutant in `src/server/db/schema.ts` lives in the *literal* schema shape
/// (table name, column names, `text`/`integer` types, `notNull`, `primaryKey`,
/// `unique`, defaults, auto-increment).
///
/// This file is the structural complement: it asserts the schema's contract
/// shape directly from Drizzle's column/build metadata, so a schema edit the
/// behaviour tests cannot see is caught here. Each column is pinned by
/// name -> { notNull, primary, autoIncrement, isUnique, explicitSqlName,
/// default, hasDefault }.
///
/// `explicitSqlName` is `!col.keyAsName`: it is false exactly when Drizzle had
/// to fall back to the TS property name because the literal SQL name written in
/// the schema file was an empty string. That fallback is precisely what Stryker's
/// StringLiteral mutant (`text('title')` -> `text('')`) produces — the resolved
/// `col.name` still reads `'title'`, but `keyAsName` flip betrays the empty
/// literal. So `explicitSqlName` catches the empty-string mutants that the
/// resolved name cannot.

type SchemaTable = typeof features | typeof techs | typeof visitCounters;

interface Struct {
  notNull: boolean;
  primary: boolean;
  isUnique: boolean;
  explicitSqlName: boolean;
  default: unknown;
  hasDefault: boolean;
}

/// Read Drizzle's own public column fields (no re-declared expectation, no
/// protected internals), normalized to plain booleans.
const columnsOf = (table: SchemaTable): Record<string, Column> => getTableColumns(table);

const structOf = (table: SchemaTable): Record<string, Struct> =>
  Object.fromEntries(
    Object.entries(columnsOf(table)).map(([name, col]) => [
      name,
      {
        notNull: col.notNull,
        primary: col.primary,
        isUnique: col.isUnique,
        explicitSqlName: !col.keyAsName,
        default: col.default,
        hasDefault: col.hasDefault,
      },
    ]),
  );

const sqlTypesOf = (table: SchemaTable): Record<string, string> =>
  Object.fromEntries(
    Object.entries(columnsOf(table)).map(([colName, col]) => [colName, col.getSQLType()]),
  );

/// The resolved (non-fallback) SQL DDL column name.
const sqlNamesOf = (table: SchemaTable): Record<string, string> =>
  Object.fromEntries(Object.entries(columnsOf(table)).map(([colName, col]) => [colName, col.name]));

/// The DDL table name Drizzle will emit.
const tableNameOf = (table: SchemaTable): string => getTableName(table);

const bare = {
  notNull: true,
  primary: false,
  isUnique: false,
  explicitSqlName: true,
  default: undefined,
  hasDefault: false,
} as const;

const pk = {
  notNull: true,
  primary: true,
  isUnique: false,
  explicitSqlName: true,
  default: undefined,
  hasDefault: true,
};

const defaultedZero = {
  notNull: false,
  primary: false,
  isUnique: false,
  explicitSqlName: true,
  default: 0,
  hasDefault: true,
};

describe('db schema structure (§46.11-A oracle)', () => {
  it('features: exact column set and structural flags', () => {
    expect.assertions(1);
    expect(structOf(features)).toStrictEqual({
      description: bare,
      icon: bare,
      id: pk,
      sortOrder: defaultedZero,
      title: bare,
    });
  });

  it('features: columns emit the exact DDL types', () => {
    expect.assertions(1);
    expect(sqlTypesOf(features)).toStrictEqual({
      description: 'text',
      icon: 'text',
      id: 'integer',
      sortOrder: 'integer',
      title: 'text',
    });
  });

  it('features: DDL column names match the literal schema strings', () => {
    expect.assertions(1);
    expect(sqlNamesOf(features)).toStrictEqual({
      description: 'description',
      icon: 'icon',
      id: 'id',
      sortOrder: 'sort_order',
      title: 'title',
    });
  });

  it('techs: exact column set and structural flags', () => {
    expect.assertions(1);
    expect(structOf(techs)).toStrictEqual({
      description: bare,
      id: pk,
      name: bare,
      sortOrder: defaultedZero,
      url: bare,
      version: bare,
    });
  });

  it('techs: columns emit with the exact DDL types', () => {
    expect.assertions(1);
    expect(sqlTypesOf(techs)).toStrictEqual({
      description: 'text',
      id: 'integer',
      name: 'text',
      sortOrder: 'integer',
      url: 'text',
      version: 'text',
    });
  });

  it('techs: DDL column names match the literal schema strings', () => {
    expect.assertions(1);
    expect(sqlNamesOf(techs)).toStrictEqual({
      description: 'description',
      id: 'id',
      name: 'name',
      sortOrder: 'sort_order',
      url: 'url',
      version: 'version',
    });
  });

  it('visit_counters: pins notNull, a defaulted counter, PK and unique name', () => {
    expect.assertions(1);
    expect(structOf(visitCounters)).toStrictEqual({
      counter: { ...bare, notNull: true, default: 0, hasDefault: true },
      id: pk,
      name: { ...bare, isUnique: true },
    });
  });

  it('visit_counters: DDL column names match the literal schema strings', () => {
    expect.assertions(1);
    expect(sqlNamesOf(visitCounters)).toStrictEqual({
      counter: 'counter',
      id: 'id',
      name: 'name',
    });
  });

  it('every table declares the exact DDL table name Drizzle will emit', () => {
    expect.assertions(1);
    expect([tableNameOf(features), tableNameOf(techs), tableNameOf(visitCounters)]).toStrictEqual([
      'features',
      'techs',
      'visit_counters',
    ]);
  });
});
