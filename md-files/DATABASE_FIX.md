# 🔧 Database Connection Fix

## Issue
The password `Postgre@7482` contains an `@` symbol which is a special character in URLs.

## Solution
The `@` symbol must be URL-encoded as `%40`.

## Fixed Configuration

### Correct Format:
```
postgresql://postgres:Postgre%407482@localhost:5433/chargewise
```

### Breakdown:
- **Protocol:** `postgresql://`
- **Username:** `postgres`
- **Password:** `Postgre%407482` (@ encoded as %40)
- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `chargewise`

## Files Updated
✅ `backend/.env`
✅ `backend/alembic.ini`
✅ `backend/.env.example`

## URL Encoding Reference

If your password contains special characters, encode them:

| Character | Encoded |
|-----------|---------|
| @ | %40 |
| : | %3A |
| / | %2F |
| ? | %3F |
| # | %23 |
| [ | %5B |
| ] | %5D |
| ! | %21 |
| $ | %24 |
| & | %26 |
| ' | %27 |
| ( | %28 |
| ) | %29 |
| * | %2A |
| + | %2B |
| , | %2C |
| ; | %3B |
| = | %3D |
| % | %25 |
| space | %20 |

## Test Connection

```bash
# Test with psql
psql -h localhost -p 5433 -U postgres -d chargewise

# Or test with Python
python -c "from sqlalchemy import create_engine; engine = create_engine('postgresql://postgres:Postgre%407482@localhost:5433/chargewise'); print('✅ Connection successful!' if engine.connect() else '❌ Failed')"
```

## Now Run Migration Again

```bash
cd backend
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial schema for ChargeWise AI
```

## Alternative: Change Password

If you prefer, you can change the PostgreSQL password to one without special characters:

```sql
-- Connect to PostgreSQL
psql -h localhost -p 5433 -U postgres

-- Change password
ALTER USER postgres PASSWORD 'SimplePassword123';
```

Then update `.env` and `alembic.ini`:
```
DATABASE_URL=postgresql://postgres:SimplePassword123@localhost:5433/chargewise
```

---

**Status:** ✅ Fixed - Ready to run migrations!
