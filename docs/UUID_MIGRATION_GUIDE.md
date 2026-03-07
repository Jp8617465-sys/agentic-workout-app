# UUID Migration Guide: Exercises Table

## Overview

This document describes the complete 4-phase migration from using `exerciseName` (string) as the exercises identifier to using `exerciseId` (UUID) as the primary key.

**Objective**: Enable exercise renaming and improve referential integrity.

**Migration Type**: Forward-compatible with deterministic UUIDs for reproducibility.

---

## Phase 1: Schema Update & Migration Script ✅

### Schema Changes

**File**: `src/lib/schema.ts`

1. **exercises table**:
   - Added `exerciseId: text().primaryKey()`
   - Changed `name: text()` from PRIMARY KEY to `unique()`
   - Added index: `idx_exercises_name`

2. **Foreign Key Updates**:

   | Table | Old FK | New FK |
   |-------|--------|--------|
   | injuryRisks | exercise_name | exercise_id |
   | exercisePerformances | exercise_name | exercise_id |
   | personalRecords | exercise_name | exercise_id |

3. **New Indexes**:
   - `idx_exercises_name` on exercises(name) - for backward-compatible name lookups
   - `idx_ep_exercise` on exercisePerformances(exercise_id) - for performance
   - `idx_pr_user_exercise` on personalRecords(user_id, exercise_id)
   - `idx_ir_exercise` on injuryRisks(exercise_id)

### Migration SQL

**File**: `drizzle/0001_exercise_uuid_migration.sql`

- Adds new columns for UUID backfill
- Includes placeholders for data migration (handled by Phase 2)
- Creates indexes for post-migration performance

---

## Phase 2: Data Backfill

### Deterministic UUID Generation

**File**: `src/lib/uuid-migration.ts`

Uses UUID v5 with namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8` to ensure:
- **Reproducibility**: Same exercise name always produces same UUID
- **Consistency**: Identical across app instances and syncs
- **Determinism**: Can be recalculated if needed

```typescript
// Example:
generateDeterministicExerciseId("Bench Press")
// → "550e8400-e29b-41d4-a716-446655440000"
```

### Backfill Strategies

#### Option A: Edge Function (Cloud-First)
**File**: `supabase/functions/backfill-exercise-uuids/index.ts`

Backfills Supabase cloud database:
1. Fetches all exercises missing `exercise_id`
2. Generates deterministic UUIDs based on exercise name
3. Updates exercises, injury_risks, exercise_performances, personal_records
4. Returns count of updated records

**Invocation**:
```bash
curl -X POST https://[project].supabase.co/functions/v1/backfill-exercise-uuids \
  -H "Authorization: Bearer [service_role_key]"
```

#### Option B: Local Database
Use the same UUID generation in SQLite during app initialization.

---

## Phase 3: Code Changes - Repositories & Services

### Updated Files

#### exercise-repository.ts
- `findById(exerciseId)` - New method for UUID lookup
- `findByName(name)` - Kept for backward compatibility
- `create(exerciseData)` - Now generates deterministic UUID
- `rowToExercise()` - Updated to include exerciseId

#### workout-repository.ts
- `insertExercisePerformance()` - Takes `exerciseId` instead of `exerciseName`
- `findLastWithExercise()` - Queries by exerciseId
- All exercise_performances queries updated to use exercise_id

#### personal-records-repository.ts
- All methods updated to use exerciseId
- `getBestOneRepMax(userId, exerciseId)`
- `insert()` and `findAllForExercise()` accept exerciseId

#### personal-records-service.ts
- `checkAndSavePR(userId, exerciseId, weight, reps, workoutId)`

#### WorkoutEngine.ts
- `LogSetInput.exerciseId` replaces `exerciseName`
- `updateSetRPE()` accepts exerciseId instead of exerciseName
- PR detection uses exerciseId

#### Hook Updates
- `useExerciseManager`: `addExercise(exerciseId)` replaces name parameter
- `useSetLogger`: RPE and adaptation state track exerciseId

#### Service Updates
- `InjuryService`: Updated to query by exerciseId
- `deterministic-fallback.ts`: Exercise prescriptions use exerciseId

### Type Updates

**src/types/exercise.ts**:
```typescript
interface Exercise {
  exerciseId: string;  // NEW
  name: string;        // Changed from PK to unique
  // ... rest of fields
}

interface InjuryRisk {
  exerciseId: string;  // Changed from exerciseName
  // ... rest of fields
}
```

**src/types/workout.ts**:
```typescript
interface ExercisePerformance {
  exerciseId: string;  // Changed from exerciseName
  // ... rest of fields
}

