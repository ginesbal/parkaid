require('dotenv').config();

console.log('Environment Mobile Check:');
console.log('=================');
console.log('EXPO_PUBLIC_GOOGLE_PLACES_KEY:', !!process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY);
console.log('Key value:', process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY || 'NOT SET');
console.log('All env vars:', Object.keys(process.env).filter(k => 
    k.includes('GOOGLE') || 
    k.includes('DATABASE') || 
    k.includes('SUPABASE')
));