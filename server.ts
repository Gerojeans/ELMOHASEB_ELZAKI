import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

// Fix for potential NaN port issue if PGPORT is set to something invalid
if (process.env.PGPORT && isNaN(parseInt(process.env.PGPORT))) {
  delete process.env.PGPORT;
}

const _filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== 'undefined' ? __filename : '');
const _dirname = typeof import.meta !== 'undefined' && import.meta.url
  ? path.dirname(_filename)
  : (typeof __dirname !== 'undefined' ? __dirname : '');

const { Pool } = pg;

// Database configuration
let currentDatabaseUrl = process.env.DATABASE_URL;
let pool = createPool(currentDatabaseUrl);

function createPool(url: string | undefined) {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined') {
    return new Pool({
      host: 'missing-database-url',
      port: 5432
    });
  }

  try {
    // Basic validation: if it doesn't look like a URI, try to fix it or handle it
    let connectionConfig: any = {
      ssl: {
        rejectUnauthorized: false
      }
    };

    if (url.includes('://')) {
      connectionConfig.connectionString = url;
    } else {
      // If it's just a hostname or something else, it's likely invalid as a connection string
      // but we'll let pg try to parse it as a connection string anyway, 
      // or we could try to construct a URI.
      // Most cloud providers provide a full URI.
      connectionConfig.connectionString = url.startsWith('postgres') ? url : `postgresql://${url}`;
    }

    const poolInstance = new Pool(connectionConfig);
    
    // Add error listener to the pool to prevent crashes from unhandled 'error' events
    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
    
    return poolInstance;
  } catch (err) {
    console.error('Error creating pool config:', err);
    const fallbackPool = new Pool({
      host: 'invalid-database-url',
      port: 5432
    });
    fallbackPool.on('error', (err) => {
      console.error('Unexpected error on idle client (fallback)', err);
    });
    return fallbackPool;
  }
}

if (!currentDatabaseUrl) {
  console.error('CRITICAL: DATABASE_URL environment variable is missing!');
  console.error('The application will not be able to connect to PostgreSQL.');
}

