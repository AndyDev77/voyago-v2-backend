import * as dns from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';

// Fix Atlas SRV DNS resolution on Windows / Node.js
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server override warning:', e);
}

// Simple .env parser to avoid extra runtime dependency
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

import { User, UserSchema } from '../src/auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../src/auth/schemas/user-session.schema';
import { PasswordReset, PasswordResetSchema } from '../src/auth/schemas/password-reset.schema';
import { Trip, TripSchema } from '../src/trips/schemas/trip.schema';
import { Profile, ProfileSchema } from '../src/gamification/schemas/profile.schema';
import { PaymentTransaction, PaymentTransactionSchema } from '../src/pro/schemas/payment-transaction.schema';

async function syncGlobalDatabase(uri: string) {
  console.log(`\n======================================================`);
  console.log(`🌐 Synchronisation de la BASE GLOBALE (voyago_global)...`);
  console.log(`======================================================`);

  const connection = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  console.log(`✅ Connecté à la base globale: ${connection.name}`);

  // Modèles strictement Globaux
  const globalModels = [
    { name: User.name, model: connection.model(User.name, UserSchema) },
    { name: UserSession.name, model: connection.model(UserSession.name, UserSessionSchema) },
    { name: PasswordReset.name, model: connection.model(PasswordReset.name, PasswordResetSchema) },
    { name: PaymentTransaction.name, model: connection.model(PaymentTransaction.name, PaymentTransactionSchema) },
  ];

  for (const { name, model } of globalModels) {
    console.log(`\n⚙️  Index pour '${model.collection.collectionName}' (${name})...`);
    try {
      await model.syncIndexes();
      const indexes = await model.collection.indexes();
      console.log(`   ✨ Index actifs (${indexes.length}):`);
      indexes.forEach((idx, i) => {
        const keys = JSON.stringify(idx.key);
        const unique = idx.unique ? ' [UNIQUE]' : '';
        const sparse = idx.sparse ? ' [SPARSE]' : '';
        const expire = idx.expireAfterSeconds !== undefined ? ` [TTL: ${idx.expireAfterSeconds}s]` : '';
        console.log(`      ${i + 1}. ${idx.name}: ${keys}${unique}${sparse}${expire}`);
      });
    } catch (err: any) {
      console.error(`   ❌ Erreur pour '${name}':`, err.message);
    }
  }

  // Nettoyage des collections tenant qui ne doivent PAS être dans le global (ex: profiles, trips)
  const tenantCollectionsInGlobal = ['profiles', 'trips'];
  for (const collName of tenantCollectionsInGlobal) {
    try {
      const collections = await connection.db.listCollections({ name: collName }).toArray();
      if (collections.length > 0) {
        const count = await connection.db.collection(collName).countDocuments();
        if (count === 0) {
          await connection.db.dropCollection(collName);
          console.log(`   🧹 Collection vide '${collName}' supprimée de la base globale.`);
        } else {
          console.log(`   ⚠️ Collection '${collName}' non vide (${count} docs) laissée intacte.`);
        }
      }
    } catch (e: any) {
      console.warn(`   Note lors du nettoyage de '${collName}':`, e.message);
    }
  }

  await connection.close();
  console.log(`\n🔒 Connexion fermée pour voyago_global`);
}

async function syncTenantDatabase(uri: string, label: string) {
  console.log(`\n======================================================`);
  console.log(`🏢 Synchronisation de la BASE TENANT (${label})...`);
  console.log(`======================================================`);

  const connection = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  console.log(`✅ Connecté à la base tenant: ${connection.name}`);

  // Modèles strictement Tenants
  const tenantModels = [
    { name: Trip.name, model: connection.model(Trip.name, TripSchema) },
    { name: Profile.name, model: connection.model(Profile.name, ProfileSchema) },
  ];

  for (const { name, model } of tenantModels) {
    console.log(`\n⚙️  Index pour '${model.collection.collectionName}' (${name})...`);
    try {
      await model.syncIndexes();
      const indexes = await model.collection.indexes();
      console.log(`   ✨ Index actifs (${indexes.length}):`);
      indexes.forEach((idx, i) => {
        const keys = JSON.stringify(idx.key);
        const unique = idx.unique ? ' [UNIQUE]' : '';
        const sparse = idx.sparse ? ' [SPARSE]' : '';
        const expire = idx.expireAfterSeconds !== undefined ? ` [TTL: ${idx.expireAfterSeconds}s]` : '';
        console.log(`      ${i + 1}. ${idx.name}: ${keys}${unique}${sparse}${expire}`);
      });
    } catch (err: any) {
      console.error(`   ❌ Erreur pour '${name}':`, err.message);
    }
  }

  // Nettoyage des collections globales qui ne doivent PAS être dans la base tenant (ex: users, user_sessions, etc.)
  const globalCollectionsInTenant = ['users', 'user_sessions', 'password_resets', 'payment_transactions'];
  for (const collName of globalCollectionsInTenant) {
    try {
      const collections = await connection.db.listCollections({ name: collName }).toArray();
      if (collections.length > 0) {
        const count = await connection.db.collection(collName).countDocuments();
        if (count === 0) {
          await connection.db.dropCollection(collName);
          console.log(`   🧹 Collection vide '${collName}' supprimée de la base tenant.`);
        } else {
          console.log(`   ⚠️ Collection '${collName}' non vide (${count} docs) laissée intacte.`);
        }
      }
    } catch (e: any) {
      console.warn(`   Note lors du nettoyage de '${collName}':`, e.message);
    }
  }

  await connection.close();
  console.log(`\n🔒 Connexion fermée pour ${label}`);
}

async function run() {
  const globalUri =
    process.env.MONGO_URI_GLOBAL ||
    process.env.MONGO_URL ||
    'mongodb://localhost:27017/voyago_global';

  const tenantUri =
    process.env.MONGO_URI_TENANT ||
    'mongodb://localhost:27017/voyago_tenants';

  console.log('🚀 Démarrage du script de synchronisation Multi-Tenant MongoDB Voyago 🦜');

  try {
    // 1. Base Globale (Auth, Users, Sessions, Reset, Payments)
    await syncGlobalDatabase(globalUri);

    // 2. Base Tenant par défaut (Trips, Profiles)
    await syncTenantDatabase(tenantUri, 'voyago_tenants (Default)');

    console.log('\n🎉 STRUCTURE MULTI-TENANT & INDEX PARFAITEMENT SYNCHRONISÉS SUR ATLAS ! 🦜✨\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

run();