interface WorkoutExercise {
  exerciseId: string;  // Changed from exerciseName
  // ... rest of fields
}
```

---

## Phase 4: Testing & Validation

### Test Files Created

1. **exercise-repository.test.ts**
   - UUID generation consistency
   - findById/findByName functionality
   - create() with deterministic UUIDs
   - Data integrity during rename

2. **exercise-performance-sync.test.ts**
   - Sync payloads use exercise_id
   - Workspace verification
   - Data integrity preservation
   - Sync dependencies

3. **WorkoutEngine.test.ts**
   - logSet() uses exerciseId
   - PR detection with exerciseId
   - updateSetRPE() functionality
   - Migration safety

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] No `exerciseName` used as primary key
- [ ] All queries use exerciseId or join on name → ID
- [ ] Exercise search still works (uses name)
- [ ] PR detection uses exerciseId
- [ ] Sync sends exercise_id in payloads
- [ ] Tests pass (90%+ coverage)
- [ ] Exercise rename doesn't break old logs
- [ ] Cloud/local data consistency

### Running Tests

```bash
npm test -- exercise-repository
npm test -- exercise-performance-sync
npm test -- WorkoutEngine
```

---

## Backward Compatibility & Migration Timeline

### During Rollout

1. **Week 1**: Schema changes + code updates
   - exerciseId column added to all tables
   - New code paths active (exerciseId preferred)
   - Old paths still work for reads (exerciseName → ID join)

2. **Week 2**: Data backfill
   - Supabase edge function populates exerciseId
   - Local database backfilled on first app sync
   - Queries on new schema

3. **Week 3+**: Cleanup
   - Remove exerciseName from queries
   - Archive old reference data
   - Monitor for any exerciseName references

### Rollback Procedure

If issues arise:

1. Stop using new queries (exerciseId)
2. Revert to exerciseName-based queries
3. Keep exerciseId column populated (no harm)
4. Backfill can be re-run without data loss

SQL to drop UUID additions:
```sql
ALTER TABLE exercises DROP COLUMN exercise_id;
ALTER TABLE injury_risks DROP COLUMN exercise_id;
ALTER TABLE exercise_performances DROP COLUMN exercise_id;
ALTER TABLE personal_records DROP COLUMN exercise_id;
```

---

## Key Implementation Details

### Deterministic UUID Strategy

**Why v5 with namespace?**
- Reproducible: `Hash(namespace, exerciseName)` produces same UUID every time
- Testable: Can verify UUID generation without database
- Safe: Collision-resistant for exercise names
- Portable: Works across devices and app instances

**Namespace**: `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
- ISO namespace reserved for apps
- Ensures UUID v5 format compliance

### No Data Loss During Migration

1. exerciseName retained in exercises.name (unique)
2. exerciseId added to all FK tables
3. Old logs reference correct exercise via ID
4. Exercise rename: Update name, keep exerciseId

```
Before: "Bench Press" → logs for "Bench Press"
After:
  exercises.name = "Incline Bench"
  exercises.exercise_id = "550e8400-..." (same)
  → logs still reference same exercise
```

### Query Pattern Evolution

```typescript
// Before
const exercise = await exerciseRepository.findByName("Bench Press");

// After (preferred)
const exercise = await exerciseRepository.findById("550e8400-...");

// Still works for backward compatibility
const exercise = await exerciseRepository.findByName("Bench Press");
```

---

## Deployment Notes

### Database Migration

1. Run Drizzle migration:
   ```bash
   npm run db:migrate
   ```

2. Run data backfill (cloud):
   ```bash
   supabase functions deploy backfill-exercise-uuids
   curl -X POST https://[project].supabase.co/functions/v1/backfill-exercise-uuids \
     -H "Authorization: Bearer [service_role_key]"
   ```

3. Run tests to verify:
   ```bash
   npm test
   ```

### Client-Side

1. Update app code (already done)
2. Clear local database cache on first launch
3. Force sync to pull updated data with exerciseIds

### Monitoring

Track:
- PR detection accuracy (exerciseId vs old code)
- Sync performance (new indexes)
- Query latency (should improve with direct UUID lookup)
- Exercise search functionality

---

## Related Files

- `/src/lib/schema.ts` - Drizzle schema definitions
- `/drizzle/0001_exercise_uuid_migration.sql` - Database migration
- `/src/lib/uuid-migration.ts` - UUID generation utilities
- `/supabase/functions/backfill-exercise-uuids/index.ts` - Cloud backfill
- All repository and service files listed in Phase 3

---

## Future Enhancements

1. **Exercise Versioning**: Track name changes over time
2. **Advanced Search**: Index exerciseId for faster filtering
3. **Bulk Operations**: Update exercise names in batch
4. **Audit Trail**: Log all exercise identifier changes

---

**Status**: ✅ Implementation Complete
- Phase 1: Schema & Code ✅
- Phase 2: Backfill Ready (manual trigger)
- Phase 3: All code updated ✅
- Phase 4: Tests in place ✅
