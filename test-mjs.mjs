import pg from 'pg';
import fs from 'fs';

const client = new pg.Client({
    connectionString: 'postgresql://postgres:ASD123321DSAABDUSAMAD@db.qnouaodxzovzzclpzpmu.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const sql = fs.readFileSync('database_setup_sql.txt', 'utf8');
        await client.query(sql);
        console.log('SQL Executed Successfully');

        // verify
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='inventory' AND column_name IN ('source', 'type_specs', 'grammage', 'width')");
        console.log('Columns found:', res.rows.map(r => r.column_name));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
        process.exit(0);
    }
}
run();
