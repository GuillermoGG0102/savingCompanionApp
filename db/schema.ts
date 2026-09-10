import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Todos los importes se guardan en la unidad mínima de la moneda (céntimos,
 * como integer) para que las sumas y restas del cierre mensual no arrastren
 * errores de redondeo de coma flotante.
 */

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  annualSalary: integer('annual_salary').notNull(),
  monthlyNetPay: integer('monthly_net_pay').notNull(),
  currency: text('currency').notNull(),
  payDayOfMonth: integer('pay_day_of_month').notNull(),
});

export const category = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  kind: text('kind', { enum: ['fixed', 'variable'] }).notNull(),
});

export const subcategory = sqliteTable('subcategory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => category.id),
  name: text('name').notNull(),
});

export const fixedExpense = sqliteTable('fixed_expense', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => category.id),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  dayOfMonth: integer('day_of_month').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const expense = sqliteTable('expense', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subcategoryId: integer('subcategory_id')
    .notNull()
    .references(() => subcategory.id),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  note: text('note'),
});

export const asset = sqliteTable('asset', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['cash', 'bank', 'investment', 'crypto', 'other'],
  }).notNull(),
});

export const assetSnapshot = sqliteTable('asset_snapshot', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id')
    .notNull()
    .references(() => asset.id),
  monthKey: text('month_key').notNull(),
  value: integer('value').notNull(),
});

export const monthClose = sqliteTable('month_close', {
  monthKey: text('month_key').primaryKey(),
  income: integer('income').notNull(),
  fixedTotal: integer('fixed_total').notNull(),
  variableTotal: integer('variable_total').notNull(),
  netWorth: integer('net_worth').notNull(),
  savingsRate: real('savings_rate').notNull(),
  closedAt: text('closed_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});
