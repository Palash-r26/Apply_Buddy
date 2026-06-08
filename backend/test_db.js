import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://palash:ZQH5XkJM272Qihlzcfe2n8MAX7BCE6zQ@dpg-d8d8jb4m0tmc73dm0bl0-a.singapore-postgres.render.com/palashdb',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error('Database Error:', err);
  } finally {
    await pool.end();
  }
}

test();
