#!/usr/bin/env node
/**
 * Production Environment Variables Check
 * Run before deployment to verify all required env vars are set
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AMPLIFY_BUCKET',
  'REVALIDATE_SECRET_TOKEN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME',
];

const optionalEnvVars = [];

console.log('🔍 Checking production environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required vars
console.log('✅ Required variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('generate_')) {
    console.log(`   ❌ ${varName}: MISSING or PLACEHOLDER`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const masked = value.length > 10
      ? `${value.substring(0, 10)}...`
      : '***';
    console.log(`   ✅ ${varName}: ${masked}`);
  }
});

// Check optional vars
if (optionalEnvVars.length > 0) {
  console.log('\n⚠️  Optional variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('your_') || value.includes('generate_')) {
      console.log(`   ⚠️  ${varName}: Not set (optional)`);
      hasWarnings = true;
    } else {
      const masked = value.length > 10
        ? `${value.substring(0, 10)}...`
        : '***';
      console.log(`   ✅ ${varName}: ${masked}`);
    }
  });
}

// Security checks
console.log('\n🔐 Security checks:');

// Check NEXTAUTH_SECRET length
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (nextAuthSecret && nextAuthSecret.length < 32) {
  console.log('   ❌ NEXTAUTH_SECRET: Too short (minimum 32 characters)');
  hasErrors = true;
} else if (nextAuthSecret && nextAuthSecret !== 'your-secret-key-here-change-this-in-production') {
  console.log('   ✅ NEXTAUTH_SECRET: Length OK');
} else {
  console.log('   ❌ NEXTAUTH_SECRET: Still using placeholder');
  hasErrors = true;
}

// Check URLs
const nextAuthUrl = process.env.NEXTAUTH_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
  console.log('   ⚠️  NEXTAUTH_URL: Still using localhost');
  hasWarnings = true;
} else if (nextAuthUrl && nextAuthUrl.startsWith('https://')) {
  console.log('   ✅ NEXTAUTH_URL: Using HTTPS');
} else {
  console.log('   ❌ NEXTAUTH_URL: Must use HTTPS in production');
  hasErrors = true;
}

if (appUrl && appUrl.includes('localhost')) {
  console.log('   ⚠️  NEXT_PUBLIC_APP_URL: Still using localhost');
  hasWarnings = true;
} else if (appUrl && appUrl.startsWith('https://')) {
  console.log('   ✅ NEXT_PUBLIC_APP_URL: Using HTTPS');
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ FAILED: Please fix the errors above before deploying');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNING: Some optional variables are not set');
  console.log('✅ All required variables are set - safe to deploy');
  process.exit(0);
} else {
  console.log('✅ SUCCESS: All environment variables are properly configured');
  process.exit(0);
}
