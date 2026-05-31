require('dotenv').config();

console.log('Environment Check:');
console.log('=================');
console.log('GOOGLE_PLACES_API_KEY exists:', !!process.env.GOOGLE_PLACES_API_KEY);
console.log('Key value:', process.env.GOOGLE_PLACES_API_KEY || 'NOT SET');
console.log('All env vars:', Object.keys(process.env).filter(k => 
    k.includes('GOOGLE') || 
    k.includes('DATABASE') || 
    k.includes('SUPABASE')
));