// Initialize database schema for PostgreSQL
async function initDb(url: string | undefined, p: any) {
  if (!url || url.trim() === '' || url === 'undefined') {
    console.warn('DATABASE_URL is missing or invalid. Skipping DB initialization.');
    return;
  }

  let client;
  try {
    client = await p.connect();
    client.on('error', (err: any) => {
      console.error('Unexpected error on checked out client in initDb', err);
    });
    console.log('Connected to PostgreSQL. Initializing schema...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        parent_id TEXT REFERENCES chart_of_accounts(id),
        type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
        description TEXT,
        balance DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS description TEXT;

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category TEXT,
        unit TEXT,
        quantity DECIMAL DEFAULT 0,
        cost_price DECIMAL DEFAULT 0,
        sale_price DECIMAL DEFAULT 0,
        min_stock DECIMAL DEFAULT 0,
        warehouse_id TEXT REFERENCES warehouses(id),
        serial_no TEXT,
        expiry_date DATE,
        is_taxable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        quote_number TEXT UNIQUE NOT NULL,
        party_id TEXT REFERENCES suppliers_customers(id),
        date DATE DEFAULT CURRENT_DATE,
        total_amount DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'expired'
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quote_items (
        id TEXT PRIMARY KEY,
        quote_id TEXT REFERENCES quotes(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id),
        quantity DECIMAL NOT NULL,
        unit_price DECIMAL NOT NULL,
        total DECIMAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT REFERENCES products(id),
        from_warehouse_id TEXT REFERENCES warehouses(id),
        to_warehouse_id TEXT REFERENCES warehouses(id),
        quantity DECIMAL NOT NULL,
        type TEXT NOT NULL, -- 'transfer', 'adjustment', 'initial'
        reason TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'cash', -- 'cash' or 'bank'
        account_number TEXT,
        bank_name TEXT,
        branch_name TEXT,
        currency_id TEXT,
        account_id TEXT REFERENCES chart_of_accounts(id),
        balance DECIMAL DEFAULT 0,
        initial_balance DECIMAL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES chart_of_accounts(id);

      CREATE TABLE IF NOT EXISTS product_units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS customer_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS supplier_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS tax_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rate DECIMAL DEFAULT 0,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS currencies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        symbol TEXT,
        exchange_rate DECIMAL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user', -- 'admin', 'user'
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS suppliers_customers (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'supplier' or 'customer'
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        account_id TEXT REFERENCES chart_of_accounts(id),
        balance DECIMAL DEFAULT 0,
        opening_balance DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE suppliers_customers ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES chart_of_accounts(id);

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'sale', 'purchase', 'sale_return', 'purchase_return'
        invoice_type TEXT DEFAULT 'cash', -- 'cash', 'credit', 'visa'
        party_id TEXT REFERENCES suppliers_customers(id),
        date DATE DEFAULT CURRENT_DATE,
        total_amount DECIMAL DEFAULT 0,
        paid_amount DECIMAL DEFAULT 0,
        due_amount DECIMAL DEFAULT 0,
        tax_amount DECIMAL DEFAULT 0,
        payment_method TEXT, -- 'cash', 'check', 'credit'
        check_number TEXT,
        check_date DATE,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        warehouse_id TEXT REFERENCES warehouses(id),
        account_id TEXT REFERENCES bank_accounts(id),
        time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        reference_id TEXT, -- transaction_id or other ref
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id TEXT PRIMARY KEY,
        journal_entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
        account_id TEXT REFERENCES chart_of_accounts(id),
        debit DECIMAL DEFAULT 0,
        credit DECIMAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id),
        quantity DECIMAL NOT NULL,
        unit TEXT,
        unit_price DECIMAL NOT NULL,
        total DECIMAL NOT NULL,
        tax_percent DECIMAL DEFAULT 0,
        tax_amount DECIMAL DEFAULT 0,
        net_amount DECIMAL DEFAULT 0,
        discount_amount DECIMAL DEFAULT 0,
        discount_percent DECIMAL DEFAULT 0
      );

      ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS unit TEXT;

      CREATE TABLE IF NOT EXISTS financial_records (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'income', 'expense'
        method TEXT NOT NULL, -- 'cash', 'check', 'bank_transfer'
        amount DECIMAL NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        category_id TEXT REFERENCES expense_categories(id),
        account_id TEXT REFERENCES bank_accounts(id),
        check_number TEXT,
        check_date DATE,
        transaction_id TEXT REFERENCES transactions(id)
      );

      CREATE TABLE IF NOT EXISTS product_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS sales_reps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT
      );

      CREATE TABLE IF NOT EXISTS shipping_cos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT
      );

      CREATE TABLE IF NOT EXISTS cost_centers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT
      );

      CREATE TABLE IF NOT EXISTS financial_docs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT
      );

      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand_id TEXT REFERENCES brands(id)
      );

      CREATE TABLE IF NOT EXISTS transport_cars (
        id TEXT PRIMARY KEY,
        plate_number TEXT NOT NULL,
        driver_name TEXT
      );

      CREATE TABLE IF NOT EXISTS transport_drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        from_warehouse_id TEXT REFERENCES warehouses(id),
        to_warehouse_id TEXT REFERENCES warehouses(id),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS transfer_items (
        id TEXT PRIMARY KEY,
        transfer_id TEXT REFERENCES transfers(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id),
        quantity DECIMAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS adjustments (
        id TEXT PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        warehouse_id TEXT REFERENCES warehouses(id),
        type TEXT NOT NULL, -- 'in' or 'out'
        reason TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS adjustment_items (
        id TEXT PRIMARY KEY,
        adjustment_id TEXT REFERENCES adjustments(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id),
        quantity DECIMAL NOT NULL
      );

      -- Add columns if they don't exist for existing tables
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='warehouse_id') THEN
          ALTER TABLE products ADD COLUMN warehouse_id TEXT REFERENCES warehouses(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='serial_no') THEN
          ALTER TABLE products ADD COLUMN serial_no TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='expiry_date') THEN
          ALTER TABLE products ADD COLUMN expiry_date DATE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='barcode') THEN
          ALTER TABLE products ADD COLUMN barcode TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='electronic_invoice_code') THEN
          ALTER TABLE products ADD COLUMN electronic_invoice_code TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='code2') THEN
          ALTER TABLE products ADD COLUMN code2 TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='wholesale_price') THEN
          ALTER TABLE products ADD COLUMN wholesale_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='half_wholesale_price') THEN
          ALTER TABLE products ADD COLUMN half_wholesale_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_purchase_price') THEN
          ALTER TABLE products ADD COLUMN last_purchase_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_sale_price') THEN
          ALTER TABLE products ADD COLUMN min_sale_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='avg_purchase_price') THEN
          ALTER TABLE products ADD COLUMN avg_purchase_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='market_price') THEN
          ALTER TABLE products ADD COLUMN market_price DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='manual_cost') THEN
          ALTER TABLE products ADD COLUMN manual_cost DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='profit_percent_retail') THEN
          ALTER TABLE products ADD COLUMN profit_percent_retail DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='profit_percent_wholesale') THEN
          ALTER TABLE products ADD COLUMN profit_percent_wholesale DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='profit_percent_half_wholesale') THEN
          ALTER TABLE products ADD COLUMN profit_percent_half_wholesale DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='profit_percent_min_sale') THEN
          ALTER TABLE products ADD COLUMN profit_percent_min_sale DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='discount_retail') THEN
          ALTER TABLE products ADD COLUMN discount_retail DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='discount_wholesale') THEN
          ALTER TABLE products ADD COLUMN discount_wholesale DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='discount_half_wholesale') THEN
          ALTER TABLE products ADD COLUMN discount_half_wholesale DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='max_stock') THEN
          ALTER TABLE products ADD COLUMN max_stock DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tax_percent') THEN
          ALTER TABLE products ADD COLUMN tax_percent DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
          ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='name_en') THEN
          ALTER TABLE products ADD COLUMN name_en TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='coding_type') THEN
          ALTER TABLE products ADD COLUMN coding_type TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_assembly') THEN
          ALTER TABLE products ADD COLUMN is_assembly BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_service') THEN
          ALTER TABLE products ADD COLUMN is_service BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='has_expiry') THEN
          ALTER TABLE products ADD COLUMN has_expiry BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='has_serial') THEN
          ALTER TABLE products ADD COLUMN has_serial BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stop_sale') THEN
          ALTER TABLE products ADD COLUMN stop_sale BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stop_purchase') THEN
          ALTER TABLE products ADD COLUMN stop_purchase BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='concrete_type') THEN
          ALTER TABLE products ADD COLUMN concrete_type TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='additional_statement') THEN
          ALTER TABLE products ADD COLUMN additional_statement TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='group_id') THEN
          ALTER TABLE products ADD COLUMN group_id TEXT REFERENCES product_groups(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand_id') THEN
          ALTER TABLE products ADD COLUMN brand_id TEXT REFERENCES brands(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='model_id') THEN
          ALTER TABLE products ADD COLUMN model_id TEXT REFERENCES models(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='origin') THEN
          ALTER TABLE products ADD COLUMN origin TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='warranty') THEN
          ALTER TABLE products ADD COLUMN warranty TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='no_points') THEN
          ALTER TABLE products ADD COLUMN no_points BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='no_discount') THEN
          ALTER TABLE products ADD COLUMN no_discount BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='for_rent') THEN
          ALTER TABLE products ADD COLUMN for_rent BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='part_numbers') THEN
          ALTER TABLE products ADD COLUMN part_numbers TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='categories') THEN
          ALTER TABLE products ADD COLUMN categories TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='groups') THEN
          ALTER TABLE products ADD COLUMN groups TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_taxable') THEN
          ALTER TABLE products ADD COLUMN is_taxable BOOLEAN DEFAULT TRUE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers_customers' AND column_name='opening_balance') THEN
          ALTER TABLE suppliers_customers ADD COLUMN opening_balance DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='tax_amount') THEN
          ALTER TABLE transactions ADD COLUMN tax_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='document_number') THEN
          ALTER TABLE transactions ADD COLUMN document_number TEXT;
          ALTER TABLE transactions ADD CONSTRAINT transactions_type_doc_number_unique UNIQUE (type, document_number);
        ELSE
          -- If it already exists, we might need to change the constraint from global unique to composite unique
          -- Check if it has a global unique constraint
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name='transactions' AND constraint_type='UNIQUE' 
            AND constraint_name='transactions_document_number_key'
          ) THEN
            ALTER TABLE transactions DROP CONSTRAINT transactions_document_number_key;
            ALTER TABLE transactions ADD CONSTRAINT transactions_type_doc_number_unique UNIQUE (type, document_number);
          END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='discount_amount') THEN
          ALTER TABLE transactions ADD COLUMN discount_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='discount_percent') THEN
          ALTER TABLE transactions ADD COLUMN discount_percent DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='paid_amount') THEN
          ALTER TABLE transactions ADD COLUMN paid_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='due_amount') THEN
          ALTER TABLE transactions ADD COLUMN due_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='branch_id') THEN
          ALTER TABLE transactions ADD COLUMN branch_id TEXT REFERENCES branches(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='project_id') THEN
          ALTER TABLE transactions ADD COLUMN project_id TEXT REFERENCES projects(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='cost_center_id') THEN
          ALTER TABLE transactions ADD COLUMN cost_center_id TEXT REFERENCES cost_centers(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='sales_rep_id') THEN
          ALTER TABLE transactions ADD COLUMN sales_rep_id TEXT REFERENCES sales_reps(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='shipping_co_id') THEN
          ALTER TABLE transactions ADD COLUMN shipping_co_id TEXT REFERENCES shipping_cos(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='transport_car_id') THEN
          ALTER TABLE transactions ADD COLUMN transport_car_id TEXT REFERENCES transport_cars(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='transport_driver_id') THEN
          ALTER TABLE transactions ADD COLUMN transport_driver_id TEXT REFERENCES transport_drivers(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='pricing_type') THEN
          ALTER TABLE transactions ADD COLUMN pricing_type TEXT DEFAULT 'retail';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='warehouse_id') THEN
          ALTER TABLE transactions ADD COLUMN warehouse_id TEXT REFERENCES warehouses(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='account_id') THEN
          ALTER TABLE transactions ADD COLUMN account_id TEXT REFERENCES bank_accounts(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='time') THEN
          ALTER TABLE transactions ADD COLUMN time TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='invoice_type') THEN
          ALTER TABLE transactions ADD COLUMN invoice_type TEXT DEFAULT 'cash'; -- 'cash', 'credit', 'visa'
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='paid_amount') THEN
          ALTER TABLE transactions ADD COLUMN paid_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='due_amount') THEN
          ALTER TABLE transactions ADD COLUMN due_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='created_at') THEN
          ALTER TABLE transactions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_items' AND column_name='tax_percent') THEN
          ALTER TABLE transaction_items ADD COLUMN tax_percent DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_items' AND column_name='tax_amount') THEN
          ALTER TABLE transaction_items ADD COLUMN tax_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_items' AND column_name='net_amount') THEN
          ALTER TABLE transaction_items ADD COLUMN net_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_items' AND column_name='discount_amount') THEN
          ALTER TABLE transaction_items ADD COLUMN discount_amount DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction_items' AND column_name='discount_percent') THEN
          ALTER TABLE transaction_items ADD COLUMN discount_percent DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_records' AND column_name='category_id') THEN
          ALTER TABLE financial_records ADD COLUMN category_id TEXT REFERENCES expense_categories(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_records' AND column_name='account_id') THEN
          ALTER TABLE financial_records ADD COLUMN account_id TEXT REFERENCES bank_accounts(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='type') THEN
          ALTER TABLE bank_accounts ADD COLUMN type TEXT DEFAULT 'cash';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='currency_id') THEN
          ALTER TABLE bank_accounts ADD COLUMN currency_id TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='branch_name') THEN
          ALTER TABLE bank_accounts ADD COLUMN branch_name TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='initial_balance') THEN
          ALTER TABLE bank_accounts ADD COLUMN initial_balance DECIMAL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='is_active') THEN
          ALTER TABLE bank_accounts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
      END $$;
    `);

    // Seed with mock data if empty
    const userCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCountRes.rows[0].count) === 0) {
      console.log('Seeding default admin user...');
      await client.query(`
        INSERT INTO users (id, username, password, full_name, role)
        VALUES ('u1', 'admin', 'admin123', 'المدير العام', 'admin');
      `);
    }

    const settingsCountRes = await client.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(settingsCountRes.rows[0].count) === 0) {
      console.log('Seeding default system settings...');
      await client.query(`
        INSERT INTO system_settings (key, value)
        VALUES 
        ('is_activated', 'false'), 
        ('activation_key', 'ACTIVATE-2026'),
        ('app_name', 'المحاسب الذكي'),
        ('font_family', 'Cairo'),
        ('bg_color', '#E4E3E0'),
        ('text_color', '#141414'),
        ('heading_color', '#141414'),
        ('detail_color', '#141414'),
        ('card_bg', '#FFFFFF'),
        ('default_tax_percent', '14'),
        ('sales_account_id', 'acc9'),
        ('sales_returns_account_id', 'acc9'),
        ('purchases_account_id', 'acc10'),
        ('purchase_returns_account_id', 'acc10'),
        ('input_vat_account_id', 'acc13'),
        ('output_vat_account_id', 'acc12'),
        ('discount_allowed_account_id', 'acc14'),
        ('discount_earned_account_id', 'acc15'),
        ('default_cash_account_id', 'ba2'),
        ('default_bank_account_id', 'ba1');
      `);
    }

    // Fix Invoice #3 amount if it was incorrectly entered as 53000
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM transactions WHERE document_number = '3' AND type = 'sale' AND total_amount = 53000) THEN
          -- Update transaction
          UPDATE transactions SET total_amount = 5300, due_amount = 5300 - COALESCE(paid_amount, 0) WHERE document_number = '3' AND type = 'sale';
          -- Update items (calculate unit price based on quantity)
          UPDATE transaction_items SET total = 5300, unit_price = 5300 / NULLIF(quantity, 0) WHERE transaction_id = (SELECT id FROM transactions WHERE document_number = '3' AND type = 'sale');
          -- Update financial record
          UPDATE financial_records SET amount = 5300 WHERE transaction_id = (SELECT id FROM transactions WHERE document_number = '3' AND type = 'sale');
          -- Update customer balance (reduce by 47700)
          UPDATE suppliers_customers SET balance = balance - 47700 WHERE id = (SELECT party_id FROM transactions WHERE document_number = '3' AND type = 'sale');
        END IF;

        -- One-time fix for Invoice #3 if it was already incorrectly updated to unit_price 5300 with quantity > 1
        IF EXISTS (SELECT 1 FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id WHERE t.document_number = '3' AND t.type = 'sale' AND ti.unit_price = 5300 AND ti.quantity > 1) THEN
          UPDATE transaction_items SET unit_price = 5300 / NULLIF(quantity, 0) WHERE transaction_id = (SELECT id FROM transactions WHERE document_number = '3' AND type = 'sale');
        END IF;
      END $$;
    `);

    const warehouseCountRes = await client.query('SELECT COUNT(*) FROM warehouses');
    if (parseInt(warehouseCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO warehouses (id, name, location, is_default)
        VALUES ('w1', 'المخزن الرئيسي', 'المقر الرئيسي', TRUE);
      `);
    }

    const expenseCatCountRes = await client.query('SELECT COUNT(*) FROM expense_categories');
    if (parseInt(expenseCatCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO expense_categories (id, name, description)
        VALUES 
        ('ec1', 'إيجارات', 'مصاريف إيجار المحلات والمخازن'),
        ('ec2', 'رواتب', 'رواتب الموظفين والعمال'),
        ('ec3', 'كهرباء ومياه', 'فواتير المرافق العامة'),
        ('ec4', 'مشتريات', 'شراء بضاعة ومواد خام');
      `);
    }

    const bankAccCountRes = await client.query('SELECT COUNT(*) FROM bank_accounts');
    if (parseInt(bankAccCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO bank_accounts (id, name, type, bank_name, balance, account_id)
        VALUES 
        ('ba1', 'حساب بنك مصر', 'bank', 'بنك مصر', 10000, 'acc4'),
        ('ba2', 'الصندوق الرئيسي', 'cash', 'نقدي', 5000, 'acc3');
      `);
    }

    const unitCountRes = await client.query('SELECT COUNT(*) FROM product_units');
    if (parseInt(unitCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO product_units (id, name)
        VALUES 
        ('u1', 'قطعة'),
        ('u2', 'كيلو'),
        ('u3', 'متر'),
        ('u4', 'علبة'),
        ('u5', 'كرتونة'),
        ('u6', 'لتر'),
        ('u7', 'طقم');
      `);
    }

    const categoryCountRes = await client.query('SELECT COUNT(*) FROM product_categories');
    if (parseInt(categoryCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO product_categories (id, name)
        VALUES 
        ('pc1', 'إلكترونيات'),
        ('pc2', 'معدات مكتبية'),
        ('pc3', 'أثاث'),
        ('pc4', 'قرطاسية'),
        ('pc5', 'مواد خام'),
        ('pc6', 'برمجيات');
      `);
    }

    const customerGroupCountRes = await client.query('SELECT COUNT(*) FROM customer_groups');
    if (parseInt(customerGroupCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO customer_groups (id, name)
        VALUES 
        ('cg1', 'عملاء تجزئة'),
        ('cg2', 'عملاء جملة'),
        ('cg3', 'عملاء VIP'),
        ('cg4', 'موزعين');
      `);
    }

    const supplierGroupCountRes = await client.query('SELECT COUNT(*) FROM supplier_groups');
    if (parseInt(supplierGroupCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO supplier_groups (id, name)
        VALUES 
        ('sg1', 'موردين محليين'),
        ('sg2', 'موردين دوليين'),
        ('sg3', 'مصانع'),
        ('sg4', 'وكلاء حصريين');
      `);
    }

    const paymentMethodCountRes = await client.query('SELECT COUNT(*) FROM payment_methods');
    if (parseInt(paymentMethodCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO payment_methods (id, name)
        VALUES 
        ('pm1', 'نقدي'),
        ('pm2', 'حوالة بنكية'),
        ('pm3', 'شيك'),
        ('pm4', 'بطاقة ائتمان');
      `);
    }

    const taxTypeCountRes = await client.query('SELECT COUNT(*) FROM tax_types');
    if (parseInt(taxTypeCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO tax_types (id, name, rate)
        VALUES 
        ('tx1', 'ضريبة القيمة المضافة', 14),
        ('tx2', 'ضريبة الخصم والإضافة', 1),
        ('tx3', 'معفى من الضرائب', 0);
      `);
    }

    const currencyCountRes = await client.query('SELECT COUNT(*) FROM currencies');
    if (parseInt(currencyCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO currencies (id, name, code, symbol)
        VALUES 
        ('c1', 'جنيه مصري', 'EGP', 'ج.م'),
        ('c2', 'دولار أمريكي', 'USD', '$'),
        ('c3', 'ريال سعودي', 'SAR', 'ر.س');
      `);
    }

    const deptCountRes = await client.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO departments (id, name)
        VALUES 
        ('d1', 'الإدارة المالية'),
        ('d2', 'المبيعات'),
        ('d3', 'المشتريات'),
        ('d4', 'المخازن'),
        ('d5', 'الموارد البشرية');
      `);
    }

    const accountCountRes = await client.query('SELECT COUNT(*) FROM chart_of_accounts');
    if (parseInt(accountCountRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO chart_of_accounts (id, name, code, type)
        VALUES 
        ('acc1', 'الأصول المتداولة', '1100', 'asset'),
        ('acc2', 'المخزون', '1101', 'asset'),
        ('acc3', 'الصندوق', '1102', 'asset'),
        ('acc4', 'البنك', '1103', 'asset'),
        ('acc5', 'العملاء', '1104', 'asset'),
        ('acc6', 'الخصوم المتداولة', '2100', 'liability'),
        ('acc7', 'الموردين', '2101', 'liability'),
        ('acc8', 'رأس المال', '3100', 'equity'),
        ('acc9', 'المبيعات', '4100', 'revenue'),
        ('acc10', 'المشتريات', '5100', 'expense'),
        ('acc11', 'مصاريف عمومية', '5200', 'expense');
      `);
    } else {
      // Ensure specific essential accounts exist even if table is not empty
      const essentialAccounts = [
        ['acc1', 'الأصول المتداولة', '1100', 'asset'],
        ['acc2', 'المخزون', '1101', 'asset'],
        ['acc3', 'الصندوق', '1102', 'asset'],
        ['acc4', 'البنك', '1103', 'asset'],
        ['acc5', 'العملاء', '1104', 'asset'],
        ['acc6', 'الخصوم المتداولة', '2100', 'liability'],
        ['acc7', 'الموردين', '2101', 'liability'],
        ['acc8', 'رأس المال', '3100', 'equity'],
        ['acc9', 'المبيعات', '4100', 'revenue'],
        ['acc10', 'المشتريات', '5100', 'expense'],
        ['acc11', 'مصاريف عمومية', '5200', 'expense'],
        ['acc12', 'ضريبة القيمة المضافة المخرجة', '2201', 'liability'],
        ['acc13', 'ضريبة القيمة المضافة المدخلة', '1201', 'asset'],
        ['acc14', 'الخصم المسموح به', '5301', 'expense'],
        ['acc15', 'الخصم المكتسب', '4201', 'revenue']
      ];
      for (const [id, name, code, type] of essentialAccounts) {
        await client.query(
          'INSERT INTO chart_of_accounts (id, name, code, type) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE id = $1 OR code = $3)',
          [id, name, code, type]
        );
      }
    }

    const productCountRes = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCountRes.rows[0].count) === 0) {
      console.log('Seeding Accounting System with mock data...');
      
      await client.query(`
        INSERT INTO products (id, name, sku, category, unit, quantity, cost_price, sale_price, min_stock)
        VALUES 
        ('p1', 'لابتوب ديل XPS', 'DELL-001', 'إلكترونيات', 'قطعة', 15, 3500, 4200, 5),
        ('p2', 'شاشة سامسونج 27', 'SAM-27', 'إلكترونيات', 'قطعة', 25, 800, 1100, 10),
        ('p3', 'طابعة إتش بي', 'HP-LJR', 'معدات مكتبية', 'قطعة', 8, 1200, 1550, 3);

        INSERT INTO suppliers_customers (id, type, name, phone, email, balance)
        VALUES 
        ('sc1', 'supplier', 'شركة التقنية الحديثة', '0123456789', 'info@tech.com', 0),
        ('sc2', 'customer', 'أحمد محمد', '0987654321', 'ahmed@mail.com', 500);

        INSERT INTO transactions (id, type, party_id, date, total_amount, payment_method, status)
        VALUES 
        ('t1', 'purchase', 'sc1', '2026-03-20', 52500, 'cash', 'completed'),
        ('t2', 'sale', 'sc2', '2026-03-22', 4200, 'cash', 'completed');

        INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit, unit_price, total)
        VALUES 
        ('ti1', 't1', 'p1', 15, 'قطعة', 3500, 52500),
        ('ti2', 't2', 'p1', 1, 'قطعة', 4200, 4200);

        INSERT INTO financial_records (id, type, method, amount, date, description)
        VALUES 
        ('f1', 'expense', 'cash', 52500, '2026-03-20', 'شراء مخزون لابتوبات'),
        ('f2', 'income', 'cash', 4200, '2026-03-22', 'بيع لابتوب لعميل');
      `);
    }

    // Ensure columns exist before updating
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'cash';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_amount DECIMAL DEFAULT 0;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_amount DECIMAL DEFAULT 0;
    `);

    // Fix existing transactions: set invoice_type to 'cash' where payment_method is 'cash' and it's currently null or empty
    await client.query(`
      UPDATE transactions 
      SET invoice_type = 'cash' 
      WHERE (invoice_type IS NULL OR invoice_type = '') 
      AND payment_method = 'cash'
    `);

    // For cash invoices, ensure paid_amount is set to total_amount if it's 0
    await client.query(`
      UPDATE transactions 
      SET paid_amount = total_amount, due_amount = 0
      WHERE invoice_type = 'cash' 
      AND (paid_amount IS NULL OR paid_amount = 0)
      AND type IN ('sale', 'purchase', 'sale_return', 'purchase_return')
    `);

    // Recalculate party balances based on the new paid_amount values
    const parties = await client.query('SELECT id, opening_balance FROM suppliers_customers');
    for (const party of parties.rows) {
      const txs = await client.query('SELECT * FROM transactions WHERE party_id = $1', [party.id]);
      let newBalance = Number(party.opening_balance || 0);
      for (const tx of txs.rows) {
        const amount = Number(tx.total_amount);
        const paid = Number(tx.paid_amount || 0);
        const effective = (tx.type === 'sale' || tx.type === 'purchase' || tx.type === 'sale_return' || tx.type === 'purchase_return') ? (amount - paid) : amount;
        
        if (tx.type === 'sale') newBalance += effective;
        else if (tx.type === 'purchase') newBalance -= effective;
        else if (tx.type === 'sale_return') newBalance -= effective;
        else if (tx.type === 'purchase_return') newBalance += effective;
        else if (tx.type === 'sale_payment') newBalance -= amount;
        else if (tx.type === 'purchase_payment') newBalance += amount;
        else if (tx.type === 'settlement') newBalance -= amount;
      }
      await client.query('UPDATE suppliers_customers SET balance = $1 WHERE id = $2', [newBalance, party.id]);
    }
    
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (client) client.release();
  }
}

initDb(currentDatabaseUrl, pool);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check master setup connection administrator credentials
    if (username === 'amrbk') {
      const hash = crypto.createHash('sha256').update(password || '').digest('hex');
      if (hash === 'f10c0dff72a3effd8eb2f6020151313c11ade6bd532ccf329b3fbaffa1cc6e79') {
        return res.json({
          id: 'setup-admin',
          username: 'amrbk',
          full_name: 'مدير تهيئة النظام',
          role: 'setup_admin',
          is_active: true
        });
      } else {
        return res.status(401).json({ error: 'كلمة مرور تهيئة النظام غير صحيحة' });
      }
    }

    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2 AND is_active = TRUE', [username, password]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        delete user.password;
        res.json(user);
      } else {
        res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }
    } catch (err) {
      res.status(500).json({ error: 'خطأ في تسجيل الدخول' });
    }
  });

  // Check previous sale for a customer and product
  app.get('/api/check-previous-sale', async (req, res) => {
    const { party_id, product_id } = req.query;
    try {
      const result = await pool.query(`
        SELECT 
          t.document_number,
          t.date,
          ti.quantity,
          ti.unit,
          ti.unit_price,
          ti.discount_percent,
          ti.discount_amount,
          ti.tax_percent,
          ti.tax_amount,
          ti.net_amount,
          p.name as product_name,
          t.total_amount as invoice_total
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        WHERE t.type = 'sale' 
          AND t.party_id = $1 
          AND ti.product_id = $2
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT 10
      `, [party_id, product_id]);

      if (result.rows.length > 0) {
        res.json(result.rows);
      } else {
        res.status(404).json({ message: 'No previous sale found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/users', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT id, username, full_name, role, is_active FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
    }
  });

  app.post('/api/users', async (req, res) => {
    const { username, password, full_name, role, is_active } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = 'u' + Date.now();
      await pool.query(
        'INSERT INTO users (id, username, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, username, hashedPassword, full_name, role || 'user', is_active ?? true]
      );
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المستخدم' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, full_name, role, is_active } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE users SET username = $1, password = $2, full_name = $3, role = $4, is_active = $5 WHERE id = $6',
          [username, hashedPassword, full_name, role, is_active, id]
        );
      } else {
        await pool.query(
          'UPDATE users SET username = $1, full_name = $2, role = $3, is_active = $4 WHERE id = $5',
          [username, full_name, role, is_active, id]
        );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في تعديل المستخدم' });
    }
  });

  app.get('/api/settings', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM system_settings');
      const settings = result.rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الإعدادات' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
          [key, String(value)]
        );
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Error saving settings:', err);
      res.status(500).json({ error: 'خطأ في حفظ الإعدادات' });
    }
  });

  app.get('/api/settings/activation', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM system_settings WHERE key = \'is_activated\'');
      res.json({ is_activated: result.rows[0]?.value === 'true' });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب حالة التفعيل' });
    }
  });

  app.post('/api/settings/activate', async (req, res) => {
    const { key } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT value FROM system_settings WHERE key = \'activation_key\'');
      if (result.rows[0]?.value === key) {
        await pool.query('UPDATE system_settings SET value = \'true\' WHERE key = \'is_activated\'');
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'مفتاح التفعيل غير صحيح' });
      }
    } catch (err) {
      res.status(500).json({ error: 'خطأ في عملية التفعيل' });
    }
  });

  app.get('/api/db-test', async (req, res) => {
    if (!currentDatabaseUrl) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'DATABASE_URL is not set. Please add it to Settings -> Secrets or the app Settings tab.' 
      });
    }
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ status: 'connected', type: 'postgresql', time: result.rows[0].now });
    } catch (err) {
      console.error('Database connection error:', err);
      res.status(500).json({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/settings/db-connection', async (req, res) => {
    const { connectionString } = req.body;
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    try {
      console.log('Updating database connection string...');
      const newPool = createPool(connectionString);
      // Test the new connection
      await newPool.query('SELECT NOW()');
      
      // If successful, swap the pool and update the URL
      const oldPool = pool;
      pool = newPool;
      currentDatabaseUrl = connectionString;
      
      // Try to initialize schema on new DB
      await initDb(currentDatabaseUrl, pool);
      
      // Close old pool after a short delay to allow pending queries to finish
      setTimeout(() => oldPool.end().catch(console.error), 5000);

      res.json({ status: 'success', message: 'تم تحديث اتصال قاعدة البيانات بنجاح' });
    } catch (err) {
      console.error('Failed to connect with new string:', err);
      res.status(500).json({ status: 'error', message: 'فشل الاتصال بالرابط الجديد: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  app.get('/api/product-units', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM product_units ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الوحدات' });
    }
  });

  app.post('/api/product-units', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'pu' + Date.now();
      await pool.query('INSERT INTO product_units (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة الوحدة' });
    }
  });

  app.get('/api/product-categories', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM product_categories ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب التصنيفات' });
    }
  });

  app.post('/api/product-categories', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'pc' + Date.now();
      await pool.query('INSERT INTO product_categories (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة التصنيف' });
    }
  });

  app.get('/api/customer-groups', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM customer_groups ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب مجموعات العملاء' });
    }
  });

  app.post('/api/customer-groups', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'cg' + Date.now();
      await pool.query('INSERT INTO customer_groups (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة مجموعة العملاء' });
    }
  });

  app.get('/api/supplier-groups', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM supplier_groups ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب مجموعات الموردين' });
    }
  });

  app.post('/api/supplier-groups', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'sg' + Date.now();
      await pool.query('INSERT INTO supplier_groups (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة مجموعة الموردين' });
    }
  });

  app.get('/api/payment-methods', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM payment_methods ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب طرق الدفع' });
    }
  });

  app.post('/api/payment-methods', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'pm' + Date.now();
      await pool.query('INSERT INTO payment_methods (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة طريقة الدفع' });
    }
  });

  app.get('/api/tax-types', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM tax_types ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب أنواع الضرائب' });
    }
  });

  app.post('/api/tax-types', async (req, res) => {
    const { name, rate, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'tx' + Date.now();
      await pool.query('INSERT INTO tax_types (id, name, rate, description) VALUES ($1, $2, $3, $4)', [id, name, rate, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة نوع الضريبة' });
    }
  });

  app.get('/api/currencies', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM currencies ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب العملات' });
    }
  });

  app.post('/api/currencies', async (req, res) => {
    const { name, code, symbol, exchange_rate } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'c' + Date.now();
      await pool.query('INSERT INTO currencies (id, name, code, symbol, exchange_rate) VALUES ($1, $2, $3, $4, $5)', [id, name, code, symbol, exchange_rate || 1]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة العملة' });
    }
  });

  app.get('/api/departments', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM departments ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الأقسام' });
    }
  });

  app.post('/api/departments', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'd' + Date.now();
      await pool.query('INSERT INTO departments (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة القسم' });
    }
  });

  app.get('/api/coa', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM chart_of_accounts ORDER BY code ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب شجرة الحسابات' });
    }
  });

  app.post(['/api/coa', '/api/chart-of-accounts'], async (req, res) => {
    const { name, code, type, parent_id, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'acc' + Date.now();
      const finalParentId = parent_id === '' ? null : parent_id;
      await pool.query(
        'INSERT INTO chart_of_accounts (id, name, code, type, parent_id, description) VALUES ($1, $2, $3, $4, $5, $6)', 
        [id, name, code, type, finalParentId, description]
      );
      res.json({ success: true, id });
    } catch (err) {
      console.error('Error adding coa:', err);
      res.status(500).json({ error: 'خطأ في إضافة الحساب' });
    }
  });

  app.get('/api/settings/db-status', async (req, res) => {
    if (!currentDatabaseUrl) {
      return res.json({ connected: false, status: 'error', connectionString: '' });
    }
    try {
      await pool.query('SELECT NOW()');
      res.json({ connected: true, status: 'connected', connectionString: currentDatabaseUrl });
    } catch (err) {
      res.json({ connected: false, status: 'error', connectionString: currentDatabaseUrl, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/sales-reps', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM sales_reps ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب المناديب' });
    }
  });

  app.post('/api/sales-reps', async (req, res) => {
    const { name, phone } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'sr' + Date.now();
      await pool.query('INSERT INTO sales_reps (id, name, phone) VALUES ($1, $2, $3)', [id, name, phone]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المندوب' });
    }
  });

  app.get('/api/shipping-cos', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM shipping_cos ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب شركات الشحن' });
    }
  });

  app.post('/api/shipping-cos', async (req, res) => {
    const { name, phone } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'sc' + Date.now();
      await pool.query('INSERT INTO shipping_cos (id, name, phone) VALUES ($1, $2, $3)', [id, name, phone]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة شركة الشحن' });
    }
  });

  app.get('/api/cost-centers', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM cost_centers ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب مراكز التكلفة' });
    }
  });

  app.post('/api/cost-centers', async (req, res) => {
    const { name, code } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'cc' + Date.now();
      await pool.query('INSERT INTO cost_centers (id, name, code) VALUES ($1, $2, $3)', [id, name, code]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة مركز التكلفة' });
    }
  });

  app.get('/api/financial-docs', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM financial_docs ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب المستندات المالية' });
    }
  });

  app.post('/api/financial-docs', async (req, res) => {
    const { name, type } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'fd' + Date.now();
      await pool.query('INSERT INTO financial_docs (id, name, type) VALUES ($1, $2, $3)', [id, name, type]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المستند المالي' });
    }
  });

  app.get('/api/transfers', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT t.*, w1.name as from_warehouse_name, w2.name as to_warehouse_name
        FROM transfers t
        LEFT JOIN warehouses w1 ON t.from_warehouse_id = w1.id
        LEFT JOIN warehouses w2 ON t.to_warehouse_id = w2.id
        ORDER BY t.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب التحويلات' });
    }
  });

  app.post('/api/transfers', async (req, res) => {
    const { from_warehouse_id, to_warehouse_id, items, date, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/transfers', err);
    });
    try {
      await client.query('BEGIN');
      const transferId = 'tr' + Date.now();
      await client.query(
        'INSERT INTO transfers (id, from_warehouse_id, to_warehouse_id, date, notes) VALUES ($1, $2, $3, $4, $5)',
        [transferId, from_warehouse_id, to_warehouse_id, date || new Date(), notes]
      );
      for (const item of items) {
        const itemId = 'tri' + Math.random().toString(36).substr(2, 9);
        await client.query(
          'INSERT INTO transfer_items (id, transfer_id, product_id, quantity) VALUES ($1, $2, $3, $4)',
          [itemId, transferId, item.product_id, item.quantity]
        );
        // Log stock movement
        const smId = 'sm' + Date.now() + Math.random().toString(36).substr(2, 5);
        await client.query(
          'INSERT INTO stock_movements (id, product_id, from_warehouse_id, to_warehouse_id, quantity, type, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [smId, item.product_id, from_warehouse_id, to_warehouse_id, item.quantity, 'transfer', 'تحويل مخزني']
        );
      }
      await client.query('COMMIT');
      res.json({ success: true, id: transferId });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'خطأ في إضافة التحويل' });
    } finally {
      client.release();
    }
  });

  app.get('/api/adjustments', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT a.*, w.name as warehouse_name
        FROM adjustments a
        LEFT JOIN warehouses w ON a.warehouse_id = w.id
        ORDER BY a.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب التسويات' });
    }
  });

  app.post('/api/adjustments', async (req, res) => {
    const { warehouse_id, type, reason, items, date, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/adjustments', err);
    });
    try {
      await client.query('BEGIN');
      const adjustmentId = 'adj' + Date.now();
      await client.query(
        'INSERT INTO adjustments (id, warehouse_id, type, reason, date, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [adjustmentId, warehouse_id, type, reason, date || new Date(), notes]
      );
      for (const item of items) {
        const itemId = 'adji' + Math.random().toString(36).substr(2, 9);
        await client.query(
          'INSERT INTO adjustment_items (id, adjustment_id, product_id, quantity) VALUES ($1, $2, $3, $4)',
          [itemId, adjustmentId, item.product_id, item.quantity]
        );
        // Log stock movement and update product quantity
        const smId = 'sm' + Date.now() + Math.random().toString(36).substr(2, 5);
        const qtyChange = type === 'in' ? item.quantity : -item.quantity;
        await client.query(
          'INSERT INTO stock_movements (id, product_id, from_warehouse_id, to_warehouse_id, quantity, type, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [smId, item.product_id, type === 'out' ? warehouse_id : null, type === 'in' ? warehouse_id : null, item.quantity, 'adjustment', reason]
        );
        await client.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [qtyChange, item.product_id]);
      }
      await client.query('COMMIT');
      res.json({ success: true, id: adjustmentId });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'خطأ في إضافة التسوية' });
    } finally {
      client.release();
    }
  });

  app.get('/api/projects', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM projects ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب المشاريع' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    const { name, description, code } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'prj' + Date.now();
      await pool.query('INSERT INTO projects (id, name, description, code) VALUES ($1, $2, $3, $4)', [id, name, description, code]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المشروع' });
    }
  });

  app.get('/api/branches', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM branches ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الفروع' });
    }
  });

  app.post('/api/branches', async (req, res) => {
    const { name, location, code } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'br' + Date.now();
      await pool.query('INSERT INTO branches (id, name, location, code) VALUES ($1, $2, $3, $4)', [id, name, location, code]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة الفرع' });
    }
  });

  app.get('/api/brands', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM brands ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الماركات' });
    }
  });

  app.post('/api/brands', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'brd' + Date.now();
      await pool.query('INSERT INTO brands (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة الماركة' });
    }
  });

  app.get('/api/models', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT m.*, b.name as brand_name 
        FROM models m 
        LEFT JOIN brands b ON m.brand_id = b.id 
        ORDER BY m.name ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الموديلات' });
    }
  });

  app.post('/api/models', async (req, res) => {
    const { name, brand_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'mod' + Date.now();
      await pool.query('INSERT INTO models (id, name, brand_id) VALUES ($1, $2, $3)', [id, name, brand_id]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة الموديل' });
    }
  });

  app.get('/api/product-groups', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM product_groups ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب مجموعات المنتجات' });
    }
  });

  app.post('/api/product-groups', async (req, res) => {
    const { name, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'pg' + Date.now();
      await pool.query('INSERT INTO product_groups (id, name, description) VALUES ($1, $2, $3)', [id, name, description]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة مجموعة المنتجات' });
    }
  });

  app.get('/api/transport-cars', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM transport_cars ORDER BY plate_number ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب السيارات' });
    }
  });

  app.post('/api/transport-cars', async (req, res) => {
    const { plate_number, driver_name } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'tc' + Date.now();
      await pool.query('INSERT INTO transport_cars (id, plate_number, driver_name) VALUES ($1, $2, $3)', [id, plate_number, driver_name]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة السيارة' });
    }
  });

  app.get('/api/transport-drivers', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM transport_drivers ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب السائقين' });
    }
  });

  app.post('/api/transport-drivers', async (req, res) => {
    const { name, phone } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'td' + Date.now();
      await pool.query('INSERT INTO transport_drivers (id, name, phone) VALUES ($1, $2, $3)', [id, name, phone]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة السائق' });
    }
  });

  app.get('/api/suppliers-customers', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM suppliers_customers ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الموردين والعملاء' });
    }
  });

  app.post('/api/suppliers-customers', async (req, res) => {
    const { type, name, phone, email, balance, opening_balance, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'sc' + Date.now();
      await pool.query(
        'INSERT INTO suppliers_customers (id, type, name, phone, email, balance, opening_balance, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, type, name, phone, email, balance || 0, opening_balance || 0, account_id || null]
      );
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المورد/العميل' });
    }
  });

  // Definitions API
  const definitionTables = [
    'product_units', 'product_categories', 'customer_groups', 'supplier_groups',
    'payment_methods', 'tax_types', 'currencies', 'departments'
  ];
  
  definitionTables.forEach(table => {
    app.get(`/api/${table.replace('_', '-')}`, async (req, res) => {
      if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
      try {
        const result = await pool.query(`SELECT * FROM ${table} ORDER BY name ASC`);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: `خطأ في جلب ${table}` });
      }
    });

    app.post(`/api/${table.replace('_', '-')}`, async (req, res) => {
      const { name, description } = req.body;
      if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
      try {
        const id = table.charAt(0) + Date.now();
        await pool.query(`INSERT INTO ${table} (id, name, description) VALUES ($1, $2, $3)`, [id, name, description]);
        res.json({ success: true, id });
      } catch (err) {
        res.status(500).json({ error: `خطأ في إضافة ${table}` });
      }
    });

    app.delete(`/api/${table.replace('_', '-')}/:id`, async (req, res) => {
      const { id } = req.params;
      if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
      try {
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: `خطأ في حذف ${table}` });
      }
    });
  });

  app.post('/api/products', async (req, res) => {
    const { 
      name, sku, category, unit, quantity, cost_price, sale_price, min_stock, warehouse_id, barcode, electronic_invoice_code, code2,
      wholesale_price, half_wholesale_price, last_purchase_price, min_sale_price, avg_purchase_price, market_price, manual_cost,
      profit_percent_retail, profit_percent_wholesale, profit_percent_half_wholesale, profit_percent_min_sale,
      discount_retail, discount_wholesale, discount_half_wholesale, max_stock, tax_percent, is_active, name_en, coding_type,
      is_assembly, is_service, has_expiry, has_serial, stop_sale, stop_purchase, concrete_type, additional_statement,
      group_id, brand_id, model_id, origin, warranty, no_points, no_discount, for_rent, part_numbers, categories, groups, is_taxable
    } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'p' + Date.now();
      await pool.query(
        `INSERT INTO products (
          id, name, sku, category, unit, quantity, cost_price, sale_price, min_stock, warehouse_id, barcode, electronic_invoice_code, code2,
          wholesale_price, half_wholesale_price, last_purchase_price, min_sale_price, avg_purchase_price, market_price, manual_cost,
          profit_percent_retail, profit_percent_wholesale, profit_percent_half_wholesale, profit_percent_min_sale,
          discount_retail, discount_wholesale, discount_half_wholesale, max_stock, tax_percent, is_active, name_en, coding_type,
          is_assembly, is_service, has_expiry, has_serial, stop_sale, stop_purchase, concrete_type, additional_statement,
          group_id, brand_id, model_id, origin, warranty, no_points, no_discount, for_rent, part_numbers, categories, groups, is_taxable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52)`,
        [
          id, name, sku, category, unit, quantity || 0, cost_price || 0, sale_price || 0, min_stock || 0, warehouse_id, barcode, electronic_invoice_code, code2,
          wholesale_price || 0, half_wholesale_price || 0, last_purchase_price || 0, min_sale_price || 0, avg_purchase_price || 0, market_price || 0, manual_cost || 0,
          profit_percent_retail || 0, profit_percent_wholesale || 0, profit_percent_half_wholesale || 0, profit_percent_min_sale || 0,
          discount_retail || 0, discount_wholesale || 0, discount_half_wholesale || 0, max_stock || 0, tax_percent || 0, is_active ?? true, name_en, coding_type,
          is_assembly ?? false, is_service ?? false, has_expiry ?? false, has_serial ?? false, stop_sale ?? false, stop_purchase ?? false, concrete_type, additional_statement,
          group_id, brand_id, model_id, origin, warranty, no_points ?? false, no_discount ?? false, for_rent ?? false, part_numbers || [], categories || [], groups || [], is_taxable ?? true
        ]
      );
      res.json({ success: true, id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'خطأ في إضافة المنتج' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { 
      name, sku, category, unit, quantity, cost_price, sale_price, min_stock, barcode, electronic_invoice_code, code2,
      wholesale_price, half_wholesale_price, last_purchase_price, min_sale_price, avg_purchase_price, market_price, manual_cost,
      profit_percent_retail, profit_percent_wholesale, profit_percent_half_wholesale, profit_percent_min_sale,
      discount_retail, discount_wholesale, discount_half_wholesale, max_stock, tax_percent, is_active, name_en, coding_type,
      is_assembly, is_service, has_expiry, has_serial, stop_sale, stop_purchase, concrete_type, additional_statement,
      group_id, brand_id, model_id, origin, warranty, no_points, no_discount, for_rent, part_numbers, categories, groups, is_taxable
    } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        `UPDATE products SET 
          name = $1, sku = $2, category = $3, unit = $4, quantity = $5, cost_price = $6, sale_price = $7, min_stock = $8, barcode = $9, electronic_invoice_code = $10, code2 = $11,
          wholesale_price = $12, half_wholesale_price = $13, last_purchase_price = $14, min_sale_price = $15, avg_purchase_price = $16, market_price = $17, manual_cost = $18,
          profit_percent_retail = $19, profit_percent_wholesale = $20, profit_percent_half_wholesale = $21, profit_percent_min_sale = $22,
          discount_retail = $23, discount_wholesale = $24, discount_half_wholesale = $25, max_stock = $26, tax_percent = $27, is_active = $28, name_en = $29, coding_type = $30,
          is_assembly = $31, is_service = $32, has_expiry = $33, has_serial = $34, stop_sale = $35, stop_purchase = $36, concrete_type = $37, additional_statement = $38,
          group_id = $39, brand_id = $40, model_id = $41, origin = $42, warranty = $43, no_points = $44, no_discount = $45, for_rent = $46, part_numbers = $47, categories = $48, groups = $49, is_taxable = $50
        WHERE id = $51`,
        [
          name, sku, category, unit, quantity, cost_price, sale_price, min_stock, barcode, electronic_invoice_code, code2,
          wholesale_price, half_wholesale_price, last_purchase_price, min_sale_price, avg_purchase_price, market_price, manual_cost,
          profit_percent_retail, profit_percent_wholesale, profit_percent_half_wholesale, profit_percent_min_sale,
          discount_retail, discount_wholesale, discount_half_wholesale, max_stock, tax_percent, is_active, name_en, coding_type,
          is_assembly, is_service, has_expiry, has_serial, stop_sale, stop_purchase, concrete_type, additional_statement,
          group_id, brand_id, model_id, origin, warranty, no_points, no_discount, for_rent, part_numbers, categories, groups, is_taxable,
          id
        ]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'خطأ في تحديث المنتج' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف المنتج' });
    }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in DELETE /api/transactions/:id', err);
    });
    try {
      await client.query('BEGIN');

      // 1. Fetch transaction and items to reverse effects
      const txRes = await client.query('SELECT * FROM transactions WHERE id = $1', [id]);
      if (txRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transaction not found' });
      }
      const tx = txRes.rows[0];
      const itemsRes = await client.query('SELECT * FROM transaction_items WHERE transaction_id = $1', [id]);
      const items = itemsRes.rows;

      // 2. Reverse stock changes
      for (const item of items) {
        const stockChange = (tx.type === 'purchase' || tx.type === 'sale_return') ? -item.quantity : item.quantity;
        await client.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [stockChange, item.product_id]);
      }

      // 3. Reverse financial record and balances
      const finRes = await client.query('SELECT * FROM financial_records WHERE transaction_id = $1', [id]);
      if (finRes.rows.length > 0) {
        const fin = finRes.rows[0];
        if (fin.account_id) {
          const balanceChange = (fin.type === 'income') ? -fin.amount : fin.amount;
          await client.query('UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, fin.account_id]);
        }
        await client.query('DELETE FROM financial_records WHERE transaction_id = $1', [id]);
      }

      if (tx.party_id) {
        let partyBalanceChange = 0;
        const effectiveAmount = (tx.type === 'sale' || tx.type === 'purchase' || tx.type === 'sale_return' || tx.type === 'purchase_return') ? (tx.total_amount - (tx.paid_amount || 0)) : tx.total_amount;
        
        if (tx.type === 'sale') partyBalanceChange = effectiveAmount;
        else if (tx.type === 'purchase') partyBalanceChange = -effectiveAmount;
        else if (tx.type === 'sale_return') partyBalanceChange = -effectiveAmount;
        else if (tx.type === 'purchase_return') partyBalanceChange = effectiveAmount;
        else if (tx.type === 'sale_payment') partyBalanceChange = -tx.total_amount;
        else if (tx.type === 'purchase_payment') partyBalanceChange = tx.total_amount;
        else if (tx.type === 'settlement') partyBalanceChange = -tx.total_amount;
        
        if (partyBalanceChange !== 0) {
          await client.query('UPDATE suppliers_customers SET balance = balance - $1 WHERE id = $2', [partyBalanceChange, tx.party_id]);
        }
      }

      // 4. Delete journal entries and items
      await client.query('DELETE FROM journal_entries WHERE reference_id = $1', [id]);
      await client.query('DELETE FROM transaction_items WHERE transaction_id = $1', [id]);

      // 5. Delete the transaction itself
      await client.query('DELETE FROM transactions WHERE id = $1', [id]);

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error deleting transaction:', err);
      res.status(500).json({ error: 'خطأ في حذف العملية' });
    } finally {
      client.release();
    }
  });

  app.delete('/api/finance/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM financial_records WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف السجل المالي' });
    }
  });

  app.delete('/api/financial-docs/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM financial_docs WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف المستند المالي' });
    }
  });

  app.delete('/api/coa/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM chart_of_accounts WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف الحساب' });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف المستودع' });
    }
  });

  app.delete('/api/transfers/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM transfers WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف التحويل' });
    }
  });

  app.delete('/api/adjustments/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM adjustments WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف التسوية' });
    }
  });

  app.delete('/api/bank-accounts/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM bank_accounts WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف الحساب البنكي' });
    }
  });

  app.delete('/api/suppliers-customers/:id', async (req, res) => {
    const { id } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM suppliers_customers WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في حذف العميل/المورد' });
    }
  });

  app.put('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { 
      type, party_id, date, total_amount, payment_method, check_number, 
      check_date, status, notes, items, warehouse_id, account_id, document_number,
      discount_percent, paid_amount, due_amount, branch_id, 
      project_id, cost_center_id, sales_rep_id, shipping_co_id, transport_car_id, 
      transport_driver_id, pricing_type, time, invoice_type 
    } = req.body;
    const tax_amount = Number(req.body.total_tax || req.body.tax_amount || 0);
    const totalAmount = (items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
    const discount_amount = Number(req.body.total_discount || 0) + Number(req.body.discount_amount || 0) + (totalAmount * Number(req.body.discount_percent || 0) / 100);
    
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    
    const sanitize = (val: any) => (val === '' ? null : val);
    
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in PUT /api/transactions/:id', err);
    });
    try {
      await client.query('BEGIN');

      // 1. Fetch old transaction and items to reverse effects
      const oldTxRes = await client.query('SELECT * FROM transactions WHERE id = $1', [id]);
      if (oldTxRes.rows.length === 0) throw new Error('Transaction not found');
      const oldTx = oldTxRes.rows[0];
      const oldItemsRes = await client.query('SELECT * FROM transaction_items WHERE transaction_id = $1', [id]);
      const oldItems = oldItemsRes.rows;

      // 2. Reverse stock changes
      for (const item of oldItems) {
        const stockChange = (oldTx.type === 'purchase' || oldTx.type === 'sale_return') ? -item.quantity : item.quantity;
        await client.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [stockChange, item.product_id]);
      }

      // 3. Reverse financial record and balances
      const oldFinRes = await client.query('SELECT * FROM financial_records WHERE transaction_id = $1', [id]);
      if (oldFinRes.rows.length > 0) {
        const oldFin = oldFinRes.rows[0];
        if (oldFin.account_id) {
          const balanceChange = (oldFin.type === 'income') ? -oldFin.amount : oldFin.amount;
          await client.query('UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, oldFin.account_id]);
        }
        if (oldTx.party_id) {
          let oldPartyBalanceChange = 0;
          const oldEffectiveAmount = (oldTx.type === 'sale' || oldTx.type === 'purchase' || oldTx.type === 'sale_return' || oldTx.type === 'purchase_return') ? (oldTx.total_amount - (oldTx.paid_amount || 0)) : oldTx.total_amount;
          
          if (oldTx.type === 'sale') oldPartyBalanceChange = oldEffectiveAmount;
          else if (oldTx.type === 'purchase') oldPartyBalanceChange = -oldEffectiveAmount;
          else if (oldTx.type === 'sale_return') oldPartyBalanceChange = -oldEffectiveAmount;
          else if (oldTx.type === 'purchase_return') oldPartyBalanceChange = oldEffectiveAmount;
          else if (oldTx.type === 'sale_payment') oldPartyBalanceChange = -oldTx.total_amount;
          else if (oldTx.type === 'purchase_payment') oldPartyBalanceChange = oldTx.total_amount;
          else if (oldTx.type === 'settlement') oldPartyBalanceChange = -oldTx.total_amount;
          
          if (oldPartyBalanceChange !== 0) {
            await client.query('UPDATE suppliers_customers SET balance = balance - $1 WHERE id = $2', [oldPartyBalanceChange, oldTx.party_id]);
          }
        }
        await client.query('DELETE FROM financial_records WHERE transaction_id = $1', [id]);
      }

      // 4. Delete old journal entries and items
      await client.query('DELETE FROM journal_entries WHERE reference_id = $1', [id]);
      await client.query('DELETE FROM transaction_items WHERE transaction_id = $1', [id]);

      // 5. Calculate new totals
      let calcTotalAmount = 0;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          calcTotalAmount += (item.quantity || 0) * (item.unit_price || 0);
        }
      }
      const finalTotal = calcTotalAmount + (tax_amount || 0) - (discount_amount || 0);
      const actualTotal = (type === 'sale_payment' || type === 'purchase_payment' || type === 'settlement' || type === 'check') ? (req.body.amount || 0) : finalTotal;

      // If cash invoice, ensure paid_amount is set to total if not provided
      let finalPaidAmount = paid_amount || 0;
      if (invoice_type === 'cash' && ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) {
        if (finalPaidAmount === 0) finalPaidAmount = actualTotal;
      }
      const finalDueAmount = (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) ? (actualTotal - finalPaidAmount) : 0;

      // 6. Update transaction
      await client.query(
        `UPDATE transactions SET 
          type = $1, party_id = $2, date = $3, total_amount = $4, tax_amount = $5, 
          payment_method = $6, check_number = $7, check_date = $8, status = $9, 
          notes = $10, warehouse_id = $11, account_id = $12, document_number = $13,
          discount_amount = $14, discount_percent = $15, paid_amount = $16, 
          due_amount = $17, branch_id = $18, project_id = $19, cost_center_id = $20, 
          sales_rep_id = $21, shipping_co_id = $22, transport_car_id = $23, 
          transport_driver_id = $24, pricing_type = $25, time = $26, invoice_type = $27
        WHERE id = $28`,
        [
          type, sanitize(party_id), date, actualTotal, tax_amount || 0, payment_method, 
          check_number, check_date, status, notes, sanitize(warehouse_id), 
          sanitize(account_id), document_number, discount_amount || 0, discount_percent || 0, 
          finalPaidAmount, finalDueAmount, sanitize(branch_id), sanitize(project_id), 
          sanitize(cost_center_id), sanitize(sales_rep_id), sanitize(shipping_co_id), 
          sanitize(transport_car_id), sanitize(transport_driver_id), pricing_type, time, invoice_type || 'cash', id
        ]
      );

      // 7. Insert new items and apply new stock changes
      if (items && Array.isArray(items) && ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) {
        for (const item of items) {
          const itemId = 'ti' + Math.random().toString(36).substr(2, 9);
          await client.query(
            `INSERT INTO transaction_items (
              id, transaction_id, product_id, quantity, unit, unit_price, total,
              tax_percent, tax_amount, net_amount, discount_amount, discount_percent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              itemId, id, item.product_id, item.quantity, item.unit || 'قطعة', item.unit_price, 
              item.quantity * item.unit_price, item.tax_percent || 0, item.tax_amount || 0, 
              item.net_amount || 0, item.discount_amount || 0, item.discount_percent || 0
            ]
          );

          const stockChange = (type === 'purchase' || type === 'sale_return') ? item.quantity : -item.quantity;
          if (type === 'purchase' && warehouse_id) {
            await client.query('UPDATE products SET quantity = quantity + $1, warehouse_id = $2 WHERE id = $3', [stockChange, warehouse_id, item.product_id]);
          } else {
            await client.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [stockChange, item.product_id]);
          }
        }
      }

      // 8. Create new Journal Entry
      const settingsRes = await client.query('SELECT key, value FROM system_settings');
      const settings: Record<string, string> = {};
      settingsRes.rows.forEach(row => settings[row.key] = row.value);

      const salesAcc = settings.sales_account_id || 'acc9';
      const purchasesAcc = settings.purchases_account_id || 'acc10';
      const inputVatAcc = settings.input_vat_account_id || 'acc13';
      const outputVatAcc = settings.output_vat_account_id || 'acc12';
      const discountAllowedAcc = settings.discount_allowed_account_id || 'acc14';
      const discountEarnedAcc = settings.discount_earned_account_id || 'acc15';

      let partyAcc = null;
      if (party_id) {
        const partyRes = await client.query('SELECT account_id FROM suppliers_customers WHERE id = $1', [party_id]);
        if (partyRes.rows.length > 0) partyAcc = partyRes.rows[0].account_id;
      }
      if (!partyAcc) {
        partyAcc = (type === 'sale' || type === 'sale_return' || type === 'sale_payment') ? 'acc5' : 'acc7';
      }

      let bankAcc = null;
      if (account_id) {
        const bankRes = await client.query('SELECT account_id FROM bank_accounts WHERE id = $1', [account_id]);
        if (bankRes.rows.length > 0) bankAcc = bankRes.rows[0].account_id;
      }
      if (!bankAcc) {
        bankAcc = (type === 'sale' || type === 'sale_return' || type === 'sale_payment') ? 'acc3' : 'acc4';
      }

      const journalId = 'j' + Date.now();
      await client.query(
        'INSERT INTO journal_entries (id, date, description, reference_id) VALUES ($1, $2, $3, $4)',
        [journalId, date || new Date(), `تعديل عملية ${type} رقم ${document_number || id}`, id]
      );

      if (type === 'purchase') {
        const debitAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, purchasesAcc, calcTotalAmount, 0]);
        if (tax_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1v'+journalId, journalId, inputVatAcc, tax_amount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, debitAcc, 0, actualTotal]);
        if (discount_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2d'+journalId, journalId, discountEarnedAcc, 0, discount_amount]);
        }
      } else if (type === 'sale') {
        const debitAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, debitAcc, actualTotal, 0]);
        if (discount_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1d'+journalId, journalId, discountAllowedAcc, discount_amount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, salesAcc, 0, calcTotalAmount]);
        if (tax_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2v'+journalId, journalId, outputVatAcc, 0, tax_amount]);
        }
      } else if (type === 'sale_return') {
        const creditAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, salesAcc, calcTotalAmount, 0]);
        if (tax_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1v'+journalId, journalId, outputVatAcc, tax_amount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, creditAcc, 0, actualTotal]);
        if (discount_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2d'+journalId, journalId, discountAllowedAcc, 0, discount_amount]);
        }
      } else if (type === 'purchase_return') {
        const debitAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, debitAcc, actualTotal, 0]);
        if (discount_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1d'+journalId, journalId, discountEarnedAcc, discount_amount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, purchasesAcc, 0, calcTotalAmount]);
        if (tax_amount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2v'+journalId, journalId, inputVatAcc, 0, tax_amount]);
        }
      } else if (type === 'sale_payment') {
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, bankAcc, actualTotal, 0]);
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, partyAcc, 0, actualTotal]);
      } else if (type === 'purchase_payment') {
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, partyAcc, actualTotal, 0]);
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, bankAcc, 0, actualTotal]);
      }

      // 9. Create new financial record
      const financialId = 'f' + Date.now();
      const financialType = (type === 'sale' || type === 'purchase_return' || type === 'sale_payment') ? 'income' : 'expense';
      const financialAmount = (type === 'sale' || type === 'purchase' || type === 'sale_return' || type === 'purchase_return') ? (paid_amount || 0) : actualTotal;
      
      if (financialAmount > 0) {
        await client.query(
          'INSERT INTO financial_records (id, type, method, amount, date, description, transaction_id, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [financialId, financialType, payment_method, financialAmount, date || new Date(), `تعديل عملية ${type} رقم ${document_number || id}`, id, sanitize(account_id)]
        );

        // 10. Update balances
        if (account_id && account_id !== '') {
          const balanceChange = (financialType === 'income') ? financialAmount : -financialAmount;
          await client.query('UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, account_id]);
        }
      }
      
      if (party_id && party_id !== '') {
        let partyBalanceChange = 0;
        const effectiveAmount = (type === 'sale' || type === 'purchase' || type === 'sale_return' || type === 'purchase_return') ? (actualTotal - (paid_amount || 0)) : actualTotal;
        
        if (type === 'sale') partyBalanceChange = effectiveAmount;
        else if (type === 'purchase') partyBalanceChange = -effectiveAmount;
        else if (type === 'sale_return') partyBalanceChange = -effectiveAmount;
        else if (type === 'purchase_return') partyBalanceChange = effectiveAmount;
        else if (type === 'sale_payment') partyBalanceChange = -actualTotal;
        else if (type === 'purchase_payment') partyBalanceChange = actualTotal;
        else if (type === 'settlement') partyBalanceChange = -actualTotal;
        
        if (partyBalanceChange !== 0) {
          await client.query('UPDATE suppliers_customers SET balance = balance + $1 WHERE id = $2', [partyBalanceChange, party_id]);
        }
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating transaction:', err);
      res.status(500).json({ error: 'خطأ في تحديث العملية: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      client.release();
    }
  });

  app.put('/api/financial-docs/:id', async (req, res) => {
    const { id } = req.params;
    const { type, number, date, party_id, account_id, amount, currency_id, due_date, status, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE financial_docs SET type = $1, number = $2, date = $3, party_id = $4, account_id = $5, amount = $6, currency_id = $7, due_date = $8, status = $9, notes = $10 WHERE id = $11',
        [type, number, date, party_id, account_id, amount, currency_id, due_date, status, notes, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating financial doc:', err);
      res.status(500).json({ error: 'خطأ في تحديث المستند المالي' });
    }
  });

  app.put('/api/coa/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, type, parent_id, description } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const finalParentId = parent_id === '' ? null : parent_id;
      await pool.query(
        'UPDATE chart_of_accounts SET name = $1, code = $2, type = $3, parent_id = $4, description = $5 WHERE id = $6',
        [name, code, type, finalParentId, description, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating coa:', err);
      res.status(500).json({ error: 'خطأ في تحديث الحساب' });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    const { id } = req.params;
    const { name, location, is_default } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      if (is_default) {
        await pool.query('UPDATE warehouses SET is_default = FALSE');
      }
      await pool.query(
        'UPDATE warehouses SET name = $1, location = $2, is_default = $3 WHERE id = $4',
        [name, location, is_default, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating warehouse:', err);
      res.status(500).json({ error: 'خطأ في تحديث المستودع' });
    }
  });

  app.put('/api/transfers/:id', async (req, res) => {
    const { id } = req.params;
    const { date, from_warehouse_id, to_warehouse_id, product_id, quantity, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE transfers SET date = $1, from_warehouse_id = $2, to_warehouse_id = $3, product_id = $4, quantity = $5, notes = $6 WHERE id = $7',
        [date, from_warehouse_id, to_warehouse_id, product_id, quantity, notes, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating transfer:', err);
      res.status(500).json({ error: 'خطأ في تحديث التحويل' });
    }
  });

  app.put('/api/adjustments/:id', async (req, res) => {
    const { id } = req.params;
    const { date, warehouse_id, product_id, type, quantity, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE adjustments SET date = $1, warehouse_id = $2, product_id = $3, type = $4, quantity = $5, notes = $6 WHERE id = $7',
        [date, warehouse_id, product_id, type, quantity, notes, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating adjustment:', err);
      res.status(500).json({ error: 'خطأ في تحديث التسوية' });
    }
  });

  app.put('/api/bank-accounts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, balance, initial_balance, currency_id, account_number, bank_name, branch_name, is_active, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE bank_accounts SET name = $1, type = $2, balance = $3, initial_balance = $4, currency_id = $5, account_number = $6, bank_name = $7, branch_name = $8, is_active = $9, account_id = $10 WHERE id = $11',
        [name, type, balance, initial_balance, currency_id, account_number, bank_name, branch_name, is_active, account_id || null, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating bank account:', err);
      res.status(500).json({ error: 'خطأ في تحديث الحساب البنكي' });
    }
  });

  app.put('/api/suppliers-customers/:id', async (req, res) => {
    const { id } = req.params;
    const { type, name, phone, email, balance, opening_balance, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE suppliers_customers SET type = $1, name = $2, phone = $3, email = $4, balance = $5, opening_balance = $6, account_id = $7 WHERE id = $8',
        [type, name, phone, email, balance, opening_balance || 0, account_id || null, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating supplier/customer:', err);
      res.status(500).json({ error: 'خطأ في تحديث العميل/المورد' });
    }
  });

  app.put('/api/finance/:id', async (req, res) => {
    const { id } = req.params;
    const { type, method, amount, date, description, category_id, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query(
        'UPDATE financial_records SET type = $1, method = $2, amount = $3, date = $4, description = $5, category_id = $6, account_id = $7 WHERE id = $8',
        [type, method, amount, date, description, category_id, account_id, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating finance:', err);
      res.status(500).json({ error: 'خطأ في تحديث السجل المالي' });
    }
  });

  app.get('/api/transactions/next-number/:type', async (req, res) => {
    const { type } = req.params;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(
        "SELECT MAX(CAST(document_number AS INTEGER)) as max_num FROM transactions WHERE type = $1 AND document_number ~ '^[0-9]+$'",
        [type]
      );
      const nextNum = (parseInt(result.rows[0].max_num) || 0) + 1;
      res.json({ next_number: nextNum.toString() });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب رقم المستند التالي' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    const { 
      type, party_id, date, items, payment_method, notes, warehouse_id, account_id, time,
      total_tax, document_number, total_discount, discount_percent, paid_amount, 
      due_amount, branch_id, project_id, cost_center_id, sales_rep_id, shipping_co_id, 
      transport_car_id, transport_driver_id, pricing_type, invoice_type 
    } = req.body;
    const tax_amount = Number(total_tax || req.body.tax_amount || 0);
    const baseAmount = (items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
    const discount_amount = Number(total_discount || 0) + Number(req.body.discount_amount || 0) + (baseAmount * Number(req.body.discount_percent || 0) / 100);
    
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    
    const sanitize = (val: any) => (val === '' ? null : val);
    
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/transactions', err);
    });
    try {
      await client.query('BEGIN');
      
      const transactionId = 't' + Date.now();
      let totalAmount = 0;
      
      // Calculate total and validate items
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }
      
      const finalTotal = totalAmount + (tax_amount || 0) - (discount_amount || 0);
      const actualTotal = (type === 'sale_payment' || type === 'purchase_payment' || type === 'settlement' || type === 'check') ? (req.body.amount || 0) : finalTotal;
      
      // If cash invoice, ensure paid_amount is set to total if not provided
      let finalPaidAmount = paid_amount || 0;
      if (invoice_type === 'cash' && ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) {
        if (finalPaidAmount === 0) finalPaidAmount = actualTotal;
      }
      const finalDueAmount = (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) ? (actualTotal - finalPaidAmount) : 0;

      // Insert transaction
      await client.query(
        `INSERT INTO transactions (
          id, type, party_id, date, total_amount, tax_amount, payment_method, status, notes, 
          document_number, discount_amount, discount_percent, paid_amount, due_amount, 
          branch_id, project_id, cost_center_id, sales_rep_id, shipping_co_id, 
          transport_car_id, transport_driver_id, pricing_type, warehouse_id, account_id, time, invoice_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [
          transactionId, type, sanitize(party_id), date || new Date(), actualTotal, tax_amount || 0, 
          payment_method, 'completed', notes, document_number, discount_amount || 0, 
          discount_percent || 0, finalPaidAmount, finalDueAmount, sanitize(branch_id), 
          sanitize(project_id), sanitize(cost_center_id), sanitize(sales_rep_id), 
          sanitize(shipping_co_id), sanitize(transport_car_id), 
          sanitize(transport_driver_id), pricing_type || 'retail', sanitize(warehouse_id), sanitize(account_id), time, invoice_type || 'cash'
        ]
      );
      
      // Insert items and update stock (only for invoice types)
      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) {
        for (const item of items) {
          const itemId = 'ti' + Math.random().toString(36).substr(2, 9);
          await client.query(
            `INSERT INTO transaction_items (
              id, transaction_id, product_id, quantity, unit, unit_price, total, 
              tax_percent, tax_amount, net_amount, discount_amount, discount_percent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              itemId, transactionId, item.product_id, item.quantity, item.unit || 'قطعة', item.unit_price, 
              item.quantity * item.unit_price, item.tax_percent || 0, item.tax_amount || 0, 
              item.net_amount || 0, item.discount_amount || 0, item.discount_percent || 0
            ]
          );
          
          // Update stock: increase for purchase/sale_return, decrease for sale/purchase_return
          const stockChange = (type === 'purchase' || type === 'sale_return') ? item.quantity : -item.quantity;
          
          if (type === 'purchase' && warehouse_id) {
            await client.query(
              'UPDATE products SET quantity = quantity + $1, warehouse_id = $2 WHERE id = $3',
              [stockChange, warehouse_id, item.product_id]
            );
          } else {
            await client.query(
              'UPDATE products SET quantity = quantity + $1 WHERE id = $2',
              [stockChange, item.product_id]
            );
          }
        }
      }
      
      // Fetch system settings for default accounts
      const settingsRes = await client.query('SELECT key, value FROM system_settings');
      const settings: Record<string, string> = {};
      settingsRes.rows.forEach(row => settings[row.key] = row.value);

      const salesAcc = settings.sales_account_id || 'acc9';
      const purchasesAcc = settings.purchases_account_id || 'acc10';
      const inputVatAcc = settings.input_vat_account_id || 'acc13';
      const outputVatAcc = settings.output_vat_account_id || 'acc12';
      const discountAllowedAcc = settings.discount_allowed_account_id || 'acc14';
      const discountEarnedAcc = settings.discount_earned_account_id || 'acc15';

      // Fetch party account
      let partyAcc = null;
      if (party_id) {
        const partyRes = await client.query('SELECT account_id FROM suppliers_customers WHERE id = $1', [party_id]);
        if (partyRes.rows.length > 0) partyAcc = partyRes.rows[0].account_id;
      }
      if (!partyAcc) {
        partyAcc = (type === 'sale' || type === 'sale_return' || type === 'sale_payment') ? 'acc5' : 'acc7';
      }

      // Fetch bank/cash account
      let bankAcc = null;
      if (account_id) {
        const bankRes = await client.query('SELECT account_id FROM bank_accounts WHERE id = $1', [account_id]);
        if (bankRes.rows.length > 0) bankAcc = bankRes.rows[0].account_id;
      }
      if (!bankAcc) {
        bankAcc = payment_method === 'cash' ? 'acc3' : 'acc4';
      }

      // Journal Entry logic
      const journalId = 'j' + Date.now();
      await client.query(
        'INSERT INTO journal_entries (id, date, description, reference_id) VALUES ($1, $2, $3, $4)',
        [journalId, date || new Date(), `${type === 'sale' ? 'فاتورة مبيعات' : type === 'purchase' ? 'فاتورة مشتريات' : type === 'sale_return' ? 'مرتجع مبيعات' : type === 'purchase_return' ? 'مرتجع مشتريات' : 'عملية'} رقم ${document_number || transactionId}`, transactionId]
      );

      const taxAmount = Number(tax_amount || 0);
      const discountAmount = Number(discount_amount || 0);

      if (type === 'purchase') {
        // Dr Purchases, Dr Input VAT, Cr Supplier/Bank, Cr Discount Earned
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, purchasesAcc, totalAmount, 0]);
        if (taxAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1v'+journalId, journalId, inputVatAcc, taxAmount, 0]);
        }
        const creditAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, creditAcc, 0, actualTotal]);
        if (discountAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2d'+journalId, journalId, discountEarnedAcc, 0, discountAmount]);
        }
      } else if (type === 'sale') {
        // Dr Customer/Bank, Dr Discount Allowed, Cr Sales, Cr Output VAT
        const debitAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, debitAcc, actualTotal, 0]);
        if (discountAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1d'+journalId, journalId, discountAllowedAcc, discountAmount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, salesAcc, 0, totalAmount]);
        if (taxAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2v'+journalId, journalId, outputVatAcc, 0, taxAmount]);
        }
      } else if (type === 'sale_return') {
        const creditAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, salesAcc, totalAmount, 0]);
        if (taxAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1v'+journalId, journalId, outputVatAcc, taxAmount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, creditAcc, 0, actualTotal]);
        if (discountAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2d'+journalId, journalId, discountAllowedAcc, 0, discountAmount]);
        }
      } else if (type === 'purchase_return') {
        const debitAcc = (invoice_type === 'cash') ? bankAcc : partyAcc;
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, debitAcc, actualTotal, 0]);
        if (discountAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1d'+journalId, journalId, discountEarnedAcc, discountAmount, 0]);
        }
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, purchasesAcc, 0, totalAmount]);
        if (taxAmount > 0) {
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2v'+journalId, journalId, inputVatAcc, 0, taxAmount]);
        }
      } else if (type === 'sale_payment') {
        // Dr Cash/Bank, Cr Customers
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, bankAcc, actualTotal, 0]);
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, partyAcc, 0, actualTotal]);
      } else if (type === 'purchase_payment') {
        // Dr Suppliers, Cr Cash/Bank
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, partyAcc, actualTotal, 0]);
        await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, bankAcc, 0, actualTotal]);
      }

      // Create financial record
      const financialId = 'f' + Date.now();
      const financialType = (type === 'sale' || type === 'purchase_return' || type === 'sale_payment') ? 'income' : 'expense';
      const financialAmount = (type === 'sale' || type === 'purchase' || type === 'sale_return' || type === 'purchase_return') ? (finalPaidAmount || 0) : actualTotal;
      
      if (financialAmount > 0) {
        await client.query(
          'INSERT INTO financial_records (id, type, method, amount, date, description, transaction_id, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [financialId, financialType, payment_method, financialAmount, date || new Date(), `عملية ${type} رقم ${document_number || transactionId}`, transactionId, sanitize(account_id)]
        );

        // Update bank account balance if account_id is provided
        if (account_id && account_id !== '') {
          const balanceChange = (financialType === 'income') ? financialAmount : -financialAmount;
          await client.query(
            'UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2',
            [balanceChange, account_id]
          );
        }
      }
      
      // Update party balance
      if (party_id && party_id !== '') {
        let partyBalanceChange = 0;
        const effectiveAmount = (type === 'sale' || type === 'purchase' || type === 'sale_return' || type === 'purchase_return') ? (actualTotal - (finalPaidAmount || 0)) : actualTotal;
        
        if (type === 'sale') partyBalanceChange = effectiveAmount;
        else if (type === 'purchase') partyBalanceChange = -effectiveAmount;
        else if (type === 'sale_return') partyBalanceChange = -effectiveAmount;
        else if (type === 'purchase_return') partyBalanceChange = effectiveAmount;
        else if (type === 'sale_payment') partyBalanceChange = -actualTotal;
        else if (type === 'purchase_payment') partyBalanceChange = actualTotal;
        else if (type === 'settlement') partyBalanceChange = -actualTotal;
        
        if (partyBalanceChange !== 0) {
          await client.query(
            'UPDATE suppliers_customers SET balance = balance + $1 WHERE id = $2',
            [partyBalanceChange, party_id]
          );
        }
      }
      
      await client.query('COMMIT');
      res.json({ success: true, id: transactionId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', err);
      res.status(500).json({ error: 'خطأ في إتمام العملية' });
    } finally {
      client.release();
    }
  });

  app.get('/api/chart-of-accounts', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM chart_of_accounts ORDER BY code ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب شجرة الحسابات' });
    }
  });

  app.get('/api/quotes', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT q.*, sc.name as party_name 
        FROM quotes q 
        LEFT JOIN suppliers_customers sc ON q.party_id = sc.id 
        ORDER BY q.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب عروض الأسعار' });
    }
  });

  app.post('/api/quotes', async (req, res) => {
    const { party_id, date, items, notes } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/quotes', err);
    });
    try {
      await client.query('BEGIN');
      const quoteId = 'q' + Date.now();
      const quoteNumber = 'QT-' + Date.now().toString().slice(-6);
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }
      await client.query(
        'INSERT INTO quotes (id, quote_number, party_id, date, total_amount, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [quoteId, quoteNumber, party_id, date || new Date(), totalAmount, 'pending', notes]
      );
      for (const item of items) {
        const itemId = 'qi' + Math.random().toString(36).substr(2, 9);
        await client.query(
          'INSERT INTO quote_items (id, quote_id, product_id, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)',
          [itemId, quoteId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true, id: quoteId });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'خطأ في إضافة عرض السعر' });
    } finally {
      client.release();
    }
  });

  app.get('/api/warehouses', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM warehouses ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب المخازن' });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    const { name, location, is_default } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const id = 'w' + Date.now();
      await pool.query('INSERT INTO warehouses (id, name, location, is_default) VALUES ($1, $2, $3, $4)', [id, name, location, is_default]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في إضافة المخزن' });
    }
  });

  app.get('/api/expense-categories', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM expense_categories ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب تصنيفات المصاريف' });
    }
  });

  app.post('/api/bank-accounts', async (req, res) => {
    const { name, type, initial_balance, currency_id, account_number, bank_name, branch_name, is_active, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const sanitize = (val: any) => (val === '' ? null : val);
    try {
      const id = 'ba' + Date.now();
      await pool.query(
        'INSERT INTO bank_accounts (id, name, type, balance, initial_balance, currency_id, account_number, bank_name, branch_name, is_active, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [id, name, type || 'cash', initial_balance || 0, initial_balance || 0, sanitize(currency_id), account_number, bank_name, branch_name, is_active !== false, account_id || null]
      );
      res.json({ success: true, id });
    } catch (err) {
      console.error('Error adding bank account:', err);
      res.status(500).json({ error: 'خطأ في إضافة الحساب البنكي' });
    }
  });

  app.get('/api/bank-accounts', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query('SELECT * FROM bank_accounts ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الحسابات البنكية' });
    }
  });

  app.get('/api/stock-movements', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT sm.*, p.name as product_name, w1.name as from_warehouse_name, w2.name as to_warehouse_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses w1 ON sm.from_warehouse_id = w1.id
        LEFT JOIN warehouses w2 ON sm.to_warehouse_id = w2.id
        ORDER BY sm.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب حركات المخزون' });
    }
  });

  app.post('/api/stock-movements', async (req, res) => {
    const { product_id, from_warehouse_id, to_warehouse_id, quantity, type, reason } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/stock-movements', err);
    });
    try {
      await client.query('BEGIN');
      const id = 'sm' + Date.now();
      await client.query(
        'INSERT INTO stock_movements (id, product_id, from_warehouse_id, to_warehouse_id, quantity, type, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, product_id, from_warehouse_id, to_warehouse_id, quantity, type, reason]
      );

      if (type === 'transfer') {
        // No change in total quantity, just location (if we tracked quantity per warehouse in a separate table)
        // For now, our schema has quantity in products table.
        // If we want to support multiple warehouses properly, we'd need a product_warehouses table.
        // Let's assume for now it's just a log, or we update the product's warehouse_id if it's a full transfer.
        if (to_warehouse_id) {
          await client.query('UPDATE products SET warehouse_id = $1 WHERE id = $2', [to_warehouse_id, product_id]);
        }
      } else if (type === 'adjustment') {
        await client.query('UPDATE products SET quantity = quantity + $1 WHERE id = $2', [quantity, product_id]);
      }

      await client.query('COMMIT');
      res.json({ success: true, id });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'خطأ في تسجيل حركة المخزون' });
    } finally {
      client.release();
    }
  });

  app.get('/api/journal-entries', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT je.*, 
          (SELECT json_agg(jel.*) FROM journal_entry_lines jel WHERE jel.journal_entry_id = je.id) as lines
        FROM journal_entries je
        ORDER BY je.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      res.status(500).json({ error: 'خطأ في جلب قيود اليومية' });
    }
  });

  app.post('/api/journal-entries', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    const client = await pool.connect();
    try {
      const { date, description, lines } = req.body;
      await client.query('BEGIN');
      const id = 'je' + Date.now();
      await client.query(
        'INSERT INTO journal_entries (id, date, description) VALUES ($1, $2, $3)',
        [id, date || new Date(), description]
      );

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(
          'INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)',
          [`${id}-${i}`, id, line.account_id, line.debit || 0, line.credit || 0]
        );
      }

      await client.query('COMMIT');
      res.json({ id });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating journal entry:', err);
      res.status(500).json({ error: 'خطأ في إنشاء قيد اليومية' });
    } finally {
      client.release();
    }
  });

  app.delete('/api/journal-entries/:id', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      await pool.query('DELETE FROM journal_entries WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      res.status(500).json({ error: 'خطأ في حذف قيد اليومية' });
    }
  });

  app.get('/api/journal-entry-lines', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      const result = await pool.query(`
        SELECT jel.*, je.date, je.description, je.reference_id, coa.name as account_name
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        JOIN chart_of_accounts coa ON jel.account_id = coa.id
        ORDER BY je.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching journal entry lines:', err);
      res.status(500).json({ error: 'خطأ في جلب سطور قيود اليومية' });
    }
  });

  app.get('/api/reports/profit-loss', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    try {
      // Get monthly income and expenses for the last 6 months
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - interval '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          ) AS month_start
        )
        SELECT 
          to_char(m.month_start, 'Mon') as month,
          COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.amount ELSE 0 END), 0) as total_expense,
          COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE -f.amount END), 0) as net_profit
        FROM months m
        LEFT JOIN financial_records f ON date_trunc('month', f.date) = m.month_start
        GROUP BY m.month_start
        ORDER BY m.month_start ASC
      `);
      
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching P&L report:', err);
      res.status(500).json({ error: 'خطأ في جلب تقرير الأرباح والخسائر' });
    }
  });

  app.get('/api/products', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'DATABASE_URL is missing.' });
    try {
      const result = await pool.query(`
        SELECT p.*, w.name as warehouse_name 
        FROM products p 
        LEFT JOIN warehouses w ON p.warehouse_id = w.id 
        ORDER BY p.name ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'خطأ في جلب المنتجات' });
    }
  });

  app.get('/api/transactions', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'DATABASE_URL is missing.' });
    try {
      const result = await pool.query(`
        SELECT t.*, sc.name as party_name,
          (SELECT json_agg(ti.*) FROM transaction_items ti WHERE ti.transaction_id = t.id) as items
        FROM transactions t 
        LEFT JOIN suppliers_customers sc ON t.party_id = sc.id 
        ORDER BY t.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      res.status(500).json({ error: 'خطأ في جلب العمليات' });
    }
  });

  app.get('/api/finance', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'DATABASE_URL is missing.' });
    try {
      const result = await pool.query(`
        SELECT f.*, ec.name as category_name, ba.name as account_name
        FROM financial_records f
        LEFT JOIN expense_categories ec ON f.category_id = ec.id
        LEFT JOIN bank_accounts ba ON f.account_id = ba.id
        ORDER BY f.date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching finance:', err);
      res.status(500).json({ error: 'خطأ في جلب السجلات المالية' });
    }
  });

  app.post('/api/finance', async (req, res) => {
    const { type, method, amount, date, description, category_id, account_id } = req.body;
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'Database not connected' });
    
    const sanitize = (val: any) => (val === '' ? null : val);
    const client = await pool.connect();
    client.on('error', (err) => {
      console.error('Unexpected error on checked out client in POST /api/financial-records', err);
    });
    try {
      await client.query('BEGIN');
      const id = 'f' + Date.now();
      await client.query(
        'INSERT INTO financial_records (id, type, method, amount, date, description, category_id, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, type, method, amount, date || new Date(), description, sanitize(category_id), sanitize(account_id)]
      );

      // Create Journal Entry for the financial record
      const journalId = 'j' + Date.now();
      await client.query(
        'INSERT INTO journal_entries (id, date, description, reference_id) VALUES ($1, $2, $3, $4)',
        [journalId, date || new Date(), `${type === 'income' ? 'سند قبض/دخل' : 'سند صرف/مصروف'}: ${description}`, id]
      );

      if (account_id) {
        const balanceChange = (type === 'income') ? amount : -amount;
        await client.query(
          'UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2',
          [balanceChange, account_id]
        );

        // Journal lines for the bank/cash account
        if (type === 'income') {
          // Dr Bank/Cash, Cr Income/Category
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, account_id, amount, 0]);
          // For income, we might not have a specific account, but we can use a default income account or the category if it has an account
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, 'acc11', 0, amount]); // acc11 is Sales/Income
        } else {
          // Dr Expense/Category, Cr Bank/Cash
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl1'+journalId, journalId, 'acc12', amount, 0]); // acc12 is Expenses
          await client.query('INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, $5)', ['jl2'+journalId, journalId, account_id, 0, amount]);
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, id });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'خطأ في إضافة السجل المالي' });
    } finally {
      client.release();
    }
  });

  app.get('/api/stats', async (req, res) => {
    if (!currentDatabaseUrl) return res.status(500).json({ error: 'DATABASE_URL is missing.' });
    try {
      const sales = await pool.query("SELECT SUM(total_amount) as total FROM transactions WHERE type = 'sale'");
      const purchases = await pool.query("SELECT SUM(total_amount) as total FROM transactions WHERE type = 'purchase'");
      const inventory = await pool.query("SELECT SUM(quantity * cost_price) as total FROM products");
      const cash = await pool.query("SELECT SUM(balance) as total FROM bank_accounts");
      
      res.json({
        totalSales: parseFloat(sales.rows[0].total || 0),
        totalPurchases: parseFloat(purchases.rows[0].total || 0),
        inventoryValue: parseFloat(inventory.rows[0].total || 0),
        cashBalance: parseFloat(cash.rows[0].total || 0)
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
    }
  });

  // Vite middleware for development or fallback to static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite development middleware loaded successfully.');
    } catch (e) {
      console.warn('Vite package not available, falling back to static production serving:', e);
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function serveStatic(app: any) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

startServer();